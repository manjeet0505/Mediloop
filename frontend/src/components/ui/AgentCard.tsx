"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AGENTS } from "@/lib/constants";

type Agent = typeof AGENTS[0];

export function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isLive = index < 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 80, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400 } }}
      className="relative rounded-2xl p-6 cursor-pointer overflow-hidden"
      style={{
        background: hovered ? agent.bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? agent.border : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered ? `0 20px 60px ${agent.color}15, 0 0 0 1px ${agent.color}20` : "none",
        transition: "background 0.4s, border 0.4s, box-shadow 0.4s",
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ background: `radial-gradient(circle at 30% 40%,${agent.color}12 0%,transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-6xl font-black leading-none select-none"
            style={{ color: agent.color, opacity: hovered ? 0.2 : 0.08, transition: "opacity 0.3s" }}>
            {agent.id}
          </div>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
            </span>
          ) : (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              BUILDING
            </span>
          )}
        </div>

        <div className="text-xs font-mono mb-1.5" style={{ color: agent.color }}>{agent.short}</div>
        <h3 className="text-base font-bold text-white mb-3 leading-snug">{agent.name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-5">{agent.desc}</p>

        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 pt-4"
              style={{ borderTop: `1px solid ${agent.color}20` }}>
              {agent.tools.map((tool, i) => (
                <motion.span key={i} initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                  className="text-xs px-2.5 py-1 rounded-lg font-mono"
                  style={{ background: `${agent.color}12`, color: agent.color, border: `1px solid ${agent.color}22` }}>
                  {tool}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}