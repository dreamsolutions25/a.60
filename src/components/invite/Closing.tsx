import { useState } from "react";
import type { SiteContent } from "@/lib/content";
import { Ornament, Reveal } from "./Ornament";

const SHARE_TEXT = "Mrs Agnes Adu Gyamfi Adjei – 60 Years of Excellence. You are cordially invited.";

export function Closing({ content }: { content: SiteContent }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text: SHARE_TEXT, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${window.location.origin}`)}`, "_blank", "noopener");

  return (
    <footer className="closing">
      <Reveal className="closing__inner">
        <Ornament />
        <h2 className="heading heading--xl">{content.closing_title}</h2>
        <p className="closing__quote">“{content.closing_quote}”</p>
        <p className="closing__msg">{content.closing_message}</p>
        <p className="closing__name">{content.celebrant_name}</p>
        <div className="rule rule--center" />
        <div className="actions">
          <button type="button" className="btn" onClick={share}>
            {copied ? "Link copied" : "Share invitation"}
          </button>
          <button type="button" className="btn btn--outline" onClick={whatsapp}>
            Share on WhatsApp
          </button>
        </div>
      </Reveal>
      <p className="closing__foot">{content.footer}</p>
    </footer>
  );
}
