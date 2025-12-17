import * as React from "react";
import PortalTiles from "../../webparts/portalTiles/components/PortalTiles";
// import NewsBox from "../../webparts/news/newsBox";
import NewsBox from "../../webparts/news/newsBox1";
import SurveyBox from "../../webparts/survey/surveyBox";
import EventsBox from "../../webparts/Events/eventsBox";
import AskSupport from "../../webparts/askSupport/component/askSupport";
import ChairmanCard from "../../webparts/chairmanCard/components/ChairmanCard";
import CurrentUserCard from "../../webparts/currentUserCard/components/CurrentUserCard";
// import { SPFI } from "@pnp/sp/presets/all";



export interface IHomePageState {
    Fullheight: any;
}


export default class HomePage extends React.Component<any, IHomePageState> {


    constructor(props: any) {
        super(props);
        this.state = {
            Fullheight: 700,
        };
    }

    public componentDidMount(): void {
     
    }


    public render() {
        return (
            <>
                <div className="sectionContent">
                    <div className="container-fluid">
                        {/* User Card & Chairman Card Row */}
                        <div className="row">
                            <div className="col-12 col-md-4 col-lg-3">
                                <CurrentUserCard sp={this.props.sp} webUrl={this.props.webUrl} />
                            </div>
                            <div className="col-12 col-md-8 col-lg-9">
                                <ChairmanCard sp={this.props.sp} webUrl={this.props.webUrl} listTitle="Leaders" />
                            </div>
                        </div>

                        {/* Ask Support Row */}
                        <div className="row">
                            <div className="col-12">
                                <AskSupport />
                            </div>
                        </div>

                        {/* News Box Row */}
                        <div className="row">
                                <NewsBox sp={this.props.sp} listTitle="Site Pages" top={4}  />
                        </div>

                        {/* Portal Tiles Row */}
                        <div className="row">
                            <div className="col-12">
                                <PortalTiles sp={this.props.sp} webUrl={this.props.webUrl} listTitle="PortalTiles" />
                            </div>
                        </div>

                        {/* Survey & Events Row */}
                        <div className="row">
                            <div className="col-12 col-md-6 col-lg-4">
                                <SurveyBox />
                            </div>
                           
                                <EventsBox />
                        </div>

                    </div>
                </div>
            </>
        );

    }
}