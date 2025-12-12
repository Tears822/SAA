import * as React from "react";
import { FC } from "react";
import { Link } from "react-router-dom";
import './newsWebpart.scss';
import { Icon } from "@fluentui/react";

export interface INewsItem {
    id: number;
    title: string;
    titleAr: string;
    subtitle?: string;
    subtitleAr?: string;
    description: string;
    descriptionAr: string;
    date: string;
    image: string;
}

export const featuredNews: INewsItem = {
    id: 1,
    title: "New Sharjah Airport Service",
    titleAr: "خدمة جديدة في مطار الشارقة",
    subtitle: "Home Check-in",
    subtitleAr: "تسجيل الوصول من المنزل",
    description: `
                         Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.

                            <br />
                            Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.
`,
    descriptionAr: `
لوريم إيبسوم دولور الجلوس أميت كونسيكتور. Hac ut velit diam nunc netus libero. Ultricies تؤدي إلى عدم وجود معرف convallis. إرات ديام ودهليز الجلوس. Amet sit felis at sit egestas a ullamcorper sed ornare Platea. 

<br /> 
لوريم إيبسوم دولور الجلوس أميت كونسيكتور. Hac ut velit diam nunc netus libero. Ultricies تؤدي إلى عدم وجود معرف convallis. إرات ديام ودهليز الجلوس. Amet sit felis at sit egestas a ullamcorper sed ornare Platea.
  `,
    date: "Sep 05, 2022",
    image: require("../../theme/images/news1.jpg")
};

export const newsList: INewsItem[] = [
    {
        id: 2,
        title: "Internal Job Announcement",
        titleAr: "إعلان وظيفة داخلية",
        subtitle: "New Vacancy: Terminal Operations Manager",
        subtitleAr: "وظيفة شاغرة: مدير عمليات الصالة",
        description: "",
        descriptionAr: "",
        date: "Sep 01, 2022",
        image: require("../../theme/images/news1.jpg")
    },
    {
        id: 3,
        title: "HR Announcement - Meet Our New Colleagues",
        titleAr: "إعلان الموارد البشرية - تعرّف على زملائنا الجدد",
        subtitle: "Safety Department",
        subtitleAr: "قسم السلامة",
        description: "",
        descriptionAr: "",
        date: "Aug 28, 2022",
        image: require("../../theme/images/news1.jpg")
    },
    {
        id: 4,
        title: "Events Announcement - Join Us in Celebrating",
        titleAr: "إعلان الفعاليات - شاركنا الاحتفال",
        subtitle: "UAE National Day",
        subtitleAr: "اليوم الوطني الإماراتي",
        description: "",
        descriptionAr: "",
        date: "Aug 20, 2022",
        image: require("../../theme/images/news1.jpg")
    }
];

const NewsBox: FC<{ lang?: string }> = ({ lang = "en" }) => {
    const isAr = lang === "ar";

    return (
        <>
            <div className="col-12 col-md-6 col-lg-5">
                <img className="newsBigImg" src={require("../../theme/images/newsSide.jpg")} alt="news" />
            </div>

            <div className="col-12 col-md-6 col-lg-7">

                <div className="component-header">
                    <h2>{isAr ? "الأخبار والإعلانات" : "News & Announcements"}</h2>

                    <Link to="/" className="viewAllBtn">
                        {isAr ? "عرض الكل" : "View all"}
                        <Icon iconName="ChevronRightMed" />
                    </Link>
                </div>

                <div className="News-home">

                    {/* Featured Big News */}
                    <div className="news-home-big">
                        <h5>{isAr ? featuredNews.titleAr : featuredNews.title}</h5>
                        <h3>{isAr ? featuredNews.subtitleAr : featuredNews.subtitle}</h3>
                        <p dangerouslySetInnerHTML={{ __html: isAr ? featuredNews.descriptionAr : featuredNews.description}}></p>
                        <small>{featuredNews.date}</small>
                    </div>

                    {/* News List */}
                    <div className="news-list-home">
                        {newsList.map((item) => (
                            <div className="news-item-home" key={item.id}>
                                <img src={item.image} alt="news" />

                                <div>
                                    <h5>{isAr ? item.titleAr : item.title}</h5>

                                    <Link to="/">
                                        {isAr ? item.subtitleAr : item.subtitle}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
};

export default NewsBox;
