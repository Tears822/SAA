import * as React from "react";
import PortalTiles from "../../webparts/portalTiles/components/PortalTiles";
import NewsBox from "../../webparts/news/newsBox";
import SurveyBox from "../../webparts/survey/surveyBox";
import EventsBox from "../../webparts/Events/eventsBox";
import AskSupport from "../../webparts/askSupport/component/askSupport";
import ChairmanCard from "../../webparts/chairmanCard/components/ChairmanCard";
import CurrentUserCard from "../../webparts/currentUserCard/components/CurrentUserCard";



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
                                <CurrentUserCard lang={this.props.lang} sp={this.props.sp} webUrl={this.props.webUrl} />
                            </div>
                            <div className="col-12 col-md-8 col-lg-9">
                                <ChairmanCard lang={this.props.lang}  sp={this.props.sp} webUrl={this.props.webUrl} listTitle="Leaders" />
                            </div>
                        </div>

                        {/* Ask Support Row */}
                        <div className="row">
                            <div className="col-12">
                                <AskSupport  lang={this.props.lang} />
                            </div>
                        </div>

                        {/* News Box Row */}
                        <div className="row">
                                <NewsBox  lang={this.props.lang} />
                        </div>

                        {/* Portal Tiles Row */}
                        <div className="row">
                            <div className="col-12">
                                <PortalTiles  lang={this.props.lang} sp={this.props.sp} webUrl={this.props.webUrl} listTitle="PortalTiles" />
                            </div>
                        </div>

                        {/* Survey & Events Row */}
                        <div className="row">
                            <div className="col-12 col-md-6 col-lg-4">
                                <SurveyBox  lang={this.props.lang} />
                            </div>
                           
                                <EventsBox  lang={this.props.lang} />
                        </div>

                    </div>
                </div>
            </>
        );

    }
}