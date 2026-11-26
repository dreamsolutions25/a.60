import { useEffect, useState } from "react";

/* The opening card, like lifting a printed invitation from its envelope. Once per visit; click, Enter or Escape opens it. */
export function Intro({ name }: { name: string }) {
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("agnes-opened")) setOpen(false);
  }, []);
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function dismiss() {
    sessionStorage.setItem("agnes-opened", "1");
    setLeaving(true);
    setTimeout(() => setOpen(false), 900);
  }

  if (!open) return null;
  return (
    <div className={`intro${leaving ? " is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label="Invitation" onClick={dismiss}>
      <div className="intro__card">
        <p className="eyebrow">You are cordially invited</p>
        <p className="intro__mono" aria-hidden="true">60</p>
        <p className="intro__name">{name}</p>
        <p className="intro__occ">60th Birthday &amp; Retirement Celebration</p>
        <button type="button" className="btn btn--outline" autoFocus onClick={dismiss}>
          Open the invitation
        </button>
      </div>
    </div>
  );
}
