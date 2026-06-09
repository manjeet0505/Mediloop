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
      <div className="absolute inset-0">
        <motion.div className="absolute rounded-full"
          style={{ width: 600, height: 600, top: "20%", left: "30%", background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", transform: "translate(-50%,-50%)", filter: "blur(40px)" }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 40% 50%,black 30%,transparent 100%)"
        }} />
      </div>

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
          Join India's First<br />
          <span style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Autonomous Care AI</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-slate-500 text-sm leading-relaxed max-w-sm">
          Set up your clinic in under 2 minutes. Your first 3 patients are free — no credit card required.
        </motion.p>
      </div>

      <div className="relative z-10">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-500">LIVE</span>
            </div>
          </div>
          <div className="p-4 font-mono text-xs space-y-2" style={{ minHeight: 140 }}>
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 items-start">
                  <span className="text-slate-700 shrink-0">{log.time}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold shrink-0"
                    style={{ background: `${log.c}20`, color: log.c }}>{log.agent}</span>
                  <span className="text-slate-400">{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <span className="text-indigo-400 animate-blink">█</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <motion.div key={i} whileHover={{ y: -3 }}
            className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-lg font-black" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs text-slate-700 mt-0.5">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const STEPS = ["Account", "Clinic", "Security"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    clinic_name: "", role: "clinic",
    password: "", confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (authService.isLoggedIn()) router.push("/dashboard");
  }, []);

  const validate = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return setError("Full name required") as unknown as boolean;
      if (!form.email.includes("@")) return setError("Valid email required") as unknown as boolean;
      if (!form.phone.startsWith("+91") || form.phone.length !== 13) return setError("Format: +91XXXXXXXXXX") as unknown as boolean;
    }
    if (step === 1 && !form.clinic_name.trim()) return setError("Clinic name required") as unknown as boolean;
    if (step === 2) {
      if (form.password.length < 8) return setError("Min 8 characters") as unknown as boolean;
      if (!/[A-Z]/.test(form.password)) return setError("Needs uppercase letter") as unknown as boolean;
      if (!/[0-9]/.test(form.password)) return setError("Needs a number") as unknown as boolean;
      if (!/[!@#$%^&*]/.test(form.password)) return setError("Needs special character (!@#$%^&*)") as unknown as boolean;
      if (form.password !== form.confirm_password) return setError("Passwords don't match") as unknown as boolean;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (validate() === true) setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() !== true) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.signup({
        email: form.email, password: form.password,
        full_name: form.full_name, role: form.role,
        clinic_name: form.clinic_name, phone: form.phone,
      });
      authService.setSession(res.access_token, res.user);
      router.push("/dashboard");
    } catch {
      setError("Signup failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#020408" }}>

      {/* Left panel */}
      <div className="flex-1" style={{ borderRight: "1px solid rgba(99,102,241,0.1)" }}>
        <LivePanel />
      </div>

      {/* Right — Signup form */}
      <div className="w-full lg:w-[500px] flex items-center justify-center px-8 py-12 relative overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 50%,rgba(99,102,241,0.05) 0%,transparent 60%)" }} />

        <div className="w-full max-w-sm relative z-10">

          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-2">Create Account</h2>
            <p className="text-slate-500 text-sm">Join India's first autonomous care platform</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    background: i < step ? "linear-gradient(135deg,#10b981,#059669)" : i === step ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
                    scale: i === step ? 1.1 : 1,
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {i < step ? "✓" : i + 1}
                </motion.div>
                <span className={`text-xs font-mono ${i === step ? "text-indigo-400" : "text-slate-700"}`}>{s}</span>
                {i < STEPS.length - 1 && (
                  <motion.div className="w-6 h-px mx-1"
                    animate={{ background: i < step ? "#10b981" : "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <motion.div className="rounded-2xl p-6 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">

                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">Your Details</div>
                    {[
                      { k: "full_name", l: "Full Name", t: "text", p: "Dr. Anjali Sharma" },
                      { k: "email", l: "Email", t: "email", p: "doctor@clinic.com" },
                      { k: "phone", l: "Phone", t: "tel", p: "+91XXXXXXXXXX" },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">{f.l}</label>
                        <motion.div animate={{ boxShadow: focused === f.k ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                          className="rounded-xl overflow-hidden">
                          <input type={f.t} value={(form as any)[f.k]}
                            onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                            onFocus={() => setFocused(f.k)} onBlur={() => setFocused(null)}
                            placeholder={f.p}
                            className="w-full px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                            style={{ background: "rgba(0,0,0,0.5)" }}
                          />
                        </motion.div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">Clinic Details</div>
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">Clinic Name</label>
                      <motion.div animate={{ boxShadow: focused === "clinic" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                        className="rounded-xl overflow-hidden">
                        <input type="text" value={form.clinic_name}
                          onChange={e => setForm({ ...form, clinic_name: e.target.value })}
                          onFocus={() => setFocused("clinic")} onBlur={() => setFocused(null)}
                          placeholder="Apollo Clinic, Gurugram"
                          className="w-full px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                          style={{ background: "rgba(0,0,0,0.5)" }}
                        />
                      </motion.div>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">Account Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { v: "clinic", l: "Clinic", d: "Full platform access" },
                          { v: "doctor", l: "Doctor", d: "Patient summaries" },
                        ].map(opt => (
                          <motion.div key={opt.v} whileHover={{ scale: 1.02 }}
                            onClick={() => setForm({ ...form, role: opt.v })}
                            className="rounded-xl p-3 cursor-pointer"
                            style={{
                              background: form.role === opt.v ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.3)",
                              border: `1px solid ${form.role === opt.v ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                            }}>
                            <div className="font-semibold text-white text-sm">{opt.l}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{opt.d}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">Set Password</div>
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">Password</label>
                      <motion.div animate={{ boxShadow: focused === "pass" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                        className="rounded-xl overflow-hidden flex">
                        <input type={showPass ? "text" : "password"} value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                          placeholder="Min 8 chars, A-Z, 0-9, symbol"
                          className="flex-1 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                          style={{ background: "rgba(0,0,0,0.5)" }}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="px-3 text-slate-600 hover:text-slate-400 text-xs"
                          style={{ background: "rgba(0,0,0,0.5)" }}>
                          {showPass ? "HIDE" : "SHOW"}
                        </button>
                      </motion.div>
                      {form.password && (
                        <div className="flex gap-1 mt-2">
                          {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[!@#$%^&*]/.test(form.password)].map((m, i) => (
                            <motion.div key={i} className="h-1 flex-1 rounded-full"
                              animate={{ background: m ? "#10b981" : "rgba(255,255,255,0.08)" }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                      <motion.div animate={{ boxShadow: focused === "confirm" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                        className="rounded-xl overflow-hidden">
                        <input type="password" value={form.confirm_password}
                          onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                          onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                          placeholder="Re-enter password"
                          className="w-full px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                          style={{ background: "rgba(0,0,0,0.5)" }}
                        />
                      </motion.div>
                      {form.confirm_password && (
                        <div className={`text-xs font-mono mt-1.5 ${form.password === form.confirm_password ? "text-emerald-400" : "text-red-400"}`}>
                          {form.password === form.confirm_password ? "✓ Passwords match" : "✗ Passwords don't match"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl px-4 py-3 text-xs font-mono text-red-400 mt-4"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-5">
                {step > 0 && (
                  <motion.button type="button" onClick={() => { setError(""); setStep(s => s - 1); }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-400 text-sm"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    ← Back
                  </motion.button>
                )}
                {step < 2 ? (
                  <motion.button type="button" onClick={handleNext}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(99,102,241,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    Continue →
                  </motion.button>
                ) : (
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    <span className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <motion.span animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                          Creating...
                        </>
                      ) : "Create Account →"}
                    </span>
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>

          <div className="text-center">
            <span className="text-sm text-slate-600">Already have an account? </span>
            <motion.a href="/login" whileHover={{ color: "#a5b4fc" }}
              className="text-sm text-indigo-400 font-semibold">Sign in →</motion.a>
          </div>
          <p className="text-center text-xs text-slate-800 font-mono mt-4">
            JWT + AES-256 · HIPAA-lite Security
          </p>
        </div>
      </div>
    </div>
  );
}