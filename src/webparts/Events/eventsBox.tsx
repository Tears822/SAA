import * as React from "react";
import { FC, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./eventWebpart.scss";



interface IEvent {
    date: string;
    title: string;
    titleAr?: string;
    desc?: string;
    descAr?: string;
}

interface IEventsProps {
    events?: IEvent[];
}

const sampleEvents: IEvent[] = [
    { date: "2025-12-01", title: "Kickoff Meeting", titleAr: "اجتماع البداية" },
    { date: "2025-12-03", title: "Design Review", titleAr: "مراجعة التصميم" },
    { date: "2025-12-05", title: "Team Standup", titleAr: "لقاء الفريق" },
    { date: "2025-12-10", title: "Sprint Planning", titleAr: "تخطيط السبرنت" },
];

const EventsBox: FC<IEventsProps> = ({ events = sampleEvents}) => {
const isAr = window.location.href.toLowerCase().includes("/ar/");

    const [value, setValue] = useState<Date>(new Date());

    const handleChange = (val: any) => {
        if (val instanceof Date) {
            setValue(val);
        } else if (Array.isArray(val) && val.length > 0 && val[0] instanceof Date) {
            setValue(val[0]);
        }
    };

    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = events.filter((e) => e.date === dateStr);
            if (dayEvents.length) {
                return (
                    <div
                        className="event-dot"
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#0078d4",
                            margin: "2px auto",
                        }}
                    ></div>
                );
            }
        }
        return null;
    };

    return (
        <>
            <div className="col-12 col-md-6 col-lg-4">
                <div className="brdr-lft-rgt">

                    <Calendar
                        onChange={handleChange}
                        value={value}
                        locale={isAr ? "ar-EG" : "en-US"}
                        prev2Label={null}
                        next2Label={null}
                        tileContent={tileContent}
                        navigationLabel={({ date }) =>
                            isAr
                                ? `${monthsAr[date.getMonth()]} ${date.getFullYear()}`
                                : `${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`
                        }
                    />

                    <ul className="list-events-types">
                        <li>
                            <span className="tileBlue"></span>
                            {isAr ? " العطلات الوطنية" : "National holidays"}
                        </li>
                        <li>
                            <span className="tileOrange"></span>
                            {isAr ? "فعاليات المطار " : "SAA Events"}
                        </li>
                    </ul>

                </div>
            </div>

            {/* Events list */}
            <div className="col-12 col-md-6 col-lg-4">
                <div className="events-list-home">

                    <div className="event-item-home">
                        <label>{isAr ? "نوفمبر" : "Nov"} <strong>30</strong></label>
                        <div>
                            <h3>{isAr ? "يوم الشهيد" : "Commemoration Day"}</h3>
                            <p>{isAr ? "شارك أفكارك مع الخبراء." : "Share ideas with field experts."}</p>
                        </div>
                    </div>

                    <div className="event-item-home">
                        <label>{isAr ? "ديسمبر" : "Dec"} <strong>2</strong></label>
                        <div>
                            <h3>{isAr ? "اليوم الوطني الإماراتي" : "UAE National Day"}</h3>
                            <p>{isAr ? "ناقش رؤى مع قادة الصناعة." : "Discuss insights with industry leaders."}</p>
                        </div>
                    </div>

                    <div className="event-item-home">
                        <label>{isAr ? "يناير" : "Jan"} <strong>1</strong></label>
                        <div>
                            <h3>{isAr ? "رأس السنة" : "New Year's Day"}</h3>
                            <p>{isAr ? "تواصل مع المتخصصين في القمة." : "Network with specialists at the summit."}</p>
                        </div>
                    </div>

                    <div className="event-item-home">
                        <label>{isAr ? "مايو" : "May"} <strong>26</strong></label>
                        <div>
                            <h3>{isAr ? "عيد الأضحى" : "Eid al-Adha"}</h3>
                            <p>{isAr ? "تواصل مع الخبراء في المعرض." : "Engage with professionals at the expo."}</p>
                        </div>
                    </div>

                </div>
            </div>
            </>
    );
};

export default EventsBox;
