// Calendar helpers. No end time is invented: ICS omits DTEND, Google gets start=end.
export type CalendarEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h), local to timezone
  location: string;
  description?: string;
  timezone?: string;
};

export const EVENT_TZ = "Africa/Accra";

function stamp(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

export function googleCalendarUrl(e: CalendarEvent) {
  const s = stamp(e.date, e.time);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${s}/${s}`,
    ctz: e.timezone ?? EVENT_TZ,
    location: e.location,
    details: e.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function esc(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(e: CalendarEvent) {
  const tz = e.timezone ?? EVENT_TZ;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agnes 60//Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    `TZID:${tz}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0000",
    "TZNAME:GMT",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:agnes-60-${e.date}@invitation`,
    // fixed, so the server-rendered link and the hydrated one are identical
    `DTSTAMP:${e.date.replace(/-/g, "")}T000000Z`,
    `DTSTART;TZID=${tz}:${stamp(e.date, e.time)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(e.description ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** A link that saves the event as an .ics file (opens in Apple Calendar, Outlook and Android). */
export function icsHref(e: CalendarEvent) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(e))}`;
}

export function mapsDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
