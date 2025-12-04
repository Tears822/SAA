import * as React from "react";
import { FC } from "react";

export interface IAskSupportProps {
  askItUrl?: string;
  askAdminUrl?: string;
}

const AskSupport: FC<IAskSupportProps> = ({ askItUrl, askAdminUrl }) => {
  const handleClick = (url?: string) => {
    if (url) {
      window.open(url, "_blank"); // open in new tab
    }
  };

  return (
    <div className="fullWidthWrapper">
      <div className="bar">
        <button
          className="askSupporttile askIt"
          onClick={() => handleClick(askItUrl)}
        >
          <span className="icon">
            <img
              src={require('../../theme/images/askit.svg')}
              className="ggprofile-icon"
              alt="Ask IT"
            />
          </span>
          <span className="label">ASK IT</span>
        </button>

        <button
          className="askSupporttile askAdmin"
          onClick={() => handleClick(askAdminUrl)}
        >
          <span className="icon">
            <img
              src={require('../../theme/images/askadmin.svg')}
              className="ggprofile-icon"
              alt="Ask Admin"
            />
          </span>
          <span className="label">ASK Admin</span>
        </button>
      </div>
    </div>
  );
};

export default AskSupport;
