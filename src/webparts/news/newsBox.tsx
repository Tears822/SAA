import * as React from "react";
import { FC, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
import "./newsWebpart.scss";
import { Icon } from "@fluentui/react";

import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export interface INewsItem {
  id: number;
  title: string;
  // titleAr: string;
  subtitle?: string;
  // subtitleAr?: string;
  description: string;
  // descriptionAr: string;
  date: string;
  image: string;
  url?: string;
}

interface INewsBoxProps {
  spfxContext: any;
  top?: number;
}


// export const featuredNews: INewsItem = {
//     id: 1,
//     title: "New Sharjah Airport Service",
//     titleAr: "خدمة جديدة في مطار الشارقة",
//     subtitle: "Home Check-in",
//     subtitleAr: "تسجيل الوصول من المنزل",
//     description: `
//                          Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.

//                             <br />
//                             Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.
// `,
//     descriptionAr: `
// لوريم إيبسوم دولور الجلوس أميت كونسيكتور. Hac ut velit diam nunc netus libero. Ultricies تؤدي إلى عدم وجود معرف convallis. إرات ديام ودهليز الجلوس. Amet sit felis at sit egestas a ullamcorper sed ornare Platea.

// <br />
// لوريم إيبسوم دولور الجلوس أميت كونسيكتور. Hac ut velit diam nunc netus libero. Ultricies تؤدي إلى عدم وجود معرف convallis. إرات ديام ودهليز الجلوس. Amet sit felis at sit egestas a ullamcorper sed ornare Platea.
//   `,
//     date: "Sep 05, 2022",
//     image: require("../../theme/images/news1.jpg")
// };

// export const newsList: INewsItem[] = [
//     {
//         id: 2,
//         title: "Internal Job Announcement",
//         titleAr: "إعلان وظيفة داخلية",
//         subtitle: "New Vacancy: Terminal Operations Manager",
//         subtitleAr: "وظيفة شاغرة: مدير عمليات الصالة",
//         description: "",
//         descriptionAr: "",
//         date: "Sep 01, 2022",
//         image: require("../../theme/images/news1.jpg")
//     },
//     {
//         id: 3,
//         title: "HR Announcement - Meet Our New Colleagues",
//         titleAr: "إعلان الموارد البشرية - تعرّف على زملائنا الجدد",
//         subtitle: "Safety Department",
//         subtitleAr: "قسم السلامة",
//         description: "",
//         descriptionAr: "",
//         date: "Aug 28, 2022",
//         image: require("../../theme/images/news1.jpg")
//     },
//     {
//         id: 4,
//         title: "Events Announcement - Join Us in Celebrating",
//         titleAr: "إعلان الفعاليات - شاركنا الاحتفال",
//         subtitle: "UAE National Day",
//         subtitleAr: "اليوم الوطني الإماراتي",
//         description: "",
//         descriptionAr: "",
//         date: "Aug 20, 2022",
//         image: require("../../theme/images/news1.jpg")
//     }
// ];

// const NewsBox: FC<{}> = ({ }) => {
//     const isAr = window.location.href.toLowerCase().includes("/ar/");

//     return (
//         <>
//             <div className="col-12 col-md-6 col-lg-5">
//                 <img className="newsBigImg" src={require("../../theme/images/newsSide.jpg")} alt="news" />
//             </div>

//             <div className="col-12 col-md-6 col-lg-7">

//                 <div className="component-header">
//                     <h2>{isAr ? "الأخبار والإعلانات" : "News & Announcements"}</h2>

//                     <Link to="https://v0tq5.sharepoint.com/sites/HubSite/_layouts/15/news.aspx" className="viewAllBtn">
//                         {isAr ? "عرض الكل" : "View all"}
//                         <Icon iconName="ChevronRightMed" />
//                     </Link>
//                 </div>

//                 <div className="News-home">

//                     {/* Featured Big News */}
//                     <div className="news-home-big">
//                         <h5>{isAr ? featuredNews.titleAr : featuredNews.title}</h5>
//                         <h3>{isAr ? featuredNews.subtitleAr : featuredNews.subtitle}</h3>
//                         <p dangerouslySetInnerHTML={{ __html: isAr ? featuredNews.descriptionAr : featuredNews.description }}></p>
//                         <small>{featuredNews.date}</small>
//                     </div>

//                     {/* News List */}
//                     <div className="news-list-home">
//                         {newsList.map((item) => (
//                             <div className="news-item-home" key={item.id}>
//                                 <img src={item.image} alt="news" />

//                                 <div>
//                                     <h5>{isAr ? item.titleAr : item.title}</h5>

//                                     <Link to="/">
//                                         {isAr ? item.subtitleAr : item.subtitle}
//                                     </Link>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>

//                 </div>
//             </div>
//         </>
//     );
// };

const NewsBox: FC<INewsBoxProps> = ({ spfxContext, top = 4 }) => {
  const isAr = window.location.href.toLowerCase().includes("/ar/");

  const sp: SPFI = useMemo(
    () => spfi().using(SPFx(spfxContext)),
    [spfxContext]
  );

  const [items, setItems] = useState<INewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  //   useEffect(() => {
  //     const loadNews = async () => {
  //       const results = await sp.web.lists
  //         .getByTitle("Site Pages")
  //         .items.select(
  //           "Id",
  //           "Title",
  //           "Description",
  //           "BannerImageUrl",
  //           "FirstPublishedDate",
  //           "FileRef"
  //         )
  //         .filter("PromotedState eq 2")
  //         .orderBy("FirstPublishedDate", false)
  //         .top(top)();

  //       const mapped: INewsItem[] = results.map((n: any) => ({
  //         id: n.Id,
  //         title: n.Title,
  //         description: n.Description,
  //         date: n.FirstPublishedDate
  //           ? new Date(n.FirstPublishedDate).toLocaleDateString()
  //           : "",
  //         image:
  //           typeof n.BannerImageUrl === "string"
  //             ? n.BannerImageUrl
  //             : n.BannerImageUrl?.Url,
  //         url: n.FileRef,
  //       }));

  //       setItems(mapped);
  //       setLoading(false);
  //     };

  //     loadNews().catch(() => setLoading(false));
  //   }, [sp, top]);

  useEffect(() => {
  if (!sp) return; // <-- IMPORTANT: don't call sp.web if sp is null/undefined

  let cancelled = false;

  const loadNews = async () => {
    try {
      if (!cancelled) setLoading(true);

      const listTitle = "Site Pages";

      const test = await sp.web.lists
        .getByTitle(listTitle)
        .items.select("Id", "Title", "FileRef", "PromotedState", "FirstPublishedDate")
        .orderBy("FirstPublishedDate", false)
        .top(10)();

      console.log("[News] Test items (no filter):", test);

      // ... your filtered query here ...

    } catch (e) {
      console.log("[News] Error:", e);
      if (!cancelled) setItems([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  loadNews();

  return () => { cancelled = true; };
}, [sp, top]);



  const featured = items[0];
  const list = items.slice(1);

  return (
    <div className="News-home">
      <div className="component-header">
        <h2>{isAr ? "الأخبار والإعلانات" : "News & Announcements"}</h2>
      </div>

      {loading && <div>{isAr ? "جارٍ التحميل..." : "Loading..."}</div>}

      {!loading && featured && (
        <>
          <div className="news-home-big">
            <h3>{featured.title}</h3>
            {featured.description && (
              <p dangerouslySetInnerHTML={{ __html: featured.description }} />
            )}
            <small>{featured.date}</small>
          </div>

          <div className="news-list-home">
            {list.map((item) => (
              <div key={item.id} className="news-item-home">
                {item.image && <img src={item.image} alt="" />}
                <div>
                  <h5>{item.title}</h5>
                  <a href={item.url}>
                    {isAr ? "عرض التفاصيل" : "View details"}
                    <Icon iconName="ChevronRightMed" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsBox;
