"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const NODE_COUNT = 16;

function useMesh() {
  const [nodes] = useState(() =>
    Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      r: 1.2 + Math.random() * 1.3,
    }))
  );
  return nodes;
}

export default function ClinicAmbientBackground() {
  const nodes = useMesh();

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 18) lines.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      pointerEvents: "none", overflow: "hidden",
    }}>
      {/* Soft accent orb, drifts slowly */}
      <motion.div
        animate={{
          x: ["-5%", "8%", "-5%"],
          y: ["0%", "6%", "0%"],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-10%", right: "5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "var(--accent-gradient)",
          filter: "blur(120px)", opacity: 0.05,
        }}
      />
      <motion.div
        animate={{
          x: ["0%", "-8%", "0%"],
          y: ["0%", "-5%", "0%"],
        }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", bottom: "-15%", left: "0%",
          width: 420, height: 420, borderRadius: "50%",
          background: "var(--accent-primary)",
          filter: "blur(110px)", opacity: 0.04,
        }}
      />

      {/* Neural mesh — data-flow visualization */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="var(--accent-primary)" strokeWidth="0.05" opacity="0.35" />
        ))}
        {nodes.map((n, i) => (
          <motion.circle key={i} cx={n.x} cy={n.y} r={n.r * 0.3}
            fill="var(--accent-primary)"
            animate={{ opacity: [0.15, 0.7, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: n.delay, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Subtle scanning grid line — top to bottom sweep, very slow */}
      <motion.div
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
          opacity: 0.12,
        }}
      />
    </div>
  );
}