import * as React from "react";
import { FC, useState } from "react";
import { ChoiceGroup, IChoiceGroupOption, Stack, PrimaryButton } from "@fluentui/react";



const SurveyBox: FC<{}> = ({ }) => {

    const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);

    const options: IChoiceGroupOption[] = [
        { key: "option1", text: "Option 1" },
        { key: "option2", text: "Option 2" },
        { key: "option3", text: "Option 3" },
    ];

    const handleSubmit = () => {
        alert(`You selected: ${selectedOption}`);
    };

    return (
        <>
            <div>
                <Stack tokens={{ childrenGap: 15, padding: 20 }} styles={{ root: { maxWidth: 400 } }}>
                    <h3>How satisfied are you with our service?</h3>
                    <ChoiceGroup
                        options={options}
                        selectedKey={selectedOption}
                        onChange={(_, option) => setSelectedOption(option?.key)}
                    />
                    <PrimaryButton text="Submit" onClick={handleSubmit} disabled={!selectedOption} />
                </Stack>
            </div>
        </>
    );
};
export default SurveyBox;
