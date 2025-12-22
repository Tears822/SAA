import * as React from "react";
import { FC, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./eventWebpart.scss";

import { GraphFI, graphfi } from "@pnp/graph";
import { SPFx as graphSPFx } from "@pnp/graph";
import "@pnp/graph/calendars";
import "@pnp/graph/users";

// import { spfi, SPFI } from "@pnp/sp";
// import { SPFx as spSPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
// If you're in SPFx, this type exists:
import { WebPartContext } from "@microsoft/sp-webpart-base";

interface IEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD (local) for calendar dots + grouping
  title: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  location?: string;
}

interface IEventsProps {
  context: WebPartContext; // <-- REQUIRED
  daysToLoad?: number; // optional: range window (default 60)
  maxListItems?: number; // optional: events list max items (default 8)
  // graph: GraphFI;
}

const EventsBox: FC<IEventsProps> = ({
  context,
  daysToLoad = 60,
  maxListItems = 8,
}) => {
  const isAr = window.location.href.toLowerCase().includes("/ar/");
  const [value, setValue] = useState<Date>(new Date());
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Build Graph client once
  const graph: GraphFI = useMemo(() => {
    return graphfi().using(graphSPFx(context));
  }, [context]);

  const handleChange = (val: any) => {
    if (val instanceof Date) setValue(val);
    else if (Array.isArray(val) && val.length > 0 && val[0] instanceof Date)
      setValue(val[0]);
  };

  // Use LOCAL date key (avoid UTC shift from toISOString())
  const toYMDLocal = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const monthsAr = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  // Load events from Exchange calendar using Microsoft Graph calendarView (via PnPjs)
  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Range: [today .. today + daysToLoad]
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setDate(end.getDate() + daysToLoad);
        end.setHours(23, 59, 59, 999);

        // calendarView returns occurrences for recurring events inside the range
        // const items: any[] = await graph.me.calendarView
        //   .configure({
        //     query: {
        //       startDateTime: start.toISOString(),
        //       endDateTime: end.toISOString(),
        //       $select: "id,subject,start,end,isAllDay,location",
        //       $orderby: "start/dateTime",
        //       $top: 500
        //     }
        //   })();

        const startIso = start.toISOString();
        const endIso = end.toISOString();
        const items = await graph.me
          .calendarView(startIso, endIso)
          .select(
            "id",
            "subject",
            "start",
            "end",
            "isAllDay",
            "location",
            "bodyPreview"
          )
          .orderBy("start/dateTime")
          .top(500)();

        // console.log(items);

        if (cancelled) return;

        const mapped: IEvent[] = (items || [])
          .map((e: any) => {
            const startDt: string | undefined = e?.start?.dateTime;
            const endDt: string | undefined = e?.end?.dateTime;

            // Best-effort mapping; if Graph doesn’t return dateTime for any reason, skip safely
            if (!startDt) return null;

            const startDate = new Date(startDt);
            const dateKey = toYMDLocal(startDate);

            return {
              id: e.id,
              dateKey,
              title: e.subject || (isAr ? "حدث بدون عنوان" : "Untitled event"),
              startDateTime: startDt,
              endDateTime: endDt,
              isAllDay: !!e.isAllDay,
              location: e?.location?.displayName,
            } as IEvent;
          })
          .filter(Boolean) as IEvent[];

        setEvents(mapped);
      } catch (err: any) {
        if (!cancelled) {
          setEvents([]);
          setError(
            err?.message
              ? String(err.message)
              : "Failed to load Exchange events."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [graph, daysToLoad, isAr]);



  // Calendar dots from loaded Exchange events
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateKey = toYMDLocal(date);
    const hasEvents = events.some((e) => e.dateKey === dateKey);

    if (!hasEvents) return null;

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
      />
    );
  };


  // Events list shows events for the selected day (calendar date)
  const selectedDateKey = toYMDLocal(value);
  const selectedDayEvents = useMemo(() => {
    return events
      .filter((e) => e.dateKey === selectedDateKey)
      .slice(0, maxListItems);
  }, [events, selectedDateKey, maxListItems]);

  const formatMonthLabel = (d: Date) =>
    isAr
      ? monthsAr[d.getMonth()]
      : d.toLocaleString("en-US", { month: "short" });

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
                : `${date.toLocaleString("en-US", {
                    month: "long",
                  })} ${date.getFullYear()}`
            }
          />

          <ul className="list-events-types">
            <li>
              <span className="tileBlue"></span>
              {isAr ? "فعاليات (من التقويم)" : "Events (from calendar)"}
            </li>
          </ul>
        </div>
      </div>

      {/* Events list (from Exchange) */}
      <div className="col-12 col-md-6 col-lg-4">
        <div className="events-list-home">
          {loading && (
            <div className="event-item-home">
              <div>
                <p>{isAr ? "جارِ تحميل الأحداث..." : "Loading events..."}</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="event-item-home">
              <div>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && selectedDayEvents.length === 0 && (
            <div className="event-item-home">
              <div>
                <h3>
                  {isAr
                    ? "لا توجد أحداث في هذا اليوم"
                    : "No events on this day"}
                </h3>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            selectedDayEvents.map((ev) => {
              const d = ev.startDateTime ? new Date(ev.startDateTime) : value;
              const monthLabel = formatMonthLabel(d);
              const dayNum = d.getDate();

              return (
                <div className="event-item-home" key={ev.id}>
                  <label>
                    {monthLabel} <strong>{dayNum}</strong>
                  </label>
                  <div>
                    <h3>{ev.title}</h3>
                    {ev.location && <p>{ev.location}</p>}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default EventsBox;
