import { supabase } from "@/integrations/supabase/client";

export type Milestone = { label: string; title: string; text: string; highlight?: string; offices?: string[] };

export type SiteContent = {
  celebrant_name: string;
  hero_tagline: string;
  hero_intro: string;
  sixty_heading: string;
  sixty_text: string;
  story_intro: string;
  milestones: Milestone[];
  celebration_text: string;
  occasion: string;
  event_title: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:mm
  venue: string;
  venue_location: string;
  gallery_text: string;
  messages_intro: string;
  closing_title: string;
  closing_quote: string;
  closing_message: string;
  footer: string;
};

export const DEFAULT_CONTENT: SiteContent = {
  celebrant_name: "Mrs Agnes Adu Gyamfi Adjei",
  hero_tagline: "60 Years. Celebrating A Velour.",
  hero_intro: "A lifetime of grace, dedication, excellence and service.",
  sixty_heading: "Six Decades of Grace",
  sixty_text:
    "Sixty years of beautiful memories, meaningful relationships, dedication and remarkable achievements. A life that has touched many hearts and inspired many through its journey.",
  story_intro:
    "Every remarkable journey tells a story of dedication, perseverance and purpose. Hers is a journey defined by commitment to service, professional excellence and an enduring legacy.",
  milestones: [
    {
      label: "Beginning",
      title: "VAT Service",
      text: "She began her professional career with the VAT Service, embarking on a journey of dedication and public service.",
    },
    {
      label: "The Journey",
      title: "A Journey of Dedication",
      text: "Through years of hard work, commitment and professional growth, she built a distinguished career in public administration.",
      offices: ["Suame MTO", "Ashanti Area Office", "Tax Sensitization"],
    },
    {
      label: "A Distinguished Achievement",
      title: "Ghana Revenue Authority",
      text: "Her professional journey culminated in her role as:",
      highlight: "Assistant Commissioner – Area Director",
    },
  ],
  celebration_text:
    "Join us as we celebrate a remarkable milestone and honour a lifetime of excellence, dedication and service.",
  occasion: "60th Birthday & Retirement Celebration",
  event_title: "Mrs Agnes Adu Gyamfi Adjei – 60th Birthday & Retirement Celebration",
  event_date: "2026-12-18",
  event_time: "15:00",
  venue: "Lancaster Hotel",
  venue_location: "Lancaster Hotel, Accra, Ghana",
  gallery_text:
    "A collection of beautiful moments, treasured memories and the people who have made the journey special.",
  messages_intro:
    "Sixty years of life and a remarkable career deserve more than celebration. They deserve words of appreciation, gratitude and love.\n\nTake a moment to share a special message with Mrs Agnes Adu Gyamfi Adjei as she begins a beautiful new chapter.",
  closing_title: "Celebrating a Legacy of Excellence",
  closing_quote: "Sixty years of grace. A lifetime of service. A legacy that will continue to inspire.",
  closing_message:
    "With heartfelt gratitude and joy, we look forward to celebrating this remarkable milestone with you.",
  footer: "A Celebration of Life, Love & Legacy.",
};

export type GalleryItem = {
  id: string;
  image_url: string; // storage path
  caption: string | null;
  display_order: number;
  is_featured: boolean;
  url?: string | undefined; // signed url
};

export type SiteData = {
  content: SiteContent;
  heroPath: string | null;
  heroUrl: string | null;
  gallery: GalleryItem[];
};

function browserSignedUrl(signedUrl: string) {
  const publicUrl = import.meta.env["VITE_SUPABASE_URL"];
  if (!publicUrl) return signedUrl;
  try {
    const signed = new URL(signedUrl);
    return `${new URL(publicUrl).origin}${signed.pathname}${signed.search}`;
  } catch {
    return signedUrl;
  }
}

export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabase.storage.from("gallery").createSignedUrls(paths, 60 * 60 * 24 * 7);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = browserSignedUrl(d.signedUrl);
  });
  return map;
}

export async function fetchSiteData(): Promise<SiteData> {
  const [{ data: settings }, { data: gallery }] = await Promise.all([
    supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("gallery").select("*").order("display_order", { ascending: true }),
  ]);
  const content = { ...DEFAULT_CONTENT, ...((settings?.content as Partial<SiteContent>) ?? {}) };
  const items = (gallery ?? []) as GalleryItem[];
  const heroPath = settings?.hero_image_url ?? null;
  const urls = await signPaths([...items.map((g) => g.image_url), ...(heroPath ? [heroPath] : [])]);
  return {
    content,
    heroPath,
    heroUrl: heroPath ? (urls[heroPath] ?? null) : null,
    gallery: items.map((g) => ({ ...g, url: urls[g.image_url] })),
  };
}

export const siteQuery = {
  queryKey: ["site-data"],
  queryFn: fetchSiteData,
  staleTime: 60_000,
};

export function formatEventDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (isNaN(d.getTime())) return date;
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  const month = d.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
  return `${weekday}, ${day}${suffix} ${month} ${d.getUTCFullYear()}`;
}

/** "Friday 18 December 2026" */
export function formatEventDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (isNaN(d.getTime())) return date;
  // built by hand so the server and the browser print the same words
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "18 December" */
export function formatEventDayMonth(date: string) {
  return formatEventDay(date).split(" ").slice(1, 3).join(" ");
}

export function formatEventTime(time: string) {
  const [h = NaN, m = 0] = time.split(":").map(Number);
  if (isNaN(h)) return time;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m || 0).padStart(2, "0")} ${ap}`;
}
