import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { SiteContent } from "@/lib/content";
import { Ornament, Reveal } from "./Ornament";

export const RELATIONSHIPS = ["Family", "Friend", "Colleague", "Former Colleague", "Church Member", "Other"];
export const MESSAGE_MAX = 2000;

export const messageSchema = z.object({
  full_name: z.string().trim().min(2, "Write your full name, at least two letters.").max(100, "Write your name in under 100 characters."),
  relationship: z.string().max(40).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Write a message of at least 10 characters.")
    .max(MESSAGE_MAX, `Write your message in under ${MESSAGE_MAX} characters.`),
});

type Field = "full_name" | "message";

/* The booking-form recipe (system.md, Forms) as a React form that saves to Supabase: labels you can see,
   errors under their fields on submit only, one status line, the confirmation only after a real save.
   Not class "form": system.js would take it over. */
export function Guestbook({ content }: { content: SiteContent }) {
  const [form, setForm] = useState({ full_name: "", relationship: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const refs = { full_name: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) };
  const { data: approved } = useQuery({
    queryKey: ["approved-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, full_name, relationship, message, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const parsed = messageSchema.safeParse({ ...form, relationship: form.relationship || undefined });
    if (!parsed.success) {
      const errs: Partial<Record<Field, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = String(i.path[0]) as Field;
        if (!errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      setStatus("idle");
      const first = (["full_name", "message"] as Field[]).find((k) => errs[k]);
      if (first) refs[first].current?.focus();
      return;
    }
    setErrors({});
    const fingerprint = `${parsed.data.full_name}|${parsed.data.message}`;
    if (sessionStorage.getItem("agnes-last-message") === fingerprint) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.from("messages").insert({
      full_name: parsed.data.full_name,
      relationship: parsed.data.relationship ?? null,
      message: parsed.data.message,
    });
    if (error) {
      setStatus("error");
      return;
    }
    sessionStorage.setItem("agnes-last-message", fingerprint);
    setForm({ full_name: "", relationship: "", message: "" });
    setStatus("sent");
  };

  const errCount = Object.keys(errors).length;
  const statusText =
    status === "sending"
      ? "Sending"
      : status === "sent"
        ? "Your message is with the family. Thank you for writing to Agnes."
        : status === "error"
          ? "Not sent: the connection failed. Your words are still here; try again."
          : errCount
            ? `${errCount} ${errCount === 1 ? "field" : "fields"} to fix.`
            : "";

  const quotes = approved ?? [];

  return (
    <section className="section" id="messages" aria-labelledby="msg-h">
      <Reveal className="section__head">
        <p className="eyebrow">Personal messages</p>
        <h2 id="msg-h" className="heading">
          A Message for Agnes
        </h2>
        <Ornament />
        {content.messages_intro.split(/\n+/).map((p, i) => (
          <p key={i} className="quote quote--small">
            {p}
          </p>
        ))}
      </Reveal>
      <Reveal className="guest">
        {status === "sent" ? (
          <div className="sent" role="status">
            <svg className="sent__mark" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="28" />
              <path d="M19 31l8 8 15-17" />
            </svg>
            <p className="sent__text">Your message has been received with love and appreciation. Thank you for being part of this special celebration.</p>
            <button type="button" className="btn btn--outline" onClick={() => setStatus("idle")}>
              Write another message
            </button>
          </div>
        ) : (
          <form className="guest-form" onSubmit={submit} noValidate aria-describedby="gb-status">
            <div className="field">
              <label htmlFor="gb-name">Full name</label>
              <input
                ref={refs.full_name}
                id="gb-name"
                name="full_name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                value={form.full_name}
                aria-invalid={errors.full_name ? true : undefined}
                aria-describedby="gb-name-err"
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <p className="field__error" id="gb-name-err" hidden={!errors.full_name}>
                {errors.full_name}
              </p>
            </div>
            <div className="field">
              <label htmlFor="gb-rel">Relationship to the celebrant (optional)</label>
              <select id="gb-rel" name="relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                <option value="">Choose one</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field field--full">
              <label htmlFor="gb-msg">Personal message</label>
              <textarea
                ref={refs.message}
                id="gb-msg"
                name="message"
                rows={5}
                maxLength={MESSAGE_MAX}
                required
                value={form.message}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby="gb-msg-err gb-msg-count"
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <p className="field__error" id="gb-msg-err" hidden={!errors.message}>
                {errors.message}
              </p>
              <p className="t-small muted" id="gb-msg-count">
                {form.message.length} of {MESSAGE_MAX} characters
              </p>
            </div>
            <div className="btn-row">
              <button className="btn" type="submit" aria-busy={status === "sending" || undefined} disabled={status === "sending"}>
                Send your message
              </button>
            </div>
            <p className="form__status" role="status" id="gb-status">
              {statusText}
            </p>
          </form>
        )}
      </Reveal>
      {quotes.length > 0 && (
        <div className="notes">
          <p className="eyebrow center">Words of love</p>
          {quotes.map((m) => (
            <figure key={m.id} className="note">
              <blockquote>“{m.message}”</blockquote>
              <figcaption>
                {m.full_name}
                {m.relationship ? ` · ${m.relationship}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
