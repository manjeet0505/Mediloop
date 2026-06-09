"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { authService } from "@/lib/auth";

const LIVE_LOGS = [
  { agent: "A1", msg: "Prescription parsed — Metformin 500mg detected", c: "#6366f1" },
  { agent: "A2", msg: "Reminder scheduled — patient_042 @ 09:00 IST", c: "#06b6d4" },
  { agent: "A3", msg: "Stock alert — Amlodipine depletes in 3 days", c: "#10b981" },
  { agent: "SYS", msg: "LangGraph loop complete — care plan activated", c: "#8b5cf6" },
  { agent: "A2", msg: "Dose confirmed — adherence score: 94%", c: "#06b6d4" },
  { agent: "A3", msg: "Reorder approved — Pharmeasy link dispatched", c: "#10b981" },
  { agent: "A1", msg: "Safety gate passed — dosage within WHO limits", c: "#6366f1" },
  { agent: "SYS", msg: "WhatsApp delivery confirmed +91 98XX XXXXX", c: "#8b5cf6" },
];

const STATS = [
  { v: "300M+", l: "Patients Served", c: "#6366f1" },
  { v: "94%", l: "Adherence Rate", c: "#10b981" },
  { v: "5", l: "AI Agents", c: "#8b5cf6" },
  { v: "₹0", l: "Infra Cost", c: "#06b6d4" },
];

function LivePanel() {
  const [logs, setLogs] = useState<(typeof LIVE_LOGS[0] & { time: string })[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLogs(prev => [...prev.slice(-5), {
        ...LIVE_LOGS[idx % LIVE_LOGS.length],
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      }]);
      setIdx(i => i + 1);
    }, 2000);
    return () => clearInterval(t);
  }, [idx]);

  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <motion.div className="absolute rounded-full"
          style={{ width: 600, height: 600, top: "20%", left: "30%", background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", transform: "translate(-50%,-50%)", filter: "blur(40px)" }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div className="absolute rounded-full"
          style={{ width: 400, height: 400, bottom: "10%", right: "10%", background: "radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)", filter: "blur(30px)" }}
          animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 10, repeat: Infinity }}
        />
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 40% 50%,black 30%,transparent 100%)"
        }} />
      </div>

      {/* Top — Logo + tagline */}
      <div className="relative z-10">
        <motion.a href="/" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
            <motion.div className="absolute inset-0 rounded-xl -z-10"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(10px)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />
          </div>
          <div>
            <div className="font-black text-white">MedLoop AI</div>
            <div className="text-xs text-slate-600 font-mono">Autonomous Care Platform</div>
          </div>
        </motion.a>

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white leading-tight mb-4">
          India's First<br />
          <span style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Autonomous Care AI</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-slate-500 text-sm leading-relaxed max-w-sm">
          5 AI agents handle prescription reading, medication reminders, stock monitoring,
          health tracking and follow-ups — fully automated.
        </motion.p>
      </div>

      {/* Middle — Live terminal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }} className="relative z-10">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(99,102,241,0.2)" }}>
          {/* Terminal bar */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
              </div>
              <span className="text-xs font-mono text-slate-600 ml-1">agent-network · live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-500">LIVE</span>
            </div>
          </div>
          {/* Logs */}
          <div className="p-4 font-mono text-xs space-y-2" style={{ minHeight: 160 }}>
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 items-start">
                  <span className="text-slate-700 shrink-0">{log.time}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold"
                    style={{ background: `${log.c}20`, color: log.c }}>{log.agent}</span>
                  <span className="text-slate-400">{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <span className="text-indigo-400 animate-blink">█</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom — Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }} className="relative z-10">
        <div className="grid grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -3 }}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-lg font-black" style={{ color: s.c }}>{s.v}</div>
              <div className="text-xs text-slate-700 mt-0.5">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (authService.isLoggedIn()) router.push("/dashboard");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(form);
      authService.setSession(res.access_token, res.user);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#020408" }}>

      {/* Left — Live product panel */}
      <div className="flex-1" style={{ borderRight: "1px solid rgba(99,102,241,0.1)" }}>
        <LivePanel />
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center px-8 py-12 relative">

        {/* Subtle right side glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 50%,rgba(99,102,241,0.06) 0%,transparent 60%)" }} />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg mx-auto mb-3"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
            <h1 className="font-black text-white text-2xl">MedLoop AI</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to your clinic dashboard</p>
          </div>

          {/* Form card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Email
                </label>
                <motion.div
                  animate={{ boxShadow: focused === "email" ? "0 0 0 2px rgba(99,102,241,0.5)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                  className="rounded-xl overflow-hidden">
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder="clinic@example.com"
                    className="w-full px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: "rgba(0,0,0,0.5)" }} required
                  />
                </motion.div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Password
                </label>
                <motion.div
                  animate={{ boxShadow: focused === "pass" ? "0 0 0 2px rgba(99,102,241,0.5)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                  className="rounded-xl overflow-hidden flex">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="flex-1 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: "rgba(0,0,0,0.5)" }} required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="px-4 text-slate-600 hover:text-slate-400 text-xs transition-colors"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </motion.div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl px-4 py-3 text-xs font-mono text-red-400"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm relative overflow-hidden disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                      Signing in...
                    </>
                  ) : "Sign In →"}
                </span>
              </motion.button>
            </form>
          </motion.div>

          <div className="text-center">
            <span className="text-sm text-slate-600">Don't have an account? </span>
            <motion.a href="/signup" whileHover={{ color: "#a5b4fc" }}
              className="text-sm text-indigo-400 font-semibold">
              Create clinic account →
            </motion.a>
          </div>

          <p className="text-center text-xs text-slate-800 font-mono mt-6">
            JWT + AES-256 · HIPAA-lite Security
          </p>
        </div>
      </div>
    </div>
  );
}