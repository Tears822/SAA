import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { SPFI } from "@pnp/sp";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel";

declare const $: any;

export interface IChairmanCardProps {
  sp: SPFI;
  listTitle: string;
  webUrl: string;
}

interface ILeaderItem {
  Id: number;
  Title: string;
  Position: string;
  ShortBio: string;
  LongBio: string;
  ImageUrl: string;
}

const ChairmanCard: React.FC<IChairmanCardProps> = ({ sp, listTitle, webUrl }) => {
  const [leaders, setLeaders] = useState<ILeaderItem[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  /** Load leaders */
  const loadLeaders = async () => {
    try {
      const items = await sp.web.lists
        .getByTitle(listTitle)
        .items.select("Id", "Title", "Position", "ShortBio", "LongBio", "ImageUrl")
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
          Position: i.Position,
          ShortBio: i.ShortBio,
          LongBio: i.LongBio,
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

      // destroy if init already
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

  if (!leaders.length) return <div>Loading...</div>;

  return (
    <div className="chairmanCard">
      <div className="slick-wrapper" ref={sliderRef}>
        {leaders.map((l) => (
          <div key={l.Id}>
            <div className="chairman-content">
                <div className="left">
                  <h2>{l.Title}</h2>
                  <h4>{l.Position}</h4>
                  <p>{l.LongBio}</p>
                </div>
                <div className="right">
                  <img
                    src={l.ImageUrl || require("../../theme/images/Pic.Leader.jpg")}
                    alt={l.Title}
                  />
                </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChairmanCard;