import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const TITLE = "Celebration Studio | Mrs Agnes Adu Gyamfi Adjei";
const DESC = "Private administration for the 60th birthday and retirement invitation.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});
