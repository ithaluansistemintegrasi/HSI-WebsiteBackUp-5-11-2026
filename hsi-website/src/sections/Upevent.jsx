import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { apiFetch } from "../admin/api";

function groupByDate(events) {
  const map = new Map();
  for (const e of events) {
    // normalize key to yyyy-MM-dd, safe for ISO string from DB
    const key = format(parseISO(e.date), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return map;
}

function getCalendarDays(currentMonth) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  return days;
}

export default function Upevent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("id") ? idLocale : enUS;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [EVENTS, setEVENTS] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsErr, setEventsErr] = useState("");

  useEffect(() => {
    document.title = "Jadwal Event | PT Haluan Sistem Integrasi";
  }, []);

  // labels from i18n (UI text only)
  const dayNames = useMemo(() => {
    // Monday-first labels
    return t("events.calendar.dayNames", { returnObjects: true }) || [];
  }, [t]);

  async function fetchEvents() {
    setEventsErr("");
    setLoadingEvents(true);
    try {
      // public endpoint: do not send token
      const json = await apiFetch("/events", { noAuth: true });
      setEVENTS(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      setEventsErr(e?.message || "Failed to fetch events");
      setEVENTS([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => groupByDate(EVENTS), [EVENTS]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedEvents = (eventsByDate.get(selectedKey) ?? [])
    .slice()
    .sort((a, b) =>
      (a.timeStart || a.time || "").localeCompare(b.timeStart || b.time || ""),
    );

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale });
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const hasEvent = (dateObj) => {
    const k = format(dateObj, "yyyy-MM-dd");
    return eventsByDate.has(k);
  };

  const countEvent = (dateObj) => {
    const k = format(dateObj, "yyyy-MM-dd");
    return eventsByDate.get(k)?.length ?? 0;
  };

  const renderTime = (ev) => {
    // Support both formats:
    // - old i18n data: ev.time
    // - DB format: ev.timeStart/timeEnd
    if (ev.time) return ev.time;
    if (ev.timeStart && ev.timeEnd) return `${ev.timeStart}–${ev.timeEnd}`;
    if (ev.timeStart) return ev.timeStart;
    return "";
  };

  const renderDateISO = (ev) => {
    // ev.date could be "2026-02-25" or ISO
    return format(parseISO(ev.date), "d MMM yyyy", { locale });
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {t("events.title")}
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600">
              {t("events.subtitle")}
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {t("events.selectedDateLabel")}{" "}
            <span className="font-medium text-slate-700">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale })}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Calendar */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#8FC3DC] bg-white p-4 md:p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm"
                  type="button"
                  aria-label={t("events.calendar.prevMonthAria")}
                >
                  ‹
                </button>

                <div className="text-center">
                  <div className="font-semibold capitalize">{monthLabel}</div>
                </div>

                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="px-3 py-2 rounded-lg border hover:bg-slate-50 transition text-sm"
                  type="button"
                  aria-label={t("events.calendar.nextMonthAria")}
                >
                  ›
                </button>
              </div>

              {/* Status */}
              {eventsErr ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {eventsErr}
                </div>
              ) : null}

              {loadingEvents ? (
                <div className="mt-4 rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Loading events...
                </div>
              ) : null}

              {/* Day names */}
              <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-500">
                {(dayNames || []).map((n, idx) => (
                  <div key={`${n}-${idx}`} className="text-center font-medium">
                    {n}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="mt-2 grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const inMonth = isSameMonth(d, currentMonth);
                  const selected = isSameDay(d, selectedDate);
                  const today = isToday(d);
                  const dot = hasEvent(d);
                  const c = countEvent(d);
                  const eventCount = c;
                  const hasEvents = eventCount > 0;

                  return (
                    <button
                      key={format(d, "yyyy-MM-dd")}
                      onClick={() => {
                        setSelectedDate(d);
                        // optional UX: kalau klik hari bulan lain, ikut pindah bulan
                        if (!isSameMonth(d, currentMonth)) {
                          setCurrentMonth(startOfMonth(d));
                        }
                      }}
                      type="button"
                      className={[
                        "relative h-11 rounded-xl border text-sm transition",
                        "flex items-center justify-center",

                        // base text color
                        inMonth
                          ? "text-slate-900"
                          : "text-slate-400 bg-slate-50",

                        // event highlight (jika ada event dan bukan selected)
                        hasEvents && !selected
                          ? inMonth
                            ? "bg-[#8fc3dc]/80 border-[#4D6CFF]/30 hover:bg-[#4D6CFF]/15"
                            : "bg-[#4D6CFF]/10 border-slate-200"
                          : inMonth
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50",

                        // selected (paling kuat)
                        selected
                          ? "bg-[#4D6CFF] text-black border-[#4D6CFF] ring-2 ring-[#4D6CFF]/25"
                          : "",

                        // today (kalau bukan selected)
                        today && !selected ? "border-[#f56969]" : "",
                      ].join(" ")}
                      aria-label={format(d, "yyyy-MM-dd")}
                    >
                      <span className={today ? "font-semibold" : ""}>
                        {format(d, "d")}
                      </span>

                      {/* badge count (optional) */}
                      {hasEvents && eventCount >= 2 && !selected && (
                        <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                          {eventCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Event List */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#8FC3DC] bg-white p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {t("events.listTitle")}
                </h2>
                <span className="text-xs text-slate-500">
                  {t("events.count", { count: selectedEvents.length })}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {selectedEvents.length === 0 ? (
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                    {t("events.empty")}
                  </div>
                ) : (
                  selectedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border p-4 hover:shadow-sm transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{ev.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {(ev.category || "").toString()}{" "}
                            {ev.category && ev.location ? "•" : ""}{" "}
                            {(ev.location || "").toString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {renderTime(ev)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {renderDateISO(ev)}
                          </div>
                        </div>
                      </div>

                      {ev.description && (
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {ev.linkUrl ? (
                        <a
                          className="text-xs text-blue-600 underline mt-3 inline-block"
                          href={ev.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Link
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
