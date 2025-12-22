import * as React from "react";
import { FC, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./eventWebpart.scss";

import { GraphFI, graphfi } from "@pnp/graph";
import { SPFx as graphSPFx } from "@pnp/graph";
import "@pnp/graph/calendars";
import "@pnp/graph/users";

import { spfi, SPFI } from "@pnp/sp";
import { SPFx as spSPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

import { WebPartContext } from "@microsoft/sp-webpart-base";

interface IEvent {
  id: string;
  title: string;
  startDateTime: string; // ISO string
  endDateTime?: string;  // ISO string (optional)
  isAllDay?: boolean;
  location?: string;
  description?: string;
}

interface IEventsProps {
  context: WebPartContext;

  // Right panel (Graph)
  daysToLoad?: number; // default 60

  // Calendar month view (SharePoint list)
  eventsListTitle?: string; // default "Events"
  eventDateFieldInternalName?: string; // default "EventDate" (start)
  eventEndDateFieldInternalName?: string; // default "EndDate" (end)
  maxSpItemsPerMonth?: number; // default 500
}


const EventsBox: FC<IEventsProps> = ({
  context,
  daysToLoad = 60,
  eventsListTitle = "Events",
  eventDateFieldInternalName = "EventDate",
  eventEndDateFieldInternalName = "EndDate",
  maxSpItemsPerMonth = 500,
}) => {
  const isAr = window.location.href.toLowerCase().includes("/ar/");

  const [value, setValue] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedDayTitles, setSelectedDayTitles] = useState<string[]>([]);

  const calendarWrapRef = React.useRef<HTMLDivElement | null>(null);

  // Close the day popup when clicking outside the calendar area
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!calendarWrapRef.current) return;
      if (!calendarWrapRef.current.contains(e.target as Node)) {
        setSelectedDayTitles([]);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, []);

  // SharePoint events (drives calendar dots + tooltip; supports multi-day)
  const [spEvents, setSpEvents] = useState<IEvent[]>([]);
  const [spLoading, setSpLoading] = useState<boolean>(false);
  const [spError, setSpError] = useState<string | null>(null);

  // Graph calendar events (right panel only)
  const [upcomingEvents, setUpcomingEvents] = useState<IEvent[]>([]);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [graphError, setGraphError] = useState<string | null>(null);

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

  const startOfDayLocal = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  // Inclusive day-in-range check (multi-day events show on each day)
  const isDayWithinEvent = (day: Date, ev: IEvent) => {
    const dayStart = startOfDayLocal(day);

    const s = new Date(ev.startDateTime);
    const start = startOfDayLocal(s);

    // If end is missing, treat as single-day event
    const e = ev.endDateTime ? new Date(ev.endDateTime) : s;
    const end = startOfDayLocal(e);

    return dayStart >= start && dayStart <= end;
  };

  const formatMonthLabel = (d: Date) =>
    isAr ? monthsAr[d.getMonth()] : d.toLocaleString("en-US", { month: "short" });

  // Build SP client once
  const sp: SPFI = useMemo(() => {
    return spfi().using(spSPFx(context));
  }, [context]);

  // Build Graph client once
  const graph: GraphFI = useMemo(() => {
    return graphfi().using(graphSPFx(context));
  }, [context]);

  // ------------------------------------------------------------
  // 1) Right panel: load 4 upcoming events from M365 Calendar (Graph)
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadUpcoming = async () => {
      try {
        setGraphLoading(true);
        setGraphError(null);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setDate(end.getDate() + daysToLoad);
        end.setHours(23, 59, 59, 999);

        const items = await graph.me
          .calendarView(start.toISOString(), end.toISOString())
          .select("id", "subject", "start", "end", "isAllDay", "location", "bodyPreview")
          .orderBy("start/dateTime")
          .top(50)();

        if (cancelled) return;

        const mapped: IEvent[] = (items || [])
          .map((e: any) => {
            const startDt: string | undefined = e?.start?.dateTime;
            const endDt: string | undefined = e?.end?.dateTime;
            if (!startDt) return null;

            return {
              id: e.id,
              title: e.subject || (isAr ? "حدث بدون عنوان" : "Untitled event"),
              startDateTime: startDt,
              endDateTime: endDt,
              isAllDay: !!e.isAllDay,
              location: e?.location?.displayName,
              description: e?.bodyPreview,
            } as IEvent;
          })
          .filter(Boolean) as IEvent[];

        setUpcomingEvents(mapped.slice(0, 4));
      } catch (err: any) {
        if (!cancelled) {
          setUpcomingEvents([]);
          setGraphError(
            err?.message ? String(err.message) : "Failed to load upcoming calendar events."
          );
        }
      } finally {
        if (!cancelled) setGraphLoading(false);
      }
    };

    loadUpcoming();
    return () => {
      cancelled = true;
    };
  }, [graph, daysToLoad, isAr]);

  // ------------------------------------------------------------
  // 2) Calendar view: load month events from SharePoint Events list
  //    IMPORTANT: Use overlap filter so multi-day events that start before the month
  //    still appear within the month.
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadSpMonthEvents = async () => {
      try {
        setSpLoading(true);
        setSpError(null);

        const monthStart = new Date(
          activeStartDate.getFullYear(),
          activeStartDate.getMonth(),
          1
        );
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(
          activeStartDate.getFullYear(),
          activeStartDate.getMonth() + 1,
          0
        );
        monthEnd.setHours(23, 59, 59, 999);

        const startField = eventDateFieldInternalName;
        const endField = eventEndDateFieldInternalName;

        // Overlap logic:
        // start <= monthEnd AND (end >= monthStart OR end is null)
        const filter = `${startField} le datetime'${monthEnd.toISOString()}' and (${endField} ge datetime'${monthStart.toISOString()}' or ${endField} eq null)`;

        const items = await sp.web.lists
          .getByTitle(eventsListTitle)
          .items.select("Id", "Title", startField, endField)
          .filter(filter)
          .top(maxSpItemsPerMonth)();

        if (cancelled) return;

        const mapped: IEvent[] = (items || [])
          .map((i: any) => {
            const startDt = i?.[startField] as string | undefined;
            if (!startDt) return null;

            const endDt = i?.[endField] as string | undefined;

            return {
              id: String(i.Id),
              title: i.Title || (isAr ? "حدث بدون عنوان" : "Untitled event"),
              startDateTime: startDt,
              endDateTime: endDt,
            } as IEvent;
          })
          .filter(Boolean) as IEvent[];

        setSpEvents(mapped);
      } catch (err: any) {
        if (!cancelled) {
          setSpEvents([]);
          setSpError(
            err?.message ? String(err.message) : "Failed to load SharePoint Events list items."
          );
        }
      } finally {
        if (!cancelled) setSpLoading(false);
      }
    };

    loadSpMonthEvents();
    return () => {
      cancelled = true;
    };
  }, [
    sp,
    activeStartDate,
    eventsListTitle,
    eventDateFieldInternalName,
    eventEndDateFieldInternalName,
    isAr,
    maxSpItemsPerMonth,
  ]);

  // Calendar dots must use SharePoint events (NOT Graph)
  
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dayEvents = spEvents.filter((e) => isDayWithinEvent(date, e));
    if (dayEvents.length === 0) return null;

    const isSelected =
      date.getFullYear() === selectedDay.getFullYear() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getDate() === selectedDay.getDate();

    return (
      <div style={{ position: "relative" }}>
        {/* dot */}
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

        {/* popup above selected day */}
        {isSelected && selectedDayTitles.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "100%",
              transform: "translate(-50%, -8px)",
              minWidth: 200,
              maxWidth: 260,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "10px 12px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              zIndex: 999,
              maxHeight: 180,
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedDayTitles.map((t, idx) => (
              <div
                key={idx}
                style={{ fontSize: 13, lineHeight: 1.4, marginBottom: idx === selectedDayTitles.length - 1 ? 0 : 6 }}
              >
                • {t}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Tooltip on day click: titles from SharePoint list (multi-day aware)
  
  const onClickDay = (day: Date) => {
    setValue(day);
    setSelectedDay(day);

    const titles = spEvents
      .filter((e) => isDayWithinEvent(day, e))
      .map((e) => e.title);

    setSelectedDayTitles(titles);
  };

  return (
    <>

      {/* Calendar (SharePoint list events) */}
      <div className="col-12 col-md-6 col-lg-4">
        <div className="brdr-lft-rgt" ref={calendarWrapRef}>
          <Calendar
            onChange={(val: any) => {
              setSelectedDayTitles([]);
              if (val instanceof Date) setValue(val);
              else if (Array.isArray(val) && val.length > 0 && val[0] instanceof Date)
                setValue(val[0]);
            }}
            value={value}
            locale={isAr ? "ar-EG" : "en-US"}
            prev2Label={null}
            next2Label={null}
            tileContent={tileContent}
            onClickDay={onClickDay}
            onActiveStartDateChange={({ activeStartDate: d }) => {
              setSelectedDayTitles([]);
              if (d) setActiveStartDate(d);
            }}
            navigationLabel={({ date }) =>
              isAr
                ? `${monthsAr[date.getMonth()]} ${date.getFullYear()}`
                : `${date.toLocaleString("en-US", { month: "long" })} ${date.getFullYear()}`
            }
          />

          <ul className="list-events-types">
            <li>
              <span className="tileBlue"></span>
              {isAr ? "فعاليات (من قائمة SharePoint)" : "Events (from Events list)"}
            </li>
          </ul>

          {spLoading && (
            <div style={{ padding: "8px 4px", fontSize: 13 }}>
              {isAr ? "جارِ تحميل فعاليات الشهر..." : "Loading month events..."}
            </div>
          )}
          {!spLoading && spError && (
            <div style={{ padding: "8px 4px", fontSize: 13 }}>
              {spError}
            </div>
          )}
        </div>
      </div>

      {/* Right panel (Graph calendar: 4 upcoming) */}
      <div className="col-12 col-md-6 col-lg-4">
        <div className="events-list-home">
          {graphLoading && (
            <div className="event-item-home">
              <div>
                <p>{isAr ? "جارِ تحميل الأحداث القادمة..." : "Loading upcoming events..."}</p>
              </div>
            </div>
          )}

          {!graphLoading && graphError && (
            <div className="event-item-home">
              <div>
                <p>{graphError}</p>
              </div>
            </div>
          )}

          {!graphLoading && !graphError && upcomingEvents.length === 0 && (
            <div className="event-item-home">
              <div>
                <h3>{isAr ? "لا توجد أحداث قادمة" : "No upcoming events"}</h3>
              </div>
            </div>
          )}

          {!graphLoading &&
            !graphError &&
            upcomingEvents.map((ev) => {
              const d = ev.startDateTime ? new Date(ev.startDateTime) : new Date();
              const monthLabel = formatMonthLabel(d);
              const dayNum = d.getDate();

              return (
                <div className="event-item-home" key={ev.id}>
                  <label>
                    {monthLabel} <strong>{dayNum}</strong>
                  </label>
                  <div>
                    <h3>{ev.title}</h3>
                    {ev.description && <p className="event-desc">{ev.description}</p>}
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