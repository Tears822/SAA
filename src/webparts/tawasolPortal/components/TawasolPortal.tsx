import * as React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { Error404Component } from '../../../CoreComponents/Error404';
import Homepage from '../../../Views/HomePage/Homepage';
import { spfi, SPFx } from "@pnp/sp/presets/all";
import { SPComponentLoader } from '@microsoft/sp-loader';



import "../../../theme/grid.scss";

export interface ITawasolPortalWebPartProps {
  description: string;
  context: any;
  webUrl:any;
}

const TawasolPortal: React.FC<ITawasolPortalWebPartProps> = (props) => {
  const sp = spfi().using(SPFx(props.context));
  
SPComponentLoader.loadCss(
  `${props.context.pageContext.web.absoluteUrl}/SiteAssets/fonts/proximaNova.css`
);

  return (
    <div className="tawasolPortal" id="appMaster">
      <div className="wrapper">
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        /> */}
        <Router>
          <Routes>
            <Route path="/" element={<Homepage sp={sp} context={props.context} webUrl={props.webUrl}/>} />
            <Route path="*" element={<Error404Component />} />
          </Routes>
        </Router>

      </div>
    </div>
  );
};

export default TawasolPortal;
