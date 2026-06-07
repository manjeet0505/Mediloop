"use client";
import { motion } from "framer-motion";
import { useServerHealth } from "@/hooks/useApi";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: ["Agent Network", "Live Demo", "Tech Stack", "Swagger API"],
  },
  {
    title: "Agents",
    links: ["Prescription AI", "Reminder Agent", "Stock Monitor", "Health Monitor", "Follow-up Coord"],
  },
  {
    title: "Build",
    links: ["FastAPI Backend", "Next.js Frontend", "LangGraph Docs", "GitHub Repo"],
  },
];

export function Footer() {
  const { online } = useServerHealth();

  return (
    <footer className="relative mt-8">
      {/* Top glow line */}
      <div className="w-full h-px mb-16"
        style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),rgba(139,92,246,0.5),transparent)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6"
      >
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">

          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  M
                </div>
                <motion.div className="absolute inset-0 rounded-xl -z-10"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(12px)", opacity: 0.5 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <div>
                <div className="font-bold text-white">MedLoop AI</div>
                <div className="text-xs text-slate-600 font-mono">v1.0.0 · Beta</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              India's first autonomous patient care agent system. Built for 300M+ chronic disease patients.
            </p>
            {/* Status badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <motion.div className="w-2 h-2 rounded-full"
                style={{ background: online ? "#10b981" : "#ef4444" }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-mono text-slate-600">
                {online ? "All systems operational" : "Backend offline"}
              </span>
            </div>
          </div>

          {/* Link cols */}
          {FOOTER_LINKS.map((col, i) => (
            <div key={i}>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5">
                {col.title}
              </div>
              <div className="space-y-3">
                {col.links.map((link, j) => (
                  <motion.div key={j}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer transition-colors hover:text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                    {link}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-xs text-slate-700 font-mono">© 2026 MedLoop AI</span>
            <span className="text-slate-800">·</span>
            <span className="text-xs text-slate-700 font-mono">Built by Manjeet Kumar Mishra</span>
            <span className="text-slate-800">·</span>
            <span className="text-xs text-slate-700 font-mono">MDU, Rohtak · B.Tech CSE 2026</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["FastAPI", "LangGraph", "Next.js 14", "GPT-4o", "Qdrant"].map((t, i) => (
              <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg text-slate-700"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </footer>
  );
}