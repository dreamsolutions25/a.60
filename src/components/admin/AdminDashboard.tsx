import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Images, LayoutTemplate, LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminData } from "@/lib/admin.functions";
import { DEFAULT_CONTENT, type GalleryItem, type SiteContent } from "@/lib/content";
import { GalleryManager } from "./GalleryManager";
import { InvitationForm } from "./InvitationForm";
import { MessageModeration } from "./MessageModeration";

type Tab = "invitation" | "gallery" | "messages";

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("invitation");
  const fetchAdminData = useServerFn(getAdminData);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-data"], queryFn: () => fetchAdminData(), retry: false });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="font-display text-3xl italic text-muted-foreground">Opening your celebration studio…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-lg border border-border bg-card p-10 text-center">
          <p className="eyebrow text-gold">Private area</p>
          <h1 className="mt-5 font-display text-4xl">Administrator access is required</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">This account is signed in, but it has not been granted access to manage the invitation.</p>
          <button type="button" onClick={() => void signOut()} className="mt-8 border border-gold px-6 py-3 text-xs uppercase tracking-[0.18em] hover:bg-gold hover:text-primary-foreground">Sign out</button>
        </div>
      </main>
    );
  }

  const content: SiteContent = { ...DEFAULT_CONTENT, ...((data.settings?.content as Partial<SiteContent> | undefined) ?? {}) };
  const gallery = (data.gallery ?? []) as GalleryItem[];
  const pending = data.messages.filter((message) => message.status === "pending").length;
  const tabs = [
    { id: "invitation" as const, label: "Invitation", icon: LayoutTemplate },
    { id: "gallery" as const, label: `Gallery · ${gallery.length}`, icon: Images },
    { id: "messages" as const, label: `Messages · ${pending} pending`, icon: MessageCircle },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="font-display text-2xl">A<span className="text-gold">·</span>60</Link>
            <p className="eyebrow mt-2 text-muted-foreground">Celebration studio</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" target="_blank" className="inline-flex items-center gap-2 border border-border px-4 py-3 text-xs uppercase tracking-[0.14em] hover:border-gold">
              View invitation <ExternalLink className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 border border-border px-4 py-3 text-xs uppercase tracking-[0.14em] hover:border-gold">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-12">
        <p className="eyebrow text-gold">Mrs Agnes Adu Gyamfi Adjei</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="display-xl text-5xl md:text-6xl">Your invitation, beautifully managed.</h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Changes appear on the shared invitation as soon as they are saved.</p>
        </div>

        <dl className="mt-10 grid grid-cols-2 border-l border-t border-border md:grid-cols-4">
          {[
            ["Messages received", data.messages.length],
            ["Approved", data.messages.filter((message) => message.status === "approved").length],
            ["Pending review", pending],
            ["Photographs", gallery.length],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-border bg-card p-5 md:p-6">
              <dt className="eyebrow text-muted-foreground">{label}</dt>
              <dd className="mt-3 font-display text-4xl">{value}</dd>
            </div>
          ))}
        </dl>

        <nav className="mt-10 flex gap-1 overflow-x-auto border-b border-border" aria-label="Administration sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-4 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${tab === item.id ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "invitation" && <InvitationForm initialContent={content} heroPath={data.settings?.hero_image_url ?? null} />}
          {tab === "gallery" && <GalleryManager items={gallery} />}
          {tab === "messages" && <MessageModeration messages={data.messages} />}
        </div>
      </div>
    </main>
  );
}
