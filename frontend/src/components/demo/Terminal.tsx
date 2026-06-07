"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const LOGS = [
  { agent: "A1", msg: "Prescription parsed — Metformin 500mg × 2/day detected", c: "#6366f1" },
  { agent: "A2", msg: "Reminder job created — patient_001 @ 09:00 & 21:00 IST", c: "#06b6d4" },
  { agent: "A3", msg: "Stock alert fired — Metformin depletes in 2 days", c: "#10b981" },
  { agent: "SYS", msg: "LangGraph state machine updated — node: adherence_scheduler", c: "#8b5cf6" },
  { agent: "A2", msg: "Escalation L1 triggered — 3 missed doses → family notified", c: "#f59e0b" },
  { agent: "A3", msg: "Reorder approved — Pharmeasy deep-link dispatched", c: "#10b981" },
  { agent: "A1", msg: "Safety gate passed — dosage within WHO limits", c: "#6366f1" },
  { agent: "SYS", msg: "WhatsApp delivery confirmed — +91 98XX XXXXX", c: "#8b5cf6" },
  { agent: "A2", msg: "Adherence score updated — 87.5% this week", c: "#06b6d4" },
  { agent: "A3", msg: "7-day depletion model recalculated — confidence 94%", c: "#10b981" },
];

export function Terminal() {
  const [logs, setLogs] = useState<(typeof LOGS[0] & { time: string })[]>([]);
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const log = LOGS[idx % LOGS.length];
      setLogs(prev => [...prev.slice(-7), {
        ...log,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      }]);
      setIdx(i => i + 1);
    }, 1800);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "#050810", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 60px rgba(99,102,241,0.06)" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <span className="text-xs font-mono text-slate-600 ml-2">medloop-ai — agent-activity-feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-500">LIVE</span>
        </div>
      </div>
      {/* Logs */}
      <div ref={ref} className="p-4 font-mono text-xs space-y-2.5 overflow-y-auto"
        style={{ minHeight: 220, maxHeight: 280 }}>
        {logs.length === 0 && (
          <span className="text-slate-700">Initializing agent network...</span>
        )}
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 items-start">
              <span className="text-slate-700 shrink-0">{log.time}</span>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: `${log.c}20`, color: log.c }}>{log.agent}</span>
              <span className="text-slate-400 leading-relaxed">{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="text-indigo-400 animate-blink">█</span>
      </div>
    </div>
  );
}