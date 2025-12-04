import * as React from "react";
import { Link } from "react-router-dom";

import { Icon } from '@fluentui/react/lib/Icon';

export const Error404Component: React.FC<{}> = (props) => {
  return (
    <div className="container">
      <div className="notfoundSection">
        <h1>
          {" "}
          <Icon iconName="Error" />
          Sorry
        </h1>
        <p>we couldn`t find this page </p>
        <p>
          you can go to <Link to="/">Home Page</Link>
        </p>
      </div>
    </div>
  );
};
