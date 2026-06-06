"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 2 + 0.5,
      d: Math.random() * 5 + 4,
      delay: Math.random() * 5,
      c: ["rgba(99,102,241,0.7)", "rgba(139,92,246,0.7)", "rgba(6,182,212,0.6)"][Math.floor(Math.random() * 3)],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%,black 40%,transparent 100%)"
      }} />
      {/* Orbs */}
      {[
        { x: "5%", y: "10%", c: "rgba(99,102,241,0.18)", s: 800, d: 10 },
        { x: "80%", y: "5%", c: "rgba(139,92,246,0.12)", s: 600, d: 14 },
        { x: "70%", y: "70%", c: "rgba(6,182,212,0.10)", s: 700, d: 12 },
        { x: "20%", y: "80%", c: "rgba(236,72,153,0.08)", s: 500, d: 16 },
      ].map((o, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: o.x, top: o.y, width: o.s, height: o.s, background: `radial-gradient(circle,${o.c} 0%,transparent 70%)`, transform: "translate(-50%,-50%)", filter: "blur(40px)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: p.c }}
          animate={{ y: [0, -80], opacity: [0, 0.9, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay }}
        />
      ))}
      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px"
      }} />
    </div>
  );
}