import * as React from "react";
import { FC, useState } from "react";
import { Stack, Icon } from "@fluentui/react";
import { Link } from "react-router-dom";
import "./surveyWebpart.scss";

interface OptionRating {
  key: string;
  text: string;
  textAr: string;
  rating: number;
}

const SurveyBox: FC<{ }> = ({ }) => {
  const isAr = window.location.href.toLowerCase().includes("/ar/");

  const initialOptions: OptionRating[] = [
    { key: "Design", text: "Design", textAr: "التصميم", rating: 0 },
    { key: "Services", text: "Services", textAr: "الخدمات", rating: 0 },
    { key: "Content", text: "Content", textAr: "المحتوي", rating: 0 },
  ];

  const [options, setOptions] = useState<OptionRating[]>(initialOptions);

  const handleRating = (key: string, value: number) => {
    const updatedOptions = options.map((opt) =>
      opt.key === key ? { ...opt, rating: value } : opt
    );
    setOptions(updatedOptions);
  };

  return (
    <div className={`survey-home-box ${isAr ? "rtl" : ""}`}>
      <h3>{isAr ? " استطلاعات الرأي" : "Intranet Feedback"}</h3>

      <Stack
        tokens={{ childrenGap: 20, padding: 20 }}
        styles={{ root: { maxWidth: 400 } }}
      >
        <h3>
          {isAr
            ? "ما مدى رضاك عن البوابة الداخلية في SAA؟"
            : "How satisfied are you with SAA Intranet?"}
        </h3>

        {options.map((option) => (
          <div key={option.key} className="survey-row">
            <span>{isAr ? option.textAr : option.text}</span>

            <span style={{ marginLeft: isAr ? 0 : 10, marginRight: isAr ? 10 : 0 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    cursor: "pointer",
                    color: option.rating >= star ? "#ffc107" : "#e4e5e9",
                    fontSize: 24,
                  }}
                  onClick={() => handleRating(option.key, star)}
                >
                  ★
                </span>
              ))}
            </span>
          </div>
        ))}

        <Link to={isAr ? "https://v0tq5.sharepoint.com/sites/HubSite/SitePages/ar/Intranet-Survey.aspx":"https://v0tq5.sharepoint.com/sites/HubSite/SitePages/Intranet-Survey.aspx"} className="viewAllBtn">
          {isAr ? "عرض الكل" : "View all"}
          <Icon iconName={isAr ? "ChevronLeftMed" : "ChevronRightMed"} />
        </Link>
      </Stack>
    </div>
  );
};

export default SurveyBox;
