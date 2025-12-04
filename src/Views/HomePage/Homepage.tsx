import * as React from "react";



export interface IHomePageState {
    Fullheight: any;
}


export default class HomePage extends React.Component<any, IHomePageState>{


    constructor(props:any) {
        super(props);
        this.state = {
            Fullheight: 700,
        };
    }

    public componentDidMount(): void {

        this.setState({
            Fullheight: document.getElementsByTagName("body")[0].clientHeight - 267,
        });
    }


    public render() {
        return (
            <>

                <div style={{ minHeight: this.state.Fullheight }}>
                    <div className="sectionContent">
                        </div>
                </div>

            </>
        );

    }
}