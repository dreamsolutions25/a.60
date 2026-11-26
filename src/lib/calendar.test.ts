import { describe, it, expect } from "vitest";
import { buildIcs, googleCalendarUrl } from "./calendar";

const ev = {
  title: "Mrs Agnes Adu Gyamfi Adjei – 60th Birthday & Retirement Celebration",
  date: "2026-12-18",
  time: "15:00",
  location: "Lancaster Hotel, Accra, Ghana",
};

describe("calendar", () => {
  it("starts at 3:00 PM on 18 Dec 2026 in Africa/Accra", () => {
    expect(buildIcs(ev)).toContain("DTSTART;TZID=Africa/Accra:20261218T150000");
  });
  it("does not invent an end time", () => {
    expect(buildIcs(ev)).not.toContain("DTEND");
  });
  it("google link uses Accra timezone", () => {
    const u = new URL(googleCalendarUrl(ev));
    expect(u.searchParams.get("ctz")).toBe("Africa/Accra");
    expect(u.searchParams.get("dates")).toBe("20261218T150000/20261218T150000");
  });
});
