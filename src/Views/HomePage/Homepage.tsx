import * as React from "react";



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

                </div>
            </>
        );

    }
}