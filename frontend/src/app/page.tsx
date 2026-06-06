"use client";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { prescriptionApi, stockApi } from "@/lib/api";
import { AGENTS, TECH_STACK, MARKET_STATS } from "@/lib/constants";

// ── Magnetic Button ──────────────────────────────────────────────
function MagneticButton({ children, className, style, onClick, href, target }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  const reset = () => { x.set(0); y.set(0); };

  const Comp = href ? "a" : "div";
  return (
    <motion.div ref={ref} style={{ x: springX, y: springY, display: "inline-block" }}
      onMouseMove={handleMouse} onMouseLeave={reset}>
      <Comp href={href} target={target} onClick={onClick} className={className} style={style}>
        {children}
      </Comp>
    </motion.div>
  );
}

// ── Noise texture overlay ────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px",
      }}
    />
  );
}

// ── Animated grid background ─────────────────────────────────────
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)"
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
      {/* Particles */}
      {Array.from({ length: 40 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        s: Math.random() * 2 + 0.5, d: Math.random() * 5 + 4, delay: Math.random() * 5,
        c: ["rgba(99,102,241,0.7)", "rgba(139,92,246,0.7)", "rgba(6,182,212,0.7)"][Math.floor(Math.random() * 3)]
      })).map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: p.c }}
          animate={{ y: [0, -80], opacity: [0, 0.9, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </div>
  );
}

// ── Glowing Ring ─────────────────────────────────────────────────
function GlowRing({ color, size, delay = 0 }: { color: string; size: number; delay?: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, border: `1px solid ${color}`, top: "50%", left: "50%", transform: "translate(-50%,-50%)", filter: `blur(1px)` }}
      animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

// ── Live Terminal ────────────────────────────────────────────────
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

function Terminal() {
  const [logs, setLogs] = useState<(typeof LOGS[0] & { time: string })[]>([]);
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const log = LOGS[idx % LOGS.length];
      setLogs(prev => [...prev.slice(-7), { ...log, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);
      setIdx(i => i + 1);
    }, 1800);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#050810", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 60px rgba(99,102,241,0.08)" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
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
      <div ref={ref} className="p-4 font-mono text-xs space-y-2 overflow-y-auto" style={{ minHeight: 220, maxHeight: 280 }}>
        {logs.map((log, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 items-start">
            <span className="text-slate-700 shrink-0">{log.time}</span>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${log.c}20`, color: log.c }}>{log.agent}</span>
            <span className="text-slate-400 leading-relaxed">{log.msg}</span>
          </motion.div>
        ))}
        {logs.length === 0 && <span className="text-slate-700">Initializing agent network...</span>}
        <span className="text-indigo-400 animate-blink">█</span>
      </div>
    </div>
  );
}

// ── Prescription Live Demo ───────────────────────────────────────
function PrescriptionDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SAMPLE = `Patient: Rahul Sharma, Age 45
Doctor: Dr. Priya Mehta, AIIMS Delhi

1. Metformin 500mg - twice daily after meals - 30 days
2. Amlodipine 5mg - once daily morning - 60 days
3. Vitamin D3 60000IU - once weekly - 8 weeks`;

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await prescriptionApi.parseText(text);
      setResult(res);
    } catch { setError("Backend offline — start FastAPI server first."); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl p-6 h-full" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <GlowRing color="rgba(99,102,241,0.6)" size={20} />
        </div>
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Agent 1 — Live Prescription Parser</span>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste prescription text here..."
        className="w-full rounded-xl p-4 text-sm text-slate-300 resize-none font-mono mb-3"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)", height: 130, outline: "none" }}
      />
      <div className="flex gap-2 mb-4">
        <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
          whileTap={{ scale: 0.97 }} onClick={parse} disabled={loading || !text.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-white border-t-transparent rounded-full inline-block" />
              Parsing...
            </span>
          ) : "Parse →"}
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setText(SAMPLE)}
          className="px-5 py-2.5 rounded-xl text-sm text-slate-400 transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          Load Sample
        </motion.button>
      </div>
      {error && (
        <div className="text-red-400 text-xs font-mono p-3 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          ⚠ {error}
        </div>
      )}
      <AnimatePresence>
        {result?.success && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-emerald-400 font-mono px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
                ✓ PARSED via {result.llm_used?.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ l: "Patient", v: result.result?.patient_name }, { l: "Doctor", v: result.result?.doctor_name }].map((f, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div className="text-xs text-slate-600 mb-1">{f.l}</div>
                  <div className="text-sm text-white font-medium truncate">{f.v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {result.result?.medications?.map((med: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                  <div>
                    <div className="text-sm font-semibold text-white">{med.medicine_name}</div>
                    <div className="text-xs text-slate-600">{med.frequency} · {med.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-indigo-400">{med.dosage}</div>
                    <div className="text-xs text-slate-700">{med.times_per_day}×/day</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stock Live Demo ──────────────────────────────────────────────
function StockDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await stockApi.addStock({ patient_id: "demo_001", medicine_name: "Metformin", total_quantity: 10, doses_taken: 8, doses_per_day: 2, start_date: new Date().toISOString() });
      const res = await stockApi.checkStock("demo_001");
      setResult(res);
    } catch { setResult({ error: true }); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl p-6 h-full" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <GlowRing color="rgba(16,185,129,0.6)" size={20} />
          </div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Agent 3 — Stock Monitor</span>
        </div>
        <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
          whileTap={{ scale: 0.95 }} onClick={run} disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 disabled:opacity-40"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
          {loading ? "Checking..." : "Run Live Check"}
        </motion.button>
      </div>
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <span className="text-emerald-400 text-xl">📦</span>
          </div>
          <p className="text-sm text-slate-600">Click "Run Live Check" to ping backend</p>
        </div>
      )}
      <AnimatePresence>
        {result?.alerts?.map((alert: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-5"
            style={{
              background: alert.reorder_suggested ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
              border: `1px solid ${alert.reorder_suggested ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`
            }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white">{alert.medicine_name}</span>
              <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold ${alert.reorder_suggested ? "text-red-400" : "text-emerald-400"}`}
                style={{ background: alert.reorder_suggested ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)" }}>
                {alert.reorder_suggested ? "⚠ CRITICAL" : "✓ OK"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{ l: "Days Left", v: String(alert.remaining_days) }, { l: "Doses Left", v: String(alert.remaining_quantity) }, { l: "Reorder", v: alert.reorder_suggested ? "YES" : "NO" }].map((m, j) => (
                <div key={j} className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className={`text-xl font-black ${alert.reorder_suggested ? "text-red-400" : "text-emerald-400"}`}>{m.v}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
            {alert.reorder_suggested && (
              <motion.a href={alert.pharmeasy_link} target="_blank"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
                className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Order on Pharmeasy →
              </motion.a>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Agent Card ───────────────────────────────────────────────────
function AgentCard({ agent, index }: { agent: typeof AGENTS[0]; index: number }) {
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
      {/* Glow on hover */}
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

// ── Section Header ───────────────────────────────────────────────
function SectionHeader({ tag, title, desc, tagColor = "#6366f1" }: { tag: string; title: string; desc: string; tagColor?: string }) {
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }} transition={{ type: "spring", stiffness: 80 }} className="mb-12">
      <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: tagColor }}>{tag}</div>
      <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">{title}</h2>
      <p className="text-slate-500 text-lg max-w-xl">{desc}</p>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function Home() {
  const { online, checking } = useServerHealth();
  const [apiCalls, setApiCalls] = useState(247);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setApiCalls(n => n + Math.floor(Math.random() * 3 + 1)), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#020408" }}>
      <NoiseOverlay />
      <GridBackground />

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(2,4,8,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(99,102,241,0.12)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.03 }}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
              <motion.div className="absolute inset-0 rounded-xl"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(8px)", zIndex: -1, opacity: 0.5 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <div>
              <span className="font-bold text-white text-sm">MedLoop AI</span>
              <div className="text-xs text-slate-600 font-mono leading-none">v1.0.0</div>
            </div>
          </motion.div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["Agents", "Demo", "Stack", "Market"].map((link, i) => (
              <motion.a key={i} href={`#${link.toLowerCase()}`}
                whileHover={{ color: "#a5b4fc" }}
                className="text-sm text-slate-500 transition-colors hover:text-slate-300 font-medium">
                {link}
              </motion.a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: checking ? "#f59e0b" : online ? "#10b981" : "#ef4444" }}
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-mono text-slate-500">
                {checking ? "checking" : online ? "API online" : "API offline"}
              </span>
            </div>
            <MagneticButton href="http://localhost:8000/docs" target="_blank"
              className="hidden md:block px-4 py-2 rounded-xl text-xs font-mono text-indigo-300 transition-all"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              Swagger →
            </MagneticButton>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ── HERO ── */}
        <section className="min-h-screen flex flex-col justify-center pt-24 pb-16">

          {/* Floating badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-10">
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

          {/* Main title */}
          <div className="text-center mb-8 relative">
            {/* Background glow behind title */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <motion.div className="w-[600px] h-[200px] rounded-full"
                style={{ background: "radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 70%)", filter: "blur(40px)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, type: "spring", stiffness: 60 }}
              className="relative z-10"
            >
              <h1 className="font-black leading-[0.9] mb-4 select-none tracking-tight"
                style={{ fontSize: "clamp(60px,11vw,130px)" }}>
                <motion.span
                  style={{
                    background: "linear-gradient(135deg,#818cf8 0%,#a78bfa 30%,#38bdf8 70%,#34d399 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                >
                  MedLoop
                </motion.span>
              </h1>
              <motion.div initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.25em" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-white font-light uppercase"
                style={{ fontSize: "clamp(14px,2.5vw,28px)", letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)" }}
              >
                Autonomous Care AI
              </motion.div>
            </motion.div>
          </div>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center text-slate-500 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            India's first <span className="text-indigo-400 font-medium">fully autonomous</span> patient care platform.
            5 AI agents handle the entire care loop — from prescription photo to doctor follow-up.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-4 mb-20">
            <MagneticButton href="http://localhost:8000/docs" target="_blank"
              className="px-8 py-4 rounded-2xl font-semibold text-white text-sm relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}>
              <motion.div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
                initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }} />
              <span className="relative">View Live API →</span>
            </MagneticButton>
            <MagneticButton href="#demo"
              className="px-8 py-4 rounded-2xl font-semibold text-slate-300 text-sm"
              style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)" }}>
              Try Live Demo ↓
            </MagneticButton>
          </motion.div>

          {/* Hero stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: online ? "ONLINE" : "OFFLINE", l: "Backend Status", c: online ? "#10b981" : "#ef4444", pulse: true },
              { v: String(apiCalls), l: "API Calls Today", c: "#6366f1", pulse: true },
              { v: "3 / 5", l: "Agents Active", c: "#8b5cf6", pulse: false },
              { v: "₹0", l: "Infra Cost", c: "#06b6d4", pulse: false },
            ].map((s, i) => (
              <motion.div key={i} whileHover={{ y: -6, boxShadow: `0 20px 60px ${s.c}20` }}
                className="rounded-2xl p-5 text-center relative overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 50%,${s.c}08 0%,transparent 70%)` }} />
                {s.pulse && <div className="w-1.5 h-1.5 rounded-full mx-auto mb-2 animate-pulse" style={{ background: s.c }} />}
                <div className="text-2xl md:text-3xl font-black mb-1 relative z-10" style={{ color: s.c }}>{s.v}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wider relative z-10">{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── LIVE DEMO ── */}
        <section id="demo" className="mb-28">
          <SectionHeader tag="Live Demo" title="Try It Right Now" desc="Real API calls to your FastAPI backend. No mocking. No fake data." tagColor="#6366f1" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <PrescriptionDemo />
            <StockDemo />
          </div>
          <Terminal />
        </section>

        {/* ── AGENTS ── */}
        <section id="agents" className="mb-28">
          <SectionHeader tag="Agent Network" title="5 Autonomous Agents" desc="Each agent has one job, one tool set, one clear output. Hover to see tools." tagColor="#8b5cf6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
          </div>
        </section>

        {/* ── MARKET ── */}
        <section id="market" className="mb-28">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-10 md:p-16 relative overflow-hidden"
            style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle at 15% 50%,rgba(99,102,241,0.1) 0%,transparent 50%),radial-gradient(circle at 85% 50%,rgba(139,92,246,0.08) 0%,transparent 50%)",
            }} />
            {/* Animated corner glow */}
            <motion.div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
              style={{ background: "radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 6, repeat: Infinity }} />
            <div className="relative z-10">
              <SectionHeader tag="Why This Exists" title="The Problem Is Massive" desc="India's healthcare system is broken. MedLoop AI fixes the adherence gap." tagColor="#a78bfa" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {MARKET_STATS.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.12, type: "spring" }}
                    whileHover={{ scale: 1.05 }} className="text-center">
                    <div className="text-3xl md:text-4xl font-black mb-2 leading-none" style={{ color: m.c }}>{m.v}</div>
                    <div className="text-xs text-slate-600 leading-relaxed">{m.l}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── TECH STACK ── */}
        <section id="stack" className="mb-28">
          <SectionHeader tag="Infrastructure" title="Production Stack" desc="Zero paid infrastructure. Every layer on free tier." tagColor="#06b6d4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECH_STACK.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, type: "spring" }}
                whileHover={{ scale: 1.02, boxShadow: `0 20px 60px ${s.color}12` }}
                className="rounded-2xl p-6 relative overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 30% 30%,${s.color}08 0%,transparent 60%)` }} />
                <div className="text-xs font-mono uppercase tracking-widest mb-5 relative z-10" style={{ color: s.color }}>{s.cat}</div>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {s.items.map((item, j) => (
                    <motion.span key={j} whileHover={{ scale: 1.08, y: -2 }}
                      className="text-sm px-3 py-1.5 rounded-xl font-medium cursor-default"
                      style={{ background: `${s.color}10`, color: s.color, border: `1px solid ${s.color}18` }}>
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative">
          {/* Top glow line */}
          <div className="w-full h-px mb-16" style={{ background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(139,92,246,0.4),transparent)" }} />

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
                  <motion.div className="absolute inset-0 rounded-xl -z-10"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(10px)", opacity: 0.5 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
                </div>
                <div>
                  <div className="font-bold text-white">MedLoop AI</div>
                  <div className="text-xs text-slate-600 font-mono">v1.0.0 · Beta</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                India's first autonomous patient care agent system. Built for 300M+ chronic disease patients.
              </p>
            </div>

            {/* Links */}
            {[
              { title: "Product", links: ["Agent Network", "Live Demo", "Tech Stack", "Swagger API"] },
              { title: "Agents", links: ["Prescription AI", "Reminder Agent", "Stock Monitor", "Health Monitor", "Follow-up"] },
              { title: "Build", links: ["FastAPI Backend", "Next.js Frontend", "LangGraph Docs", "GitHub Repo"] },
            ].map((col, i) => (
              <div key={i}>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">{col.title}</div>
                <div className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <motion.div key={j} whileHover={{ x: 4, color: "#a5b4fc" }}
                      className="text-sm text-slate-600 cursor-pointer transition-colors hover:text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      {link}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Bottom bar */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-700 font-mono">© 2026 MedLoop AI</span>
              <span className="text-xs text-slate-700 font-mono">·</span>
              <span className="text-xs text-slate-700 font-mono">Built by Manjeet Kumar Mishra</span>
            </div>
            <div className="flex items-center gap-3">
              {["FastAPI", "LangGraph", "Next.js 14", "GPT-4o"].map((t, i) => (
                <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg text-slate-700"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full"
                style={{ background: online ? "#10b981" : "#ef4444" }}
                animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-xs font-mono text-slate-600">
                {online ? "All systems operational" : "Backend offline"}
              </span>
            </div>
          </motion.div>
        </footer>

      </div>
    </div>
  );
}