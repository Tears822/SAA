import * as React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import HeaderPageComponent from '../../../CoreComponents/Header';
import { FooterPageComponent } from '../../../CoreComponents/Footer';
import { Error404Component } from '../../../CoreComponents/Error404';
import Homepage from '../../../Views/HomePage/Homepage';
import { spfi, SPFx } from "@pnp/sp/presets/all";



import "../../../theme/grid.scss";
import "../../../theme/SPFXstyle.scss";

export interface ITawasolPortalWebPartProps {
  description: string;
  context: any;
}

const TawasolPortal: React.FC<ITawasolPortalWebPartProps> = (props) => {
  const sp = spfi().using(SPFx(props.context));

  return (
    <div className="tawasolPortal" id="appMaster">
      <div className="wrapper">
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <Router>
          <HeaderPageComponent sp={sp} contextProp={props.context}/>

          <Routes>
            <Route path="/" element={<Homepage sp={sp} contextProp={props.context} />} />
            <Route path="*" element={<Error404Component />} />
          </Routes>

          <FooterPageComponent />
        </Router>

      </div>
    </div>
  );
};

export default TawasolPortal;
