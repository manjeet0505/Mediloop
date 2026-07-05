"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const NODE_COUNT = 14;

function useMesh() {
  const [nodes] = useState(() =>
    Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      r: 1.4 + Math.random() * 1.2,
    }))
  );
  return nodes;
}

export default function AmbientBackground({ accent = "#6366f1" }: { accent?: string }) {
  const nodes = useMesh();

  // connect nearby nodes only (avoid spider-web clutter)
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 22) lines.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      pointerEvents: "none", overflow: "hidden",
    }}>
      {/* Neural mesh */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={accent} strokeWidth="0.06" />
        ))}
        {nodes.map((n, i) => (
          <motion.circle key={i} cx={n.x} cy={n.y} r={n.r * 0.4}
            fill={accent}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: n.delay, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* ECG scan line — thin, drifts down slowly, loops */}
      <motion.svg
        width="140%" height="60" viewBox="0 0 700 60"
        style={{ position: "absolute", left: "-20%", opacity: 0.28 }}
        initial={{ top: "-5%" }}
        animate={{ top: ["8%", "92%", "8%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <path
          d="M0,30 L120,30 L140,10 L160,50 L180,30 L260,30 L280,8 L300,52 L320,30 L700,30"
          fill="none" stroke={accent} strokeWidth="2"
        />
      </motion.svg>
    </div>
  );
}