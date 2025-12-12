import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { SPFI } from "@pnp/sp";
import "./ChairmanCardWebPart.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel";

declare const $: any;

export interface IChairmanCardProps {
  sp: SPFI;
  listTitle: string;
  webUrl: string;
  lang?: string;
}

interface ILeaderItem {
  Id: number;
  Title: string;
  TitleAr: string;
  Position: string;
  PositionAr: string;
  ShortBio: string;
  ShortBioAr: string;
  LongBio: string;
  LongBioAr: string;
  ImageUrl: string;
}

const ChairmanCard: React.FC<IChairmanCardProps> = ({ sp, listTitle, webUrl, lang = "en" }) => {

  const isAr = window.location.href.toLowerCase().includes("/ar/");

  const [leaders, setLeaders] = useState<ILeaderItem[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  /** Load leaders */
  const loadLeaders = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle(listTitle)
        .items.select(
          "Id",
          "Title",
          "TitleAr",
          "Position",
          "PositionAr",
          "ShortBio",
          "ShortBioAr",
          "LongBio",
          "LongBioAr",
          "ImageUrl"
        )
        .orderBy("Sort", true)();

      const parsed: ILeaderItem[] = items.map((i: any) => {
        let img = "";

        if (i.ImageUrl) {
          try {
            const json = JSON.parse(i.ImageUrl);
            if (json.fileName) {
              img = `${webUrl}/Lists/${encodeURIComponent(listTitle)}/Attachments/${i.Id}/${json.fileName}`;
            }
          } catch {
            img = "";
          }
        }

        return {
          Id: i.Id,
          Title: i.Title,
          TitleAr: i.TitleAr,
          Position: i.Position,
          PositionAr: i.PositionAr,
          ShortBio: i.ShortBio,
          ShortBioAr: i.ShortBioAr,
          LongBio: i.LongBio,
          LongBioAr: i.LongBioAr,
          ImageUrl: img,
        };
      });

      setLeaders(parsed);
    } catch (err) {
      console.error("Error loading leaders", err);
    }
  };

  /** init slider */
  useEffect(() => {
    if (leaders.length > 0 && sliderRef.current) {
      const $slider = $(sliderRef.current);

      if ($slider.hasClass("slick-initialized")) {
        $slider.slick("unslick");
      }

      $slider.slick({
        dots: true,
        arrows: false,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 6000,
        adaptiveHeight: true,
        pauseOnHover: true,
        swipeToSlide: true,
      });
    }
  }, [leaders]);

  useEffect(() => {
    loadLeaders();
  }, []);

  if (!leaders.length)
    return (
      <div className="loading-spinner"><div></div><div></div><div></div><div></div></div>
    );

  return (
    <div className={`chairmanCard ${isAr ? "rtl" : ""}`}>
      <div className="slick-wrapper" ref={sliderRef}>
        {leaders.map((l) => (
          <div key={l.Id}>
            <div className="chairman-content">
              <div className="left">
                <h2>{isAr ? l.TitleAr : l.Title}</h2>
                <h4>{isAr ? l.PositionAr : l.Position}</h4>

                <p>{isAr ? l.LongBioAr : l.LongBio}</p>
              </div>

              <div className="right">
                <img src={l.ImageUrl} alt={l.Title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChairmanCard;
