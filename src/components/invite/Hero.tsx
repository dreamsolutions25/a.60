import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import portrait from "@/assets/agnes-white.jpg";
import type { SiteContent } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ content, heroUrl }: { content: SiteContent; heroUrl: string | null }) {
  const name = content.celebrant_name;
  const hasMrs = /^Mrs\.?\s/i.test(name);
  const words = name.replace(/^Mrs\.?\s+/i, "").split(" ");
  return (
    <section className="hero" id="top" aria-labelledby="hero-h">
      <motion.figure className="hero__photo" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease }}>
        <div className="hero__frame">
          <img src={heroUrl ?? portrait} alt={`Portrait of ${name}`} fetchPriority="high" />
        </div>
      </motion.figure>

      <div className="hero__text">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }}>
          You are cordially invited
        </motion.p>
        <h1 id="hero-h" className="hero__name">
          {hasMrs && (
            <motion.span className="hero__mrs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5, ease }}>
              Mrs
            </motion.span>
          )}
          {words.map((w, i) => (
            <motion.span key={i} className="hero__word" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.65 + i * 0.12, ease }}>
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.div className="rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, delay: 1.2, ease }} />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.4, ease }}>
          <p className="hero__tagline">{content.hero_tagline}</p>
          <p className="hero__intro">{content.hero_intro}</p>
          <Countdown date={content.event_date} time={content.event_time} />
          <a className="btn btn--outline" href="#sixty">
            Explore the invitation
          </a>
        </motion.div>
      </div>
    </section>
  );
}

const UNITS = ["Days", "Hours", "Minutes", "Seconds"];

/* Counts down to the start in Accra time (GMT all year). Dashes until mounted, so server and browser render the same. */
function Countdown({ date, time }: { date: string; time: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = Date.parse(`${date}T${time}:00Z`);
  const left = now === null || isNaN(target) ? null : Math.max(0, target - now);
  const values = left === null ? null : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="count" role="timer" aria-label="Time until the celebration">
      {UNITS.map((u, i) => (
        <div key={u} className="count__unit">
          <span className="count__num">{values ? String(values[i]).padStart(2, "0") : "––"}</span>
          <span className="count__label">{u}</span>
        </div>
      ))}
    </div>
  );
}
