import * as React from "react";
import { FC } from "react";
import { Calendar as BigCalendar } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface IEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
}

interface IEventsrops {
    events?: IEvent[];
}

const EventsBox: FC<IEventsrops> = ({ }) => {

    const sampleEvents = [
        {
            id: 1,
            title: "Team Meeting",
            start: new Date(2025, 11, 5, 10, 0),
            end: new Date(2025, 11, 5, 11, 0),
        },
        {
            id: 2,
            title: "Project Deadline",
            start: new Date(2025, 11, 15, 0, 0),
            end: new Date(2025, 11, 15, 23, 59),
        },
    ];

    const localizer = {
        format: (date: Date, format: string) => {
            return date.toLocaleDateString(); 
        },
        formats: {},
        messages: {},
        firstDayOfWeek: () => 1,
    };

    return (
        <>
            <div className="col-4 col-md-4">
                <BigCalendar
                    localizer={localizer as any}
                    events={sampleEvents}
                    startAccessor="start"
                    endAccessor="end"
                    defaultView="month"
                    views={['month', 'week', 'day']}
                    popup
                />
            </div>
            <div className="col-4 col-md-4">
                calendar
            </div>
        </>
    );
};
export default EventsBox;
