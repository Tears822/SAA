import * as React from 'react';
import { Link } from "react-router-dom";

import { Icon } from '@fluentui/react';



export const UnderConstructionComponent: React.FC<{}> =
  (props) => {
    return (
      <div>
        <div>
          <div>
            <div className="UnderConstructSection">

              <Icon iconName="BuildDefinition" />
              <h1>Coming soon</h1>
              <p>this page is under construction</p>
              <p>you can go to <Link to="/">Home Page</Link></p>
            </div>
          </div>
        </div>
      </div>

    );
  };