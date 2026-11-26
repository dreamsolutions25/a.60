import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { DEFAULT_CONTENT, siteQuery } from "@/lib/content";
import type { CalendarEvent } from "@/lib/calendar";
import { Intro } from "@/components/invite/Intro";
import { Nav } from "@/components/invite/Nav";
import { Hero } from "@/components/invite/Hero";
import { Story } from "@/components/invite/Story";
import { Celebration } from "@/components/invite/Celebration";
import { Gallery } from "@/components/invite/Gallery";
import { Guestbook } from "@/components/invite/Guestbook";
import { Closing } from "@/components/invite/Closing";

const TITLE = "Mrs Agnes Adu Gyamfi Adjei – 60 Years of Excellence";
const DESC = "Celebrating 60 years of grace, dedication and a remarkable legacy of service.";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.ensureQueryData(siteQuery);
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const image = loaderData?.heroUrl?.startsWith("https://") ? loaderData.heroUrl : null;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESC },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESC },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "theme-color", content: "#F8F5EF" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "stylesheet", href: "/assets/invite.css" }],
    };
  },
  component: Index,
});

function Index() {
  const { data } = useQuery(siteQuery);
  const content = data?.content ?? DEFAULT_CONTENT;
  const gallery = data?.gallery ?? [];
  const storyItem = gallery.find((g) => g.url && !g.is_featured);
  const event: CalendarEvent = {
    title: content.event_title,
    date: content.event_date,
    time: content.event_time,
    location: content.venue_location,
    description: content.celebration_text,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="inv">
        <Intro name={content.celebrant_name} />
        <Nav />
        <main>
          <Hero content={content} heroUrl={data?.heroUrl ?? null} />
          <Story content={content} photoUrl={storyItem?.url} />
          <Celebration content={content} event={event} />
          <Gallery content={content} items={gallery.filter((g) => g !== storyItem)} />
          <Guestbook content={content} />
        </main>
        <Closing content={content} />
      </div>
    </MotionConfig>
  );
}
