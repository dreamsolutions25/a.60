import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* Soft fade-up as a block scrolls into view (once). MotionConfig in the route turns it off under reduced motion. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Fine champagne-gold rule with a small diamond. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`orn ${className}`} aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  );
}
