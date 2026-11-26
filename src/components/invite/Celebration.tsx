import { googleCalendarUrl, icsHref, mapsDirectionsUrl, type CalendarEvent } from "@/lib/calendar";
import { formatEventDate, formatEventTime, type SiteContent } from "@/lib/content";
import { Ornament, Reveal } from "./Ornament";

export function Celebration({ content, event }: { content: SiteContent; event: CalendarEvent }) {
  const rows = [
    ["Celebrant", content.celebrant_name],
    ["Occasion", content.occasion],
    ["Date", formatEventDate(content.event_date)],
    ["Time", formatEventTime(content.event_time)],
    ["Venue", content.venue],
  ];
  return (
    <section className="section section--beige" id="celebration" aria-labelledby="cel-h">
      <Reveal className="invite">
        <p className="eyebrow">The Celebration</p>
        <h2 id="cel-h" className="heading">
          You Are Invited
        </h2>
        <Ornament />
        <p className="quote quote--small">{content.celebration_text}</p>
        <dl className="invite__rows">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="actions">
          <a className="btn" href={mapsDirectionsUrl(content.venue_location)} target="_blank" rel="noopener noreferrer">
            Get directions
          </a>
          <a className="btn btn--outline" href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
        </div>
        <a className="link" href={icsHref(event)} download="agnes-60-celebration.ics">
          Apple or Outlook calendar (.ics file)
        </a>
      </Reveal>
    </section>
  );
}
