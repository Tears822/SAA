import * as React from "react";
import CurrentUserCard from "../../webparts/currentUserCard/CurrentUserCard";
import ChairmanCard from "../../webparts/chairmanCard/ChairmanCard";
import AskSupport from "../../webparts/askSupport/askSupport";



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
        console.log(this.props.contextProp)
    }


    public render() {
        return (
            <>
                <div className="sectionContent">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-4 col-md-4">
                                <CurrentUserCard sp={this.props.sp} webUrl={this.props.contextProp.web} />

                            </div>
                            <div className="col-8 col-md-8">

                                <ChairmanCard sp={this.props.sp} webUrl={this.props.contextProp.web} listTitle="Leaders" />
                            </div>
                        </div>
                        <div className="row">
                            <AskSupport />
                        </div>
                    </div>
                </div>
            </>
        );

    }
}