"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { authService } from "@/lib/auth";

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
      // Smart redirect based on actual role from backend
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
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)", padding: "24px 20px", position: "relative", overflow: "hidden"
    }}>

      {/* Background orbs */}
      {[
        { x: "15%", y: "20%", c: "rgba(99,102,241,0.18)", s: 500 },
        { x: "85%", y: "75%", c: "rgba(139,92,246,0.14)", s: 450 },
      ].map((o, i) => (
        <motion.div key={i}
          style={{
            position: "fixed", left: o.x, top: o.y, width: o.s, height: o.s,
            borderRadius: "50%", background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            transform: "translate(-50%,-50%)", filter: "blur(40px)", pointerEvents: "none"
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      ))}

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 28 }}>
          <motion.a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            textDecoration: "none", marginBottom: 16
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 18, color: "var(--text-inverse)"
            }}>M</div>
          </motion.a>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Sign in to continue to MedLoop AI
          </p>
        </motion.div>

        {/* Role selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{
            display: "flex", gap: 8, marginBottom: 20,
            background: "var(--bg-surface)", borderRadius: 16, padding: 6,
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
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                background: role === opt.id
                  ? "color-mix(in srgb, var(--accent-primary) 14%, transparent)"
                  : "transparent",
                transition: "background 0.2s",
              }}>
              <i className={`ti ${opt.icon}`} style={{
                fontSize: 20,
                color: role === opt.id ? "var(--accent-primary)" : "var(--text-muted)"
              }} />
              <span style={{
                fontSize: 12, fontWeight: role === opt.id ? 600 : 400,
                color: role === opt.id ? "var(--accent-primary)" : "var(--text-muted)"
              }}>
                {opt.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 20, padding: 24,
            boxShadow: "0 20px 60px color-mix(in srgb, var(--accent-primary) 8%, transparent)"
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
                    width: "100%", padding: "13px 16px", fontSize: 14,
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
                    flex: 1, padding: "13px 16px", fontSize: 14,
                    color: "var(--text-primary)", background: "var(--bg-overlay)",
                    border: "none", outline: "none", fontFamily: "inherit"
                  }} required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    padding: "0 14px", background: "var(--bg-overlay)", border: "none",
                    cursor: "pointer", color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace"
                  }}>
                  {showPass ? "HIDE" : "SHOW"}
                </button>
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
                  }}>
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px color-mix(in srgb, var(--accent-primary) 35%, transparent)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: "var(--accent-gradient)", color: "var(--text-inverse)",
                opacity: loading ? 0.7 : 1, marginTop: 4
              }}>
              {loading ? "Signing in..." : "Sign In →"}
            </motion.button>
          </form>
        </motion.div>

        {/* Signup link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Don't have an account? </span>
          <a href={role === "patient" ? "/signup?role=patient" : "/signup"}
            style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            Create account →
          </a>
        </motion.div>
      </div>
    </div>
  );
}