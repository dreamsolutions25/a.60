import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import portrait from "@/assets/agnes-white.jpg";
import { supabase } from "@/integrations/supabase/client";
import { saveHeroPath, saveInvitation } from "@/lib/admin.functions";
import { DEFAULT_CONTENT, signPaths, type Milestone, type SiteContent } from "@/lib/content";
import { imageUploadError } from "@/lib/upload";

const input =
  "mt-2 w-full border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold";
const label = "block text-sm font-medium text-foreground";

function Field({
  label: title,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: "text" | "date" | "time";
}) {
  return (
    <label className={label}>
      {title}
      {multiline ? (
        <textarea className={`${input} min-h-32 resize-y leading-relaxed`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={input} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function InvitationForm({ initialContent, heroPath }: { initialContent: SiteContent; heroPath: string | null }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const save = useServerFn(saveInvitation);
  const saveHero = useServerFn(saveHeroPath);

  useEffect(() => setContent(initialContent), [initialContent]);

  const { data: heroUrls } = useQuery({
    queryKey: ["admin-hero", heroPath],
    queryFn: () => signPaths(heroPath ? [heroPath] : []),
    enabled: !!heroPath,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const update = (key: keyof SiteContent, value: string | Milestone[]) => setContent((current) => ({ ...current, [key]: value }));
  const updateMilestone = (index: number, key: keyof Milestone, value: string) =>
    setContent((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, i) => (i === index ? { ...milestone, [key]: value } : milestone)),
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({ data: content });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["site-data"] });
      toast.success("Invitation details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The invitation could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const uploadHero = async (file: File | undefined) => {
    if (!file) return;
    const validationError = imageUploadError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const path = `hero/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      await saveHero({ data: path });
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["site-data"] });
      toast.success("Main portrait updated");
    } catch (error) {
      await supabase.storage.from("gallery").remove([path]);
      toast.error(error instanceof Error ? error.message : "The portrait could not be uploaded");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <img
            src={(heroPath && heroUrls?.[heroPath]) || portrait}
            alt="Current main portrait"
            className="h-48 w-36 border border-gold/40 object-cover object-top"
          />
          <div>
            <p className="eyebrow text-gold">Main portrait</p>
            <h2 className="mt-3 font-display text-3xl">The first photograph guests see</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Choose a clear vertical portrait. JPG, PNG, or WebP up to 8 MB.
            </p>
            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 border border-gold px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:bg-gold hover:text-primary-foreground">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading…" : "Change portrait"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void uploadHero(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-gold">Opening & introduction</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Celebrant's full name" value={content.celebrant_name} onChange={(v) => update("celebrant_name", v)} />
          </div>
          <Field label="Hero tagline" value={content.hero_tagline} onChange={(v) => update("hero_tagline", v)} />
          <Field label="Hero introduction" value={content.hero_intro} onChange={(v) => update("hero_intro", v)} />
          <Field label="Sixty years heading" value={content.sixty_heading} onChange={(v) => update("sixty_heading", v)} />
          <Field label="Sixty years message" value={content.sixty_text} onChange={(v) => update("sixty_text", v)} multiline />
        </div>
      </section>

      <section className="border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-gold">Her story</p>
        <div className="mt-6">
          <Field label="Story introduction" value={content.story_intro} onChange={(v) => update("story_intro", v)} multiline />
        </div>
        <div className="mt-8 space-y-6">
          {content.milestones.map((milestone, index) => (
            <div key={index} className="border border-border bg-background p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-2xl">Chapter {index + 1}</p>
                {content.milestones.length > 1 && (
                  <button
                    type="button"
                    className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove chapter ${index + 1}`}
                    onClick={() => update("milestones", content.milestones.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Label" value={milestone.label} onChange={(v) => updateMilestone(index, "label", v)} />
                <Field label="Title" value={milestone.title} onChange={(v) => updateMilestone(index, "title", v)} />
                <div className="md:col-span-2">
                  <Field label="Story" value={milestone.text} onChange={(v) => updateMilestone(index, "text", v)} multiline />
                </div>
                <div className="md:col-span-2">
                  <Field label="Highlighted achievement (optional)" value={milestone.highlight ?? ""} onChange={(v) => updateMilestone(index, "highlight", v)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          onClick={() => update("milestones", [...content.milestones, { label: "New chapter", title: "A new milestone", text: "Share this part of her journey." }])}
        >
          <Plus className="h-4 w-4" /> Add a chapter
        </button>
      </section>

      <section className="border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-gold">Celebration details</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Calendar event title" value={content.event_title} onChange={(v) => update("event_title", v)} />
          </div>
          <Field label="Occasion" value={content.occasion} onChange={(v) => update("occasion", v)} />
          <Field label="Invitation message" value={content.celebration_text} onChange={(v) => update("celebration_text", v)} />
          <Field label="Date" type="date" value={content.event_date} onChange={(v) => update("event_date", v)} />
          <Field label="Time (Africa/Accra)" type="time" value={content.event_time} onChange={(v) => update("event_time", v)} />
          <Field label="Venue name" value={content.venue} onChange={(v) => update("venue", v)} />
          <Field label="Directions destination" value={content.venue_location} onChange={(v) => update("venue_location", v)} />
        </div>
      </section>

      <section className="border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-gold">Memories, messages & closing</p>
        <div className="mt-6 grid gap-6">
          <Field label="Gallery introduction" value={content.gallery_text} onChange={(v) => update("gallery_text", v)} multiline />
          <Field label="Guest message introduction" value={content.messages_intro} onChange={(v) => update("messages_intro", v)} multiline />
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Closing title" value={content.closing_title} onChange={(v) => update("closing_title", v)} />
            <Field label="Footer" value={content.footer} onChange={(v) => update("footer", v)} />
          </div>
          <Field label="Closing quotation" value={content.closing_quote} onChange={(v) => update("closing_quote", v)} multiline />
          <Field label="Closing message" value={content.closing_message} onChange={(v) => update("closing_message", v)} multiline />
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center gap-3 bg-primary px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save invitation"}
        </button>
      </div>
    </form>
  );
}
