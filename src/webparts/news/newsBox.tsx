import { Icon } from "@fluentui/react";
import * as React from "react";
import { FC } from "react";
import { Link } from "react-router-dom";


const NewsBox: FC<{}> = ({ }) => {


    return (
        <>
            <div className="col-5 col-md-5">
                <img className="newsBigImg" src={require("../../theme/images/newsSide.jpg")} alt="news" />
            </div>
            <div className="col-7 col-md-7">

                <div className="component-header">
                    <h2>News & Announcements</h2>
                    <Link to="/" className="viewAllBtn">
                        View all
                        <Icon iconName="ChevronRightMed" />
                    </Link>
                </div>

                <div className="News-home">
                    <div className="news-home-big">
                        <h5>New Sharjah Airport Service</h5>
                        <h3>Home Check-in</h3>
                        <p>
                            Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.

                            <br />
                            Lorem ipsum dolor sit amet consectetur. Hac ut velit diam nunc netus libero. Ultricies consequat nulla id convallis. Erat diam et vestibulum adipiscing sit. Amet sit felis at sit egestas a ullamcorper sed ornare platea.

                        </p>
                        <small>Sep 05,  2022</small>
                    </div>
                    <div className="news-list-home">
                        <div className="news-item-home">
                            <img src={require("../../theme/images/news1.jpg")} alt="news" />
                            <div>
                                <h5>Internal Job Announcement</h5>
                                <Link to="/">New Vacancy: Terminal Operations Manager</Link>
                            </div>
                        </div>
                        <div className="news-item-home">
                            <img src={require("../../theme/images/news1.jpg")} alt="news" />
                            <div>
                                <h5>HR Announcement - Meet Our New Colleagues</h5>
                                <Link to="/">Safety Department</Link>
                            </div>
                        </div>
                        <div className="news-item-home">
                            <img src={require("../../theme/images/news1.jpg")} alt="news" />
                            <div>
                                <h5>Events Announcement - Join Us in Celebrating</h5>
                                <Link to="/">UAE National Day</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default NewsBox;
