"use client";
import { motion } from "framer-motion";

export function GlowRing({ color, size, delay = 0 }: { color: string; size: number; delay?: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, border: `1px solid ${color}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
      animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}