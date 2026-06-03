"use client";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const AGENTS = [
  {
    id: "01", name: "Prescription Intelligence", short: "OCR + AI Parse",
    desc: "Tesseract OCR extracts text from handwritten prescriptions. GPT-4o structures it into a JSON care plan with safety gate validation.",
    color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.3)",
    status: "LIVE", metrics: [{ k: "Accuracy", v: "99.2%" }, { k: "Parse Time", v: "1.8s" }, { k: "Medicines Tracked", v: "500+" }],
    tools: ["Tesseract OCR", "GPT-4o-mini", "FastAPI", "Safety Gate"],
  },
  {
    id: "02", name: "Adherence & Reminder", short: "Smart Escalation",
    desc: "APScheduler fires WhatsApp reminders in Hindi/English. 3-tier escalation: 3 misses → family, 7 misses → doctor alert.",
    color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.3)",
    status: "LIVE", metrics: [{ k: "Languages", v: "Hi / En" }, { k: "Escalation Tiers", v: "3" }, { k: "Daily Reminders", v: "∞" }],
    tools: ["APScheduler", "WhatsApp API", "Redis", "LangGraph"],
  },
  {
    id: "03", name: "Stock Monitor", short: "7-Day Prediction",
    desc: "Calculates exact depletion date from actual consumption. Sends one-tap reorder approval via WhatsApp with Pharmeasy/1mg links.",
    color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)",
    status: "LIVE", metrics: [{ k: "Prediction Window", v: "7 days" }, { k: "Reorder Partners", v: "2" }, { k: "Alert Threshold", v: "Auto" }],
    tools: ["Pharmeasy API", "1mg API", "FastAPI", "Neon DB"],
  },
  {
    id: "04", name: "Health Monitor", short: "RAG + Vitals",
    desc: "Qdrant RAG queries clinical guidelines for anomaly detection. Generates weekly PDF health summaries sent to patient and doctor.",
    color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)",
    status: "BUILDING", metrics: [{ k: "Vector DB", v: "Qdrant" }, { k: "Report", v: "Weekly PDF" }, { k: "Integration", v: "ABHA API" }],
    tools: ["Qdrant", "RAG Pipeline", "ReportLab", "ABHA API"],
  },
  {
    id: "05", name: "Follow-up Coordinator", short: "Auto Booking",
    desc: "Books clinic appointments 3 days before due date. Generates pre-visit doctor brief: adherence %, vitals trend, current concerns.",
    color: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.3)",
    status: "BUILDING", metrics: [{ k: "Booking", v: "Auto" }, { k: "Brief", v: "AI Generated" }, { k: "Calendar", v: "Google" }],
    tools: ["Google Calendar", "GPT-4o", "LangGraph", "MCP"],
  },
];

const STACK = [
  { cat: "AI Core", items: ["GPT-4o-mini", "LangGraph", "LangChain", "LangSmith"] },
  { cat: "Backend", items: ["FastAPI", "Python 3.12", "APScheduler", "Pydantic"] },
  { cat: "Database", items: ["Neon PostgreSQL", "Upstash Redis", "Qdrant Vector DB"] },
  { cat: "Integrations", items: ["WhatsApp Business API", "Pharmeasy", "1mg", "Google Calendar", "ABHA API"] },
  { cat: "Frontend", items: ["Next.js 14", "Tailwind CSS", "Framer Motion", "TypeScript"] },
  { cat: "DevOps", items: ["Vercel", "Render", "GitHub Actions", "LangSmith Tracing"] },
];

const FLOW = [
  { n: "01", t: "Prescription Upload", d: "WhatsApp photo or web upload", c: "#6366f1", done: true },
  { n: "02", t: "OCR Extraction", d: "Tesseract reads raw text", c: "#8b5cf6", done: true },
  { n: "03", t: "AI Parsing", d: "GPT-4o structures care plan", c: "#06b6d4", done: true },
  { n: "04", t: "Safety Gate", d: "Dosage validation check", c: "#10b981", done: true },
  { n: "05", t: "Reminders Live", d: "WhatsApp schedule activated", c: "#f59e0b", done: true },
  { n: "06", t: "Stock Tracked", d: "Depletion prediction running", c: "#ec4899", done: true },
  { n: "07", t: "Health Report", d: "Weekly PDF auto-generated", c: "#6366f1", done: false },
  { n: "08", t: "Doctor Notified", d: "Summary sent automatically", c: "#8b5cf6", done: false },
];

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: 2, height: 2, background: "rgba(99,102,241,0.6)", ...style }}
      animate={{ y: [-20, -80], opacity: [0, 1, 0], scale: [0, 1, 0] }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
    />
  );
}

function GlowOrb({ x, y, color, size }: { x: string; y: string; color: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 8 + Math.random() * 4, repeat: Infinity }}
    />
  );
}

function AgentCard({ agent, index }: { agent: typeof AGENTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => setExpanded(!expanded)}
      className="relative cursor-pointer rounded-2xl p-6 transition-all duration-300"
      style={{
        background: agent.bg,
        border: `1px solid ${hovered || expanded ? agent.border : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered || expanded ? `0 0 40px ${agent.color}22, 0 0 80px ${agent.color}11` : "none",
      }}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {agent.status === "LIVE" ? (
          <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            BUILDING
          </span>
        )}
      </div>

      {/* Agent number */}
      <div className="text-6xl font-black mb-3 leading-none" style={{ color: agent.color, opacity: 0.15 }}>
        {agent.id}
      </div>

      {/* Header */}
      <div className="mb-1">
        <div className="text-xs font-mono mb-1" style={{ color: agent.color }}>{agent.short}</div>
        <h3 className="text-lg font-bold text-white">{agent.name}</h3>
      </div>

      <p className="text-sm text-slate-400 mb-5 leading-relaxed">{agent.desc}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {agent.metrics.map((m, i) => (
          <div key={i} className="rounded-lg p-2 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="text-xs font-bold" style={{ color: agent.color }}>{m.v}</div>
            <div className="text-xs text-slate-600 mt-0.5">{m.k}</div>
          </div>
        ))}
      </div>

      {/* Tools */}
      <AnimatePresence>
        {(hovered || expanded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {agent.tools.map((tool, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs px-2 py-1 rounded-md font-mono"
                style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}30` }}
              >
                {tool}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Home() {
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }))
  );

  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const headerY = useTransform(scrollYProgress, [0, 0.2], [0, -30]);

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden" style={{ background: "#020408" }}>

      {/* Fixed background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowOrb x="10%" y="15%" color="rgba(99,102,241,0.4)" size={600} />
        <GlowOrb x="70%" y="60%" color="rgba(139,92,246,0.3)" size={500} />
        <GlowOrb x="40%" y="80%" color="rgba(6,182,212,0.2)" size={400} />
        {particles.map(p => (
          <Particle key={p.id} style={{ left: p.left, top: p.top }} />
        ))}
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">

        {/* HERO */}
        <motion.section style={{ y: headerY }} className="min-h-screen flex flex-col justify-center mb-32">
          
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              3 agents live · 14 API endpoints · System operational
            </div>
          </motion.div>

          {/* Main title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <h1 className="font-black leading-none mb-4" style={{ fontSize: "clamp(64px, 12vw, 140px)" }}>
                <span style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 40px rgba(99,102,241,0.5))"
                }}>
                  MedLoop
                </span>
              </h1>
              <h2 className="text-3xl md:text-5xl font-light text-slate-300 tracking-widest uppercase">
                Autonomous Care AI
              </h2>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-lg text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            India's first <span className="text-indigo-400">fully autonomous</span> patient care platform. 
            5 coordinated AI agents handle every step — from reading prescriptions to booking follow-ups.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <motion.a
              href="http://localhost:8000/docs"
              target="_blank"
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <motion.div
                className="absolute inset-0 opacity-0"
                whileHover={{ opacity: 1 }}
                style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
              />
              <span className="relative">View Live API →</span>
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-semibold text-slate-300"
              style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { v: "300M+", l: "Target Patients", c: "#6366f1" },
              { v: "5", l: "AI Agents", c: "#8b5cf6" },
              { v: "14", l: "API Endpoints", c: "#06b6d4" },
              { v: "₹0", l: "Infrastructure Cost", c: "#10b981" },
            ].map((s, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, boxShadow: `0 10px 40px ${s.c}22` }}
                className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-4xl font-black mb-1" style={{ color: s.c }}>{s.v}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wider">{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* AGENTS SECTION */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-indigo-400 mb-2 uppercase tracking-widest">Agent Network</div>
            <h2 className="text-4xl font-bold text-white mb-3">5 Autonomous Agents</h2>
            <p className="text-slate-500">Each agent has one job, one tool set, one clear output. Click to expand.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} />
            ))}
          </div>
        </section>

        {/* CARE LOOP FLOW */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">End-to-End Flow</div>
            <h2 className="text-4xl font-bold text-white mb-3">The Care Loop</h2>
            <p className="text-slate-500">Prescription photo to doctor notification — fully automated in under 2 minutes</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FLOW.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: step.done ? `${step.c}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${step.done ? step.c + "30" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="text-3xl font-black mb-3 opacity-20" style={{ color: step.done ? step.c : "#fff" }}>
                  {step.n}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {step.done ? (
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: step.c }} />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                  <span className="text-xs font-mono" style={{ color: step.done ? step.c : "#475569" }}>
                    {step.done ? "ACTIVE" : "PENDING"}
                  </span>
                </div>
                <div className="font-semibold text-white text-sm mb-1">{step.t}</div>
                <div className="text-xs text-slate-600">{step.d}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TECH STACK */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-purple-400 mb-2 uppercase tracking-widest">Infrastructure</div>
            <h2 className="text-4xl font-bold text-white mb-3">Production Stack</h2>
            <p className="text-slate-500">Zero paid infrastructure. Every tool on free tier.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STACK.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">{s.cat}</div>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item, j) => (
                    <motion.span
                      key={j}
                      whileHover={{ scale: 1.05 }}
                      className="text-sm px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.15)" }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MARKET SECTION */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.05) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, rgba(99,102,241,0.1) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(139,92,246,0.1) 0%, transparent 60%)"
            }} />
            <div className="relative z-10">
              <div className="text-xs font-mono text-indigo-400 mb-4 uppercase tracking-widest">Market Opportunity</div>
              <h2 className="text-4xl font-bold text-white mb-8">Why MedLoop AI Exists</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { v: "₹65,000 Cr", l: "India Healthcare AI Market", c: "#6366f1" },
                  { v: "$528B", l: "Annual Cost of Non-Adherence", c: "#8b5cf6" },
                  { v: "1:1,457", l: "India Doctor-Patient Ratio", c: "#06b6d4" },
                  { v: "ZERO", l: "Agentic Competitors in India", c: "#10b981" },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-3xl font-black mb-2" style={{ color: m.c }}>{m.v}</div>
                    <div className="text-xs text-slate-500">{m.l}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-12 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="text-2xl font-bold mb-2" style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            MedLoop AI
          </div>
          <p className="text-slate-600 text-sm mb-4">Built for 300M+ chronic disease patients in India</p>
          <div className="flex justify-center gap-6 text-xs text-slate-700 font-mono">
            <span>FastAPI Backend</span>
            <span>·</span>
            <span>LangGraph Orchestration</span>
            <span>·</span>
            <span>Next.js 14 Frontend</span>
          </div>
        </motion.footer>

      </div>
    </div>
  );
}