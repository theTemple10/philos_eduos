"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fades content up once when it scrolls into view. Kept deliberately small:
 * one gentle movement, no repeats. Honours the visitor's reduced-motion
 * setting through the <MotionConfig reducedMotion="user"> on the landing page.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
