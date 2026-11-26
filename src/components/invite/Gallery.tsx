import { useCallback, useEffect, useRef, useState } from "react";
import white from "@/assets/agnes-white.jpg";
import kente from "@/assets/agnes-kente.jpg";
import desk from "@/assets/agnes-desk.jpg";
import blue from "@/assets/agnes-blue.jpg";
import early from "@/assets/agnes-2004.jpg";
import type { GalleryItem, SiteContent } from "@/lib/content";
import { Ornament, Reveal } from "./Ornament";

type Shot = { src: string; alt: string; client: boolean };

/* Her own photographs until the family uploads more in the admin dashboard. */
const STAND_INS: Shot[] = [
  { src: kente, alt: "Agnes in a yellow beaded dress with kente sleeves", client: true },
  { src: blue, alt: "Agnes seated in her office in a pale blue blouse", client: true },
  { src: white, alt: "Agnes in a white lace dress", client: true },
  { src: desk, alt: "Agnes at her desk at the Ghana Revenue Authority", client: true },
  { src: early, alt: "Agnes in her office in 2004", client: true },
];

export function Gallery({ content, items }: { content: SiteContent; items: GalleryItem[] }) {
  const uploaded: Shot[] = items
    .filter((i) => i.url)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .map((i) => ({ src: i.url!, alt: i.caption || "A photograph from the celebrant's life", client: true }));
  const shots = uploaded.length ? uploaded : STAND_INS;
  const wall = shots.slice(0, 5);

  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    setIndex(i);
  };
  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + shots.length) % shots.length)), [shots.length]);

  useEffect(() => {
    if (index === null) return;
    closeBtn.current?.focus();
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", on);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", on);
    };
  }, [index, close, step]);

  return (
    <section className="section" id="memories" aria-labelledby="mem-h">
      <Reveal className="section__head">
        <p className="eyebrow">A gallery</p>
        <h2 id="mem-h" className="heading">
          Moments &amp; Memories
        </h2>
        <Ornament />
        <p className="quote quote--small">“{content.gallery_text}”</p>
      </Reveal>
      <div className="gallery">
        {wall.map((s, i) => (
          <Reveal key={s.src} delay={(i % 3) * 0.08} className={`gallery__cell${i === 0 ? " is-feature" : ""}`}>
            <button type="button" className="gallery__item" onClick={(e) => open(i, e.currentTarget)} aria-label={`Open photograph: ${s.alt}`}>
              <img src={s.src} alt="" loading="lazy" />
            </button>
          </Reveal>
        ))}
      </div>
      {shots.length > wall.length && (
        <p className="center">
          <button type="button" className="btn btn--outline" onClick={(e) => open(0, e.currentTarget)}>
            See all {shots.length} photographs
          </button>
        </p>
      )}

      {index !== null && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label="Photograph viewer" onClick={close}>
          <figure className="viewer__fig" onClick={(e) => e.stopPropagation()}>
            <img key={index} className="viewer__img" src={shots[index]!.src} alt={shots[index]!.alt} />
            <figcaption aria-live="polite">
              {shots[index]!.alt} <span>· {index + 1} of {shots.length}</span>
            </figcaption>
          </figure>
          <button ref={closeBtn} type="button" className="viewer__btn viewer__close" onClick={close} aria-label="Close the viewer">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
          {shots.length > 1 && (
            <>
              <button type="button" className="viewer__btn viewer__prev" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label="Previous photograph">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" /></svg>
              </button>
              <button type="button" className="viewer__btn viewer__next" onClick={(e) => (e.stopPropagation(), step(1))} aria-label="Next photograph">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
