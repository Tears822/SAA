import * as React from "react";
import { FC, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface IEvent {
    date: string;
    title: string;
}

interface IEventsProps {
    events?: IEvent[];
}

const sampleEvents: IEvent[] = [
    { date: "2025-12-01", title: "Kickoff Meeting" },
    { date: "2025-12-03", title: "Design Review" },
    { date: "2025-12-05", title: "Team Standup" },
    { date: "2025-12-10", title: "Sprint Planning" },
];

const EventsBox: FC<IEventsProps> = ({ events = sampleEvents }) => {
    const [value, setValue] = useState<Date>(new Date());

    const handleChange = (val: any) => {
        if (val instanceof Date) {
            setValue(val);
        } else if (Array.isArray(val) && val.length > 0 && val[0] instanceof Date) {
            setValue(val[0]);
        }
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = events.filter(e => e.date === dateStr);
            if (dayEvents.length) {
                return (
                    <div
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#0078d4",
                            margin: "2px auto",
                        }}
                    />
                );
            }
        }
        return null;
    };

    return (
        <>
            <div className="col-4 col-md-4">
                <div className="brdr-lft-rgt">

                    <Calendar
                        onChange={handleChange}
                        value={value}
                        view="month"
                        prev2Label={null}
                        next2Label={null}
                        tileContent={tileContent}
                    />

                    <ul className="list-events-types">
                        <li>
                            <span className="tileBlue"></span>National holidays
                        </li>
                        <li>
                            <span className="tileOrange"></span>SAA Events
                        </li>
                    </ul>

                </div>
            </div>
            <div className="col-4 col-md-4">
                <div className="events-list-home">
                    <div className="event-item-home">
                        <label>Nov <strong>30</strong></label>
                        <div>
                            <h3>Commemoration Day</h3>
                            <p>Share ideas with field experts.</p>
                        </div>
                    </div>

                    <div className="event-item-home">
                        <label>Dec <strong>2</strong></label>
                        <div>
                            <h3>UAE National Day</h3>
                            <p>Discuss insights with industry leaders.</p>
                        </div>
                    </div>


                    <div className="event-item-home">
                        <label>Jan <strong>1</strong></label>
                        <div>
                            <h3>New Year's Day</h3>
                            <p>Network with specialists at the summit.</p>
                        </div>
                    </div>


                    <div className="event-item-home">
                        <label>May <strong>26</strong></label>
                        <div>
                            <h3>Eid al-Adha</h3>
                            <p>Engage with professionals at the expo.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventsBox;
