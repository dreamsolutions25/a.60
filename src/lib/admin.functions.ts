import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-auth";

const milestoneSchema = z.object({
  label: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  text: z.string().trim().min(1).max(1500),
  highlight: z.string().trim().max(240).optional(),
});

const contentSchema = z.object({
  celebrant_name: z.string().trim().min(2).max(160),
  hero_tagline: z.string().trim().min(1).max(240),
  hero_intro: z.string().trim().min(1).max(600),
  sixty_heading: z.string().trim().min(1).max(160),
  sixty_text: z.string().trim().min(1).max(1500),
  story_intro: z.string().trim().min(1).max(1500),
  milestones: z.array(milestoneSchema).min(1).max(12),
  celebration_text: z.string().trim().min(1).max(1200),
  occasion: z.string().trim().min(1).max(240),
  event_title: z.string().trim().min(1).max(300),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}$/),
  venue: z.string().trim().min(1).max(240),
  venue_location: z.string().trim().min(1).max(400),
  gallery_text: z.string().trim().min(1).max(1200),
  messages_intro: z.string().trim().min(1).max(1800),
  closing_title: z.string().trim().min(1).max(240),
  closing_quote: z.string().trim().min(1).max(800),
  closing_message: z.string().trim().min(1).max(1200),
  footer: z.string().trim().min(1).max(240),
});

const storagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((path) => !path.startsWith("/") && !path.includes(".."), "Invalid storage path");

const galleryInputSchema = z.object({
  image_url: storagePathSchema,
  caption: z.string().trim().max(240).nullable(),
  display_order: z.number().int().min(0).max(100000),
  is_featured: z.boolean(),
});

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [{ data: settings, error: settingsError }, { data: gallery, error: galleryError }, { data: messages, error: messagesError }] =
      await Promise.all([
        context.supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
        context.supabase.from("gallery").select("*").order("display_order", { ascending: true }),
        context.supabase.from("messages").select("*").order("created_at", { ascending: false }),
      ]);
    if (settingsError) throw settingsError;
    if (galleryError) throw galleryError;
    if (messagesError) throw messagesError;
    return { settings, gallery: gallery ?? [], messages: messages ?? [] };
  });

export const saveInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contentSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("event_settings").upsert({ id: 1, content: data });
    if (error) throw error;
    return { success: true };
  });

export const saveHeroPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => storagePathSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("event_settings").upsert({ id: 1, hero_image_url: data });
    if (error) throw error;
    return { success: true };
  });

export const addGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => galleryInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: item, error } = await context.supabase
      .from("gallery")
      .insert({ ...data, storage_path: data.image_url })
      .select()
      .single();
    if (error) throw error;
    return item;
  });

export const updateGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        caption: z.string().trim().max(240).nullable(),
        display_order: z.number().int().min(0).max(100000),
        is_featured: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("gallery")
      .update({ caption: data.caption, display_order: data.display_order, is_featured: data.is_featured })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: item, error: readError } = await context.supabase
      .from("gallery")
      .select("id, image_url")
      .eq("id", data.id)
      .single();
    if (readError) throw readError;
    const { error } = await context.supabase.from("gallery").delete().eq("id", data.id);
    if (error) throw error;
    const { error: storageError } = await context.supabase.storage.from("gallery").remove([item.image_url]);
    if (storageError) console.error("Gallery file cleanup failed", storageError);
    return { success: true };
  });

export const setMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("messages").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("messages").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
