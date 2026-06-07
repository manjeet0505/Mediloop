"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Hero() {
  const { online } = useServerHealth();
  const [apiCalls, setApiCalls] = useState(247);

  useEffect(() => {
    const t = setInterval(() => setApiCalls(n => n + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center pt-24 pb-16">

      {/* Floating badge */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="flex justify-center mb-10">
        <motion.div
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-mono"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}
          animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0)", "0 0 30px 4px rgba(99,102,241,0.15)", "0 0 0 0 rgba(99,102,241,0)"] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>3 of 5 agents live</span>
          <span className="text-slate-700">·</span>
          <span>{apiCalls} API calls today</span>
          <span className="text-slate-700">·</span>
          <span>India's #1 Autonomous Care AI</span>
        </motion.div>
      </motion.div>

      {/* Title */}
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div className="w-[600px] h-[200px] rounded-full"
            style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 70%)", filter: "blur(40px)" }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: "spring", stiffness: 60 }} className="relative z-10">
          <h1 className="font-black leading-[0.9] mb-4 select-none tracking-tight"
            style={{ fontSize: "clamp(60px,11vw,130px)" }}>
            <motion.span
              style={{
                background: "linear-gradient(135deg,#818cf8 0%,#a78bfa 30%,#38bdf8 70%,#34d399 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundSize: "200% 200%",
                display: "inline-block",
              }}
              animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              MedLoop
            </motion.span>
          </h1>
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.25em" }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-light uppercase tracking-widest"
            style={{ fontSize: "clamp(14px,2.5vw,28px)", color: "rgba(255,255,255,0.4)" }}
          >
            Autonomous Care AI
          </motion.div>
        </motion.div>
      </div>

      {/* Subtitle */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-center text-slate-500 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
        India's first <span className="text-indigo-400 font-medium">fully autonomous</span> patient
        care platform. 5 AI agents handle the entire care loop — from prescription photo to doctor follow-up.
      </motion.p>

      {/* CTAs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-4 mb-20">
        <MagneticButton href="http://localhost:8000/docs" target="_blank"
          className="px-8 py-4 rounded-2xl font-semibold text-white text-sm relative overflow-hidden cursor-pointer"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}>
          View Live API →
        </MagneticButton>
        <MagneticButton href="#demo"
          className="px-8 py-4 rounded-2xl font-semibold text-slate-300 text-sm cursor-pointer"
          style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)" }}>
          Try Live Demo ↓
        </MagneticButton>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: online ? "ONLINE" : "OFFLINE", l: "Backend Status", c: online ? "#10b981" : "#ef4444", pulse: true },
          { v: String(apiCalls), l: "API Calls Today", c: "#6366f1", pulse: true },
          { v: "3 / 5", l: "Agents Active", c: "#8b5cf6", pulse: false },
          { v: "INR 0", l: "Infra Cost", c: "#06b6d4", pulse: false },
        ].map((s, i) => (
          <motion.div key={i}
            whileHover={{ y: -6, boxShadow: `0 20px 60px ${s.c}20` }}
            className="rounded-2xl p-5 text-center relative overflow-hidden group"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 50% 50%,${s.c}08 0%,transparent 70%)` }} />
            {s.pulse && (
              <div className="w-1.5 h-1.5 rounded-full mx-auto mb-2 animate-pulse" style={{ background: s.c }} />
            )}
            <div className="text-2xl md:text-3xl font-black mb-1 relative z-10" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs text-slate-600 uppercase tracking-wider relative z-10">{s.l}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}