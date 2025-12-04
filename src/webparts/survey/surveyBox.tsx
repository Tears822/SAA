import * as React from "react";
import { FC, useState } from "react";
import { Stack, PrimaryButton } from "@fluentui/react";

interface OptionRating {
  key: string;
  text: string;
  rating: number; // 1-5
}

const SurveyBox: FC<{}> = () => {
  const initialOptions: OptionRating[] = [
    { key: "Food", text: "Food", rating: 0 },
    { key: "Venue", text: "Venue", rating: 0 },
    { key: "Arrangement", text: "Arrangement", rating: 0 },
  ];

  const [options, setOptions] = useState<OptionRating[]>(initialOptions);

  const handleRating = (key: string, value: number) => {
    const updatedOptions = options.map((opt) =>
      opt.key === key ? { ...opt, rating: value } : opt
    );
    setOptions(updatedOptions);
  };

  const handleSubmit = () => {
    const result = options.map((opt) => `${opt.text}: ${opt.rating} stars`).join("\n");
    alert(`Your ratings:\n${result}`);
  };

  return (
    <div className="survey-home-box">
      <h3>Survey Question</h3>
      <Stack tokens={{ childrenGap: 20, padding: 20 }} styles={{ root: { maxWidth: 400 } }}>
        <h3>How satisfied are you with SAA Ramadan Iftar?</h3>

        {options.map((option) => (
          <div key={option.key}>
            <span>{option.text}:</span>
            <span style={{ marginLeft: 10 }}>
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

        <PrimaryButton
          text="Submit"
          onClick={handleSubmit}
          disabled={options.some((o) => o.rating === 0)}
        />
      </Stack>
    </div>
  );
};

export default SurveyBox;
