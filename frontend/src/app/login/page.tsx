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
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: 48, position: "relative", overflow: "hidden" }}>
      {/* Background effects */}
      <div style={{ position: "absolute", inset: 0 }}>
        <motion.div style={{
          position: "absolute", width: 600, height: 600, top: "20%", left: "30%",
          background: "radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)",
          transform: "translate(-50%,-50%)", filter: "blur(40px)"
        }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div style={{
          position: "absolute", width: 400, height: 400, bottom: "10%", right: "10%",
          background: "radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)", filter: "blur(30px)"
        }} animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 10, repeat: Infinity }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 40% 50%,black 30%,transparent 100%)"
        }} />
      </div>

      {/* Top — Logo + tagline */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <motion.a href="/" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 32, textDecoration: "none" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "var(--text-inverse)"
            }}>M</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>MedLoop AI</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>Autonomous Care Platform</div>
          </div>
        </motion.a>

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>
          India's First<br />
          <span style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Autonomous Care AI</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>
          5 AI agents handle prescription reading, medication reminders, stock monitoring,
          health tracking and follow-ups — fully automated.
        </motion.p>
      </div>

      {/* Middle — Live terminal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ position: "relative", zIndex: 10 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-default)" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", background: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", opacity: 0.7 }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginLeft: 4 }}>
                agent-network · live
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
              <span style={{ fontSize: 10, color: "var(--success)", fontFamily: "monospace" }}>LIVE</span>
            </div>
          </div>
          <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 160 }}>
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{log.time}</span>
                  <span style={{
                    flexShrink: 0, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
                    background: `${log.c}20`, color: log.c
                  }}>{log.agent}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <span style={{ color: "var(--accent-primary)" }} className="animate-blink">█</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom — Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {STATS.map((s, i) => (
          <motion.div key={i} whileHover={{ y: -3 }}
            style={{
              borderRadius: 12, padding: 12, textAlign: "center",
              background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)"
            }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{s.l}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"clinic" | "patient">("clinic");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (authService.isLoggedIn()) {
      const user = authService.getUser();
      router.push(user?.role === "patient" ? "/patient/dashboard" : "/dashboard");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(form);
      authService.setSession(res.access_token, res.user);
      if (res.user.role === "patient") {
        router.push("/patient/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-page)" }}>

      {/* Left — Live product panel */}
      <div style={{ flex: 1, borderRight: "1px solid var(--border-subtle)", display: window.innerWidth < 1024 ? "none" : undefined } as any}
        className="hidden lg:block">
        <LivePanel />
      </div>

      {/* Right — Login form */}
      <div style={{
        width: "100%", maxWidth: 480, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "48px 32px", position: "relative"
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 80% 50%,color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%,transparent 60%)"
        }} />

        <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 10 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16, margin: "0 auto 12px",
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 18, color: "var(--text-inverse)"
            }}>M</div>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: "var(--text-primary)" }}>MedLoop AI</h1>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Sign in to your {role === "patient" ? "patient" : "clinic"} dashboard
            </p>
          </div>

          {/* Role selector */}
          <div style={{
            display: "flex", gap: 6, marginBottom: 20,
            background: "var(--bg-surface)", borderRadius: 14, padding: 5,
            border: "1px solid var(--border-subtle)"
          }}>
            {([
              { id: "clinic" as const, label: "Clinic / Doctor", icon: "ti-stethoscope" },
              { id: "patient" as const, label: "Patient", icon: "ti-user-heart" },
            ]).map(opt => (
              <motion.button key={opt.id}
                onClick={() => setRole(opt.id)}
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

          {/* Form card */}
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 18, padding: 22, marginBottom: 18
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <label style={{
                  fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6
                }}>Email</label>
                <div style={{
                  borderRadius: 12, overflow: "hidden",
                  boxShadow: focused === "email" ? "0 0 0 2px var(--accent-primary)" : "0 0 0 1px var(--border-subtle)",
                  transition: "box-shadow 0.2s"
                }}>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder={role === "patient" ? "you@example.com" : "clinic@example.com"}
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 14,
                      color: "var(--text-primary)", background: "var(--bg-overlay)",
                      border: "none", outline: "none", fontFamily: "inherit"
                    }} required
                  />
                </div>
              </div>

              <div>
                <label style={{
                  fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6
                }}>Password</label>
                <div style={{
                  borderRadius: 12, overflow: "hidden", display: "flex",
                  boxShadow: focused === "pass" ? "0 0 0 2px var(--accent-primary)" : "0 0 0 1px var(--border-subtle)",
                  transition: "box-shadow 0.2s"
                }}>
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    style={{
                      flex: 1, padding: "12px 14px", fontSize: 14,
                      color: "var(--text-primary)", background: "var(--bg-overlay)",
                      border: "none", outline: "none", fontFamily: "inherit"
                    }} required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      padding: "0 14px", background: "var(--bg-overlay)", border: "none",
                      cursor: "pointer", color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace"
                    }}>{showPass ? "HIDE" : "SHOW"}</button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: "10px 14px", borderRadius: 10, fontSize: 12, fontFamily: "monospace",
                      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                      color: "var(--danger)"
                    }}>⚠ {error}</motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px color-mix(in srgb, var(--accent-primary) 35%, transparent)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: "var(--accent-gradient)", color: "var(--text-inverse)",
                  opacity: loading ? 0.7 : 1
                }}>
                {loading ? "Signing in..." : "Sign In →"}
              </motion.button>
            </form>
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Don't have an account? </span>
            <a href={role === "patient" ? "/signup?role=patient" : "/signup"}
              style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
              Create account →
            </a>
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 24 }}>
            JWT + AES-256 · HIPAA-lite Security
          </p>
        </div>
      </div>
    </div>
  );
}