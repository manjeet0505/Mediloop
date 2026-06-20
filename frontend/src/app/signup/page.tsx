"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function LivePanel({ role }: { role: "clinic" | "patient" }) {
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
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: 48, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <motion.div style={{
          position: "absolute", width: 600, height: 600, top: "20%", left: "30%",
          background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)",
          transform: "translate(-50%,-50%)", filter: "blur(40px)"
        }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 40% 50%,black 30%,transparent 100%)"
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        <motion.a href="/" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 32, textDecoration: "none" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "var(--text-inverse)"
          }}>M</div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>MedLoop AI</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>Autonomous Care Platform</div>
          </div>
        </motion.a>

        <motion.h2 key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>
          {role === "patient" ? <>Take Control<br />Of Your <span style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Medication</span></> : <>Run Your Clinic<br />With <span style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Autonomous AI</span></>}
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>
          {role === "patient"
            ? "Get WhatsApp reminders, track your adherence streak, and never run out of medicine again — all free."
            : "5 AI agents handle prescription reading, reminders, stock monitoring and follow-ups for every patient."}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ position: "relative", zIndex: 10 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-default)" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", background: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", opacity: 0.7 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", opacity: 0.7 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", opacity: 0.7 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
              <span style={{ fontSize: 10, color: "var(--success)", fontFamily: "monospace" }}>LIVE</span>
            </div>
          </div>
          <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 140 }}>
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>{log.time}</span>
                  <span style={{ padding: "1px 6px", borderRadius: 4, fontWeight: 700, background: `${log.c}20`, color: log.c }}>
                    {log.agent}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <span style={{ color: "var(--accent-primary)" }} className="animate-blink">█</span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ borderRadius: 12, padding: 12, textAlign: "center", background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const CLINIC_STEPS = ["Account", "Clinic", "Security"];
const PATIENT_STEPS = ["Account", "Security"];

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"clinic" | "patient">("clinic");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    clinic_name: "",
    password: "", confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const STEPS = role === "patient" ? PATIENT_STEPS : CLINIC_STEPS;

  useEffect(() => {
    const r = searchParams?.get("role");
    if (r === "patient") setRole("patient");
  }, [searchParams]);

  useEffect(() => {
    if (authService.isLoggedIn()) {
      const user = authService.getUser();
      router.push(user?.role === "patient" ? "/patient/dashboard" : "/dashboard");
    }
  }, []);

  const validate = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return setError("Full name required") as unknown as boolean;
      if (!form.email.includes("@")) return setError("Valid email required") as unknown as boolean;
      if (!form.phone.startsWith("+91") || form.phone.length !== 13) return setError("Format: +91XXXXXXXXXX") as unknown as boolean;
    }
    if (role === "clinic" && step === 1 && !form.clinic_name.trim()) {
      return setError("Clinic name required") as unknown as boolean;
    }
    const securityStep = role === "patient" ? 1 : 2;
    if (step === securityStep) {
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
        full_name: form.full_name, role,
        clinic_name: role === "clinic" ? form.clinic_name : undefined,
        phone: form.phone,
      });
      authService.setSession(res.access_token, res.user);
      router.push(role === "patient" ? "/patient/dashboard" : "/dashboard");
    } catch {
      setError("Signup failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", fontSize: 14,
    color: "var(--text-primary)", background: "var(--bg-overlay)",
    border: "none", outline: "none", fontFamily: "inherit"
  };

  const wrap = (key: string) => ({
    borderRadius: 12, overflow: "hidden" as const,
    boxShadow: focused === key ? "0 0 0 2px var(--accent-primary)" : "0 0 0 1px var(--border-subtle)",
    transition: "box-shadow 0.2s",
  });

  const securityStepIndex = role === "patient" ? 1 : 2;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-page)" }}>

      {/* Left panel */}
      <div className="hidden lg:block" style={{ flex: 1, borderRight: "1px solid var(--border-subtle)" }}>
        <LivePanel role={role} />
      </div>

      {/* Right — Signup form */}
      <div style={{
        width: "100%", maxWidth: 520, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 32px", position: "relative", overflowY: "auto"
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 80% 50%,color-mix(in srgb, var(--accent-primary) 5%, transparent) 0%,transparent 60%)"
        }} />

        <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 10 }}>

          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              Create Account
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {role === "patient" ? "Start your medicine journey — free forever" : "Set up your clinic in under 2 minutes"}
            </p>
          </div>

          {/* Role selector */}
          <div style={{
            display: "flex", gap: 6, marginBottom: 18,
            background: "var(--bg-surface)", borderRadius: 14, padding: 5,
            border: "1px solid var(--border-subtle)"
          }}>
            {([
              { id: "clinic" as const, label: "Clinic / Doctor", icon: "ti-stethoscope" },
              { id: "patient" as const, label: "Patient", icon: "ti-user-heart" },
            ]).map(opt => (
              <motion.button key={opt.id} type="button"
                onClick={() => { setRole(opt.id); setStep(0); setError(""); }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: role === opt.id
                    ? "color-mix(in srgb, var(--accent-primary) 14%, transparent)"
                    : "transparent",
                  transition: "background 0.2s",
                }}>
                <i className={`ti ${opt.icon}`} style={{
                  fontSize: 17, color: role === opt.id ? "var(--accent-primary)" : "var(--text-muted)"
                }} />
                <span style={{
                  fontSize: 11, fontWeight: role === opt.id ? 600 : 400,
                  color: role === opt.id ? "var(--accent-primary)" : "var(--text-muted)"
                }}>{opt.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div animate={{
                  background: i < step ? "linear-gradient(135deg,#10b981,#059669)" : i === step ? "var(--accent-gradient)" : "var(--bg-overlay)",
                  scale: i === step ? 1.1 : 1,
                }} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: i <= step ? "var(--text-inverse)" : "var(--text-muted)"
                }}>{i < step ? "✓" : i + 1}</motion.div>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: i === step ? "var(--accent-primary)" : "var(--text-muted)" }}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 20, height: 1, background: i < step ? "var(--success)" : "var(--border-subtle)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 18, padding: 22, marginBottom: 16
          }}>
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">

                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      { k: "full_name", l: "Full Name", t: "text", p: role === "patient" ? "Rahul Sharma" : "Dr. Anjali Sharma" },
                      { k: "email", l: "Email", t: "email", p: role === "patient" ? "you@example.com" : "doctor@clinic.com" },
                      { k: "phone", l: "Phone", t: "tel", p: "+91XXXXXXXXXX" },
                    ].map(f => (
                      <div key={f.k}>
                        <label style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                          {f.l}
                        </label>
                        <div style={wrap(f.k)}>
                          <input type={f.t} value={(form as any)[f.k]}
                            onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                            onFocus={() => setFocused(f.k)} onBlur={() => setFocused(null)}
                            placeholder={f.p} style={inputStyle} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {role === "clinic" && step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                        Clinic Name
                      </label>
                      <div style={wrap("clinic")}>
                        <input type="text" value={form.clinic_name}
                          onChange={e => setForm({ ...form, clinic_name: e.target.value })}
                          onFocus={() => setFocused("clinic")} onBlur={() => setFocused(null)}
                          placeholder="Apollo Clinic, Gurugram" style={inputStyle} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === securityStepIndex && (
                  <motion.div key="sec" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                        Password
                      </label>
                      <div style={{ ...wrap("pass"), display: "flex" }}>
                        <input type={showPass ? "text" : "password"} value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                          placeholder="Min 8 chars, A-Z, 0-9, symbol"
                          style={{ ...inputStyle, flex: 1 }} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          style={{ padding: "0 12px", background: "var(--bg-overlay)", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace" }}>
                          {showPass ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                      {form.password && (
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[!@#$%^&*]/.test(form.password)].map((m, i) => (
                            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: m ? "var(--success)" : "var(--border-subtle)" }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                        Confirm Password
                      </label>
                      <div style={wrap("confirm")}>
                        <input type="password" value={form.confirm_password}
                          onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                          onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                          placeholder="Re-enter password" style={inputStyle} />
                      </div>
                      {form.confirm_password && (
                        <div style={{ fontSize: 11, fontFamily: "monospace", marginTop: 5, color: form.password === form.confirm_password ? "var(--success)" : "var(--danger)" }}>
                          {form.password === form.confirm_password ? "✓ Passwords match" : "✗ Passwords don't match"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: "10px 14px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", marginTop: 14,
                      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                      color: "var(--danger)"
                    }}>⚠ {error}</motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {step > 0 && (
                  <motion.button type="button" onClick={() => { setError(""); setStep(s => s - 1); }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer"
                    }}>← Back</motion.button>
                )}
                {step < STEPS.length - 1 ? (
                  <motion.button type="button" onClick={handleNext}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px color-mix(in srgb, var(--accent-primary) 35%, transparent)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: "none", cursor: "pointer", background: "var(--accent-gradient)", color: "var(--text-inverse)"
                    }}>Continue →</motion.button>
                ) : (
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px color-mix(in srgb, var(--accent-primary) 35%, transparent)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: "none", cursor: loading ? "not-allowed" : "pointer",
                      background: "var(--accent-gradient)", color: "var(--text-inverse)", opacity: loading ? 0.7 : 1
                    }}>{loading ? "Creating..." : "Create Account →"}</motion.button>
                )}
              </div>
            </form>
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Already have an account? </span>
            <a href="/login" style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign in →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}