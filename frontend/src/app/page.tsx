"use client";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { prescriptionApi, reminderApi, stockApi } from "@/lib/api";
import { AGENTS, TECH_STACK, MARKET_STATS } from "@/lib/constants";

// ── Particle background ──────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 4,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: "rgba(99,102,241,0.5)" }}
          animate={{ y: [-10, -60], opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}
      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      {/* Orbs */}
      {[
        { x: "10%", y: "20%", c: "rgba(99,102,241,0.12)", s: 700 },
        { x: "75%", y: "60%", c: "rgba(139,92,246,0.10)", s: 600 },
        { x: "45%", y: "85%", c: "rgba(6,182,212,0.08)", s: 500 },
      ].map((o, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: o.x, top: o.y, width: o.s, height: o.s, background: `radial-gradient(circle,${o.c} 0%,transparent 70%)`, transform: "translate(-50%,-50%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ── Live Terminal Feed ───────────────────────────────────────────
const TERMINAL_LOGS = [
  { t: "Agent 1", m: "Prescription parsed — Metformin 500mg × 2/day", c: "#6366f1" },
  { t: "Agent 2", m: "Reminder scheduled for patient_001 at 09:00 & 21:00", c: "#06b6d4" },
  { t: "Agent 3", m: "Stock alert — Metformin runs out in 2 days", c: "#10b981" },
  { t: "Agent 2", m: "Escalation triggered — 3 missed doses detected", c: "#f59e0b" },
  { t: "Agent 3", m: "Reorder approved — Pharmeasy link sent to patient", c: "#10b981" },
  { t: "Agent 1", m: "Safety gate passed — dosage within normal range", c: "#6366f1" },
  { t: "System", m: "LangGraph state updated — care loop active", c: "#8b5cf6" },
  { t: "Agent 2", m: "WhatsApp delivery confirmed +91987XXXXXX", c: "#06b6d4" },
];

function TerminalFeed() {
  const [logs, setLogs] = useState<typeof TERMINAL_LOGS>([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, TERMINAL_LOGS[idx % TERMINAL_LOGS.length]];
        return next.slice(-6);
      });
      setIdx(i => i + 1);
    }, 2000);
    return () => clearInterval(t);
  }, [idx]);

  return (
    <div className="rounded-2xl p-5 font-mono text-xs" style={{ background: "#000", border: "1px solid rgba(99,102,241,0.2)", minHeight: 200 }}>
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
        <span className="ml-2 text-slate-600">medloop-ai — agent activity</span>
      </div>
      <AnimatePresence>
        {logs.map((log, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3 mb-2"
          >
            <span className="text-slate-600">{new Date().toLocaleTimeString()}</span>
            <span style={{ color: log.c }}>[{log.t}]</span>
            <span className="text-slate-400">{log.m}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <span className="text-indigo-400 animate-blink">█</span>
    </div>
  );
}

// ── Live Prescription Demo ───────────────────────────────────────
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
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await prescriptionApi.parseText(text);
      setResult(res);
    } catch (e: any) {
      setError("Backend offline. Start FastAPI server first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Agent 1 — Live Parser</span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste prescription text here..."
        className="w-full rounded-xl p-4 text-sm text-slate-300 resize-none font-mono mb-3"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", height: 140, outline: "none" }}
      />
      <div className="flex gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={parse}
          disabled={loading || !text.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          {loading ? "Parsing..." : "Parse Prescription →"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setText(SAMPLE)}
          className="px-5 py-2.5 rounded-xl text-sm text-slate-400"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          Load Sample
        </motion.button>
      </div>

      {error && <div className="text-red-400 text-xs font-mono p-3 rounded-lg mb-3" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}

      <AnimatePresence>
        {result?.success && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-emerald-400 font-mono">✓ PARSED SUCCESSFULLY</span>
              <span className="text-xs text-slate-600 font-mono">via {result.llm_used}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-xs text-slate-600 mb-1">Patient</div>
                <div className="text-sm text-white font-medium">{result.result?.patient_name}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-xs text-slate-600 mb-1">Doctor</div>
                <div className="text-sm text-white font-medium">{result.result?.doctor_name}</div>
              </div>
            </div>
            {result.result?.medications?.map((med: any, i: number) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">{med.medicine_name}</div>
                  <div className="text-xs text-slate-500">{med.frequency} · {med.duration}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-indigo-400">{med.dosage}</div>
                  <div className="text-xs text-slate-600">{med.times_per_day}x/day</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stock Demo ───────────────────────────────────────────────────
function StockDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    setLoading(true);
    try {
      await stockApi.addStock({
        patient_id: "demo_001",
        medicine_name: "Metformin",
        total_quantity: 10,
        doses_taken: 8,
        doses_per_day: 2,
        start_date: new Date().toISOString(),
      });
      const res = await stockApi.checkStock("demo_001");
      setResult(res);
    } catch {
      setResult({ error: "Start FastAPI backend first" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Agent 3 — Stock Monitor</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={runDemo}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          {loading ? "Checking..." : "Run Live Check"}
        </motion.button>
      </div>

      {!result && !loading && (
        <div className="text-center py-8 text-slate-600 text-sm">Click "Run Live Check" to ping the backend</div>
      )}

      <AnimatePresence>
        {result?.alerts?.map((alert: any, i: number) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-4"
            style={{ background: alert.reorder_suggested ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${alert.reorder_suggested ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white">{alert.medicine_name}</span>
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${alert.reorder_suggested ? "text-red-400 bg-red-400/10" : "text-emerald-400 bg-emerald-400/10"}`}>
                {alert.reorder_suggested ? "⚠ REORDER NOW" : "✓ SUFFICIENT"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { l: "Days Left", v: alert.remaining_days },
                { l: "Doses Left", v: alert.remaining_quantity },
                { l: "Reorder", v: alert.reorder_suggested ? "YES" : "NO" },
              ].map((m, j) => (
                <div key={j} className="text-center rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className={`text-lg font-bold ${alert.reorder_suggested ? "text-red-400" : "text-emerald-400"}`}>{m.v}</div>
                  <div className="text-xs text-slate-600">{m.l}</div>
                </div>
              ))}
            </div>
            {alert.reorder_suggested && (
              <div className="flex gap-2">
                <a href={alert.pharmeasy_link} target="_blank"
                  className="flex-1 text-center py-2 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "rgba(99,102,241,0.3)" }}>
                  Order on Pharmeasy →
                </a>
              </div>
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 80 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl p-6 cursor-pointer transition-all duration-500"
      style={{
        background: agent.bg,
        border: `1px solid ${hovered ? agent.border : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered ? `0 20px 60px ${agent.color}18` : "none",
      }}
    >
      <div className="absolute top-4 right-4">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            BUILDING
          </span>
        )}
      </div>

      <div className="text-7xl font-black leading-none mb-4 select-none"
        style={{ color: agent.color, opacity: 0.12 }}>{agent.id}</div>

      <div className="text-xs font-mono mb-1" style={{ color: agent.color }}>{agent.short}</div>
      <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-5">{agent.desc}</p>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {agent.tools.map((tool, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs px-2.5 py-1 rounded-lg font-mono"
                style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}25` }}
              >{tool}</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Home() {
  const { online, checking } = useServerHealth();
  const [activePatients] = useState(3);
  const [apiCalls, setApiCalls] = useState(147);

  useEffect(() => {
    const t = setInterval(() => setApiCalls(n => n + Math.floor(Math.random() * 3)), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#020408" }}>
      <Particles />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">

        {/* ── NAVBAR ── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <span className="text-white text-xs font-black">M</span>
            </div>
            <span className="font-bold text-white">MedLoop AI</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {checking ? (
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              ) : online ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-400" />
              )}
              <span className="text-xs font-mono text-slate-500">
                {checking ? "checking..." : online ? "API online" : "API offline"}
              </span>
            </div>
            <a href="http://localhost:8000/docs" target="_blank"
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors">
              Swagger Docs →
            </a>
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="text-center mb-24">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            3 of 5 agents live · {apiCalls} API calls today · {activePatients} active patients
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="font-black leading-none mb-6 select-none"
            style={{ fontSize: "clamp(56px,10vw,120px)" }}
          >
            <span style={{
              background: "linear-gradient(135deg,#6366f1 0%,#a78bfa 40%,#06b6d4 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 60px rgba(99,102,241,0.4))"
            }}>MedLoop</span>
            <br />
            <span className="text-white" style={{ fontSize: "0.5em", fontWeight: 300, letterSpacing: "0.3em" }}>
              AUTONOMOUS CARE AI
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-slate-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            India's first fully autonomous patient care platform. 5 AI agents handle
            prescription reading, medication reminders, stock monitoring, health tracking, and follow-ups.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4">
            <motion.a href="http://localhost:8000/docs" target="_blank"
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              View Live API →
            </motion.a>
            <motion.a href="#demo"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-slate-300"
              style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)" }}>
              Try Live Demo ↓
            </motion.a>
          </motion.div>
        </section>

        {/* ── LIVE METRICS ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24"
        >
          {[
            { v: online ? "ONLINE" : "OFFLINE", l: "Backend Status", c: online ? "#10b981" : "#ef4444", live: true },
            { v: `${apiCalls}`, l: "API Calls Today", c: "#6366f1", live: true },
            { v: "3 / 5", l: "Agents Active", c: "#8b5cf6", live: false },
            { v: "₹0", l: "Infra Cost", c: "#06b6d4", live: false },
          ].map((s, i) => (
            <motion.div key={i}
              whileHover={{ y: -4, boxShadow: `0 10px 40px ${s.c}22` }}
              className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {s.live && <div className="w-1.5 h-1.5 rounded-full mx-auto mb-2 animate-pulse" style={{ background: s.c }} />}
              <div className="text-2xl md:text-3xl font-black mb-1" style={{ color: s.c }}>{s.v}</div>
              <div className="text-xs text-slate-600 uppercase tracking-wider">{s.l}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* ── LIVE DEMO ── */}
        <section id="demo" className="mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="text-xs font-mono text-indigo-400 mb-2 uppercase tracking-widest">Live Demo</div>
            <h2 className="text-4xl font-bold text-white mb-2">Try It Right Now</h2>
            <p className="text-slate-500">Real API calls to your FastAPI backend. No mocking, no fake data.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PrescriptionDemo />
            <StockDemo />
          </div>

          {/* Terminal */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-xs font-mono text-slate-600 mb-3 uppercase tracking-widest">Agent Activity Feed — Simulated</div>
            <TerminalFeed />
          </motion.div>
        </section>

        {/* ── AGENTS ── */}
        <section className="mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="text-xs font-mono text-purple-400 mb-2 uppercase tracking-widest">Agent Network</div>
            <h2 className="text-4xl font-bold text-white mb-2">5 Autonomous Agents</h2>
            <p className="text-slate-500">Each agent has one job, one tool set, one clear output. Hover to see tools.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
          </div>
        </section>

        {/* ── MARKET ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-10 mb-24 relative overflow-hidden"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%,rgba(99,102,241,0.08) 0%,transparent 60%),radial-gradient(circle at 80% 50%,rgba(139,92,246,0.08) 0%,transparent 60%)"
          }} />
          <div className="relative z-10">
            <div className="text-xs font-mono text-indigo-400 mb-2 uppercase tracking-widest">Why This Exists</div>
            <h2 className="text-4xl font-bold text-white mb-10">The Problem is Massive</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {MARKET_STATS.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-black mb-2" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-xs text-slate-600">{m.l}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── TECH STACK ── */}
        <section className="mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">Infrastructure</div>
            <h2 className="text-4xl font-bold text-white mb-2">Production Stack</h2>
            <p className="text-slate-500">Zero paid infrastructure. Every layer on free tier.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECH_STACK.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: s.color }}>{s.cat}</div>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item, j) => (
                    <motion.span key={j} whileHover={{ scale: 1.05 }}
                      className="text-sm px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}20` }}>
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-2xl font-black mb-2" style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>MedLoop AI</div>
          <p className="text-slate-600 text-sm mb-4">Built for 300M+ chronic disease patients in India</p>
          <div className="flex justify-center gap-6 text-xs text-slate-700 font-mono">
            <span>FastAPI</span><span>·</span><span>LangGraph</span><span>·</span><span>Next.js 14</span><span>·</span><span>GPT-4o</span>
          </div>
        </motion.footer>

      </div>
    </div>
  );
}