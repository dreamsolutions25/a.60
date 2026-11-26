import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addGalleryItem, deleteGalleryItem, saveHeroPath, updateGalleryItem } from "@/lib/admin.functions";
import { signPaths, type GalleryItem } from "@/lib/content";
import { imageUploadError } from "@/lib/upload";

const input =
  "w-full border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

function GalleryCard({ item, url }: { item: GalleryItem; url: string | undefined }) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [order, setOrder] = useState(item.display_order);
  const [featured, setFeatured] = useState(item.is_featured);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const update = useServerFn(updateGalleryItem);
  const remove = useServerFn(deleteGalleryItem);
  const saveHero = useServerFn(saveHeroPath);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["site-data"] });
  };

  const save = async () => {
    setBusy(true);
    try {
      await update({ data: { id: item.id, caption: caption.trim() || null, display_order: order, is_featured: featured } });
      await refresh();
      toast.success("Photograph details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this photograph");
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async () => {
    if (!window.confirm("Remove this photograph from the invitation? This cannot be undone.")) return;
    setBusy(true);
    try {
      await remove({ data: { id: item.id } });
      await refresh();
      toast.success("Photograph removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this photograph");
    } finally {
      setBusy(false);
    }
  };

  const makePortrait = async () => {
    setBusy(true);
    try {
      await saveHero({ data: item.image_url });
      await refresh();
      toast.success("Main portrait updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the main portrait");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="border border-border bg-card">
      <div className="aspect-[4/3] bg-secondary">
        {url ? <img src={url} alt={caption || "Gallery photograph"} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="space-y-4 p-5">
        <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Caption
          <input className={`${input} mt-2 normal-case tracking-normal`} value={caption} maxLength={240} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <div className="flex items-end gap-4">
          <label className="w-28 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Order
            <input className={`${input} mt-2`} type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </label>
          <label className="flex flex-1 cursor-pointer items-center gap-2 pb-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Large feature
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button type="button" disabled={busy} onClick={() => void save()} className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground hover:text-gold disabled:opacity-50">
            <Save className="h-4 w-4" /> Save
          </button>
          <button type="button" disabled={busy} onClick={() => void makePortrait()} className="text-xs text-muted-foreground hover:text-gold disabled:opacity-50">
            Use as main portrait
          </button>
          <button type="button" disabled={busy} onClick={() => void deleteItem()} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const add = useServerFn(addGalleryItem);
  const paths = items.map((item) => item.image_url);
  const { data: urls } = useQuery({
    queryKey: ["admin-gallery-urls", paths],
    queryFn: () => signPaths(paths),
    enabled: paths.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const upload = async (files: File[]) => {
    if (!files.length) return;
    const invalidFile = files.map(imageUploadError).find(Boolean);
    if (invalidFile) {
      toast.error(invalidFile);
      return;
    }
    setUploading(true);
    let added = 0;
    let nextOrder = items.reduce((maximum, item) => Math.max(maximum, item.display_order), -1) + 1;
    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
      const path = `gallery/${crypto.randomUUID()}-${safeName}`;
      try {
        const { error } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600" });
        if (error) throw error;
        await add({ data: { image_url: path, caption: caption.trim() || null, display_order: nextOrder, is_featured: items.length === 0 && added === 0 } });
        added += 1;
        nextOrder += 1;
      } catch (error) {
        await supabase.storage.from("gallery").remove([path]);
        toast.error(error instanceof Error ? error.message : `Could not upload ${file.name}`);
        break;
      }
    }
    if (added > 0) {
      setCaption("");
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
      await queryClient.invalidateQueries({ queryKey: ["site-data"] });
      toast.success(`${added} photograph${added === 1 ? "" : "s"} added to the gallery`);
    }
    setUploading(false);
  };

  return (
    <div>
      <section className="flex flex-col gap-5 border border-border bg-card p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="max-w-md flex-1">
          <p className="eyebrow text-gold">Add a memory</p>
          <label className="mt-5 block text-sm font-medium">
            Caption (optional)
            <input className={`${input} mt-2`} value={caption} maxLength={240} onChange={(e) => setCaption(e.target.value)} placeholder="A treasured moment" />
          </label>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-3 bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90">
          <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Choose photographs"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              void upload(files);
            }}
          />
        </label>
      </section>

      {items.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} url={urls?.[item.image_url]} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-dashed border-gold/50 px-6 py-20 text-center">
          <p className="font-display text-3xl">Your gallery is ready</p>
          <p className="mt-3 text-sm text-muted-foreground">Add the first photograph above. Until then, the invitation shows its original collection.</p>
        </div>
      )}
    </div>
  );
}
