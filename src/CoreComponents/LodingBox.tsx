import * as React from 'react';
import { ProgressIndicator } from "@fluentui/react";

const intervalDelay = 100;
const intervalIncrement = 0.01;


interface loadingProps {
    childLoader?: boolean;
    stepLoader?: boolean;
}

export const LoadingBoxComponent: React.FC<loadingProps> =
    (props) => {
        const [percentComplete, setPercentComplete] = React.useState(0);
        React.useEffect(() => {
            const id = setInterval(() => {
              setPercentComplete((intervalIncrement + percentComplete) % 1);
            }, intervalDelay);
            return () => {
              clearInterval(id);
            };
          });

        return (
            <>
                {props.stepLoader != true ?

                    <div className={props.childLoader == true ? "loadingBox loadingBoxcontainer" : "loadingBox"}>
                        <div></div>
                        <div></div>
                    </div>

                    :
                    <div className="progressLoader">
                        <div className="progressBox">

                            <ProgressIndicator label="Generating document" 
                            description={percentComplete >= 0  &&  percentComplete < 0.33 ? "Submit request ": 
                                        percentComplete >= 0.33  &&  percentComplete < 0.66 ? "Generate word document":  
                                        percentComplete >= 0.66  &&  percentComplete < 1 ? "Prepare download link" : "please wait..."} 
 percentComplete={percentComplete} />




                        </div>
                    </div>
                    }
            </>
        );
    };
