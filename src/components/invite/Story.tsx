import { motion } from "framer-motion";
import early from "@/assets/agnes-2004.jpg";
import desk from "@/assets/agnes-desk.jpg";
import type { SiteContent } from "@/lib/content";
import { Ornament, Reveal } from "./Ornament";

export function Story({ content, photoUrl }: { content: SiteContent; photoUrl?: string | undefined }) {
  const last = content.milestones.length - 1;
  return (
    <>
      <section className="sixty" id="sixty" aria-labelledby="sixty-h">
        <motion.div
          className="sixty__num"
          aria-hidden="true"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          60
          <span>Years</span>
        </motion.div>
        <Reveal className="sixty__text">
          <p className="eyebrow">Celebrating 60 years</p>
          <h2 id="sixty-h" className="heading">
            {content.sixty_heading}
          </h2>
          <Ornament className="orn--left" />
          <p className="quote">“{content.sixty_text}”</p>
        </Reveal>
      </section>

      <section className="section" id="story" aria-labelledby="story-h">
        <Reveal className="section__head">
          <p className="eyebrow">A legacy of service</p>
          <h2 id="story-h" className="heading">
            Her Story
          </h2>
          <Ornament />
          <p className="quote quote--small">“{content.story_intro}”</p>
        </Reveal>

        <div className="story">
          <Reveal className="story__photos">
            <figure className="story__main">
              <img src={photoUrl ?? desk} alt="Agnes at her desk at the Ghana Revenue Authority" loading="lazy" />
            </figure>
            <figure className="story__inset">
              <img src={early} alt="Agnes in her office in 2004" loading="lazy" />
            </figure>
          </Reveal>

          <ol className="timeline">
            {content.milestones.map((m, i) => (
              <li key={i} className={i === last ? "is-last" : undefined}>
                <Reveal delay={0.1}>
                  <p className="eyebrow">{m.label}</p>
                  <h3 className="timeline__title">{m.title}</h3>
                  <p className="timeline__text">{m.text}</p>
                  {m.offices?.length ? (
                    <div className="offices">
                      <p className="offices__label">Offices she served in</p>
                      <ul>
                        {m.offices.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {m.highlight && (
                    <div className="timeline__highlight">
                      <p>{m.highlight}</p>
                      <span>{m.title}</span>
                    </div>
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
