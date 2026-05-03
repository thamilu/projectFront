"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionRevealProps {
  children: ReactNode;
  index: number;
}

/**
 * Enterprise Section Reveal Animation
 * 
 * Provides a staggered, professional entrance animation for home page sections.
 * Uses viewport-triggering for "reveal-on-scroll" logic.
 */
export function SectionReveal({ children, index }: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.1, // Stagger effect
        ease: [0.21, 0.45, 0.32, 0.9], // Professional cubic-bezier
      }}
    >
      {children}
    </motion.div>
  );
}
