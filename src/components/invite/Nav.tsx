import { useEffect, useState } from "react";

const LINKS = [
  ["sixty", "60 Years"],
  ["story", "Her Story"],
  ["celebration", "Celebration"],
  ["memories", "Memories"],
  ["messages", "Messages"],
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`nav${scrolled || open ? " is-solid" : ""}`}>
      <nav className="nav__bar" aria-label="Main">
        <a className="nav__logo" href="#top">
          A<span>·</span>60
        </a>
        <ul className={`nav__links${open ? " is-open" : ""}`}>
          {LINKS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setOpen(false)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <button className="nav__toggle" type="button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}
