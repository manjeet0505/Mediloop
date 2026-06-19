"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { authApi } from "@/lib/api";

export default function PatientLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    password: "", confirm_password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (authService.isLoggedIn()) router.push("/patient/dashboard");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!form.full_name.trim()) return setError("Full name required");
      if (form.password !== form.confirm_password) return setError("Passwords don't match");
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
      if (!/[A-Z]/.test(form.password)) return setError("Password needs uppercase letter");
      if (!/[0-9]/.test(form.password)) return setError("Password needs a number");
      if (!/[!@#$%^&*]/.test(form.password)) return setError("Password needs special character");
    }

    setLoading(true);
    try {
      let res;
      if (mode === "login") {
        res = await authApi.login({ email: form.email, password: form.password });
      } else {
        res = await authApi.signup({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone,
          role: "patient",
        });
      }
      authService.setSession(res.access_token, res.user);
      router.push("/patient/dashboard");
    } catch {
      setError(mode === "login" ? "Invalid credentials" : "Signup failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key: string) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    fontSize: 14,
    color: "var(--text-primary)",
    background: "var(--bg-overlay)",
    outline: "none",
    border: "none",
    fontFamily: "inherit",
  });

  const wrapStyle = (key: string) => ({
    borderRadius: 12,
    overflow: "hidden" as const,
    boxShadow: focused === key
      ? "0 0 0 2px var(--accent-primary)"
      : "0 0 0 1px var(--border-subtle)",
    transition: "box-shadow 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
      position: "relative", overflow: "hidden"
    }}>

      {/* Background orbs */}
      {[
        { x: "10%", y: "15%", c: "rgba(99,102,241,0.15)", s: 300 },
        { x: "85%", y: "70%", c: "rgba(6,182,212,0.12)", s: 250 },
        { x: "50%", y: "90%", c: "rgba(16,185,129,0.08)", s: 200 },
      ].map((o, i) => (
        <motion.div key={i}
          style={{
            position: "fixed", left: o.x, top: o.y,
            width: o.s, height: o.s, borderRadius: "50%",
            background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            transform: "translate(-50%,-50%)", filter: "blur(30px)",
            pointerEvents: "none"
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity }}
        />
      ))}

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
            background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "var(--text-inverse)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--accent-primary) 30%, transparent)"
          }}>
            M
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            MedLoop AI
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Your personal medicine assistant
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "flex", background: "var(--bg-surface)",
            borderRadius: 14, padding: 4, marginBottom: 24,
            border: "1px solid var(--border-subtle)"
          }}
        >
          {(["login", "signup"] as const).map(m => (
            <motion.button key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, fontSize: 13,
                fontWeight: mode === m ? 600 : 400, border: "none",
                cursor: "pointer", transition: "all 0.2s",
                background: mode === m
                  ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                  : "transparent",
                color: mode === m ? "var(--accent-primary)" : "var(--text-muted)",
              }}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </motion.button>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 20, padding: "24px 20px",
            boxShadow: "0 20px 60px color-mix(in srgb, var(--accent-primary) 8%, transparent)"
          }}
        >
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div key={mode}
                initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >

                {mode === "signup" && (
                  <div>
                    <label style={{
                      fontSize: 11, fontFamily: "monospace",
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.08em", display: "block", marginBottom: 6
                    }}>Full Name</label>
                    <div style={wrapStyle("name")}>
                      <input
                        type="text" value={form.full_name} placeholder="Rahul Sharma"
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                        style={inputStyle("name")} required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{
                    fontSize: 11, fontFamily: "monospace",
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.08em", display: "block", marginBottom: 6
                  }}>Email</label>
                  <div style={wrapStyle("email")}>
                    <input
                      type="email" value={form.email} placeholder="you@example.com"
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      style={inputStyle("email")} required
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label style={{
                      fontSize: 11, fontFamily: "monospace",
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.08em", display: "block", marginBottom: 6
                    }}>Phone</label>
                    <div style={wrapStyle("phone")}>
                      <input
                        type="tel" value={form.phone} placeholder="+91XXXXXXXXXX"
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                        style={inputStyle("phone")}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{
                    fontSize: 11, fontFamily: "monospace",
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.08em", display: "block", marginBottom: 6
                  }}>Password</label>
                  <div style={{ ...wrapStyle("pass"), display: "flex" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password} placeholder="••••••••"
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle("pass"), flex: 1 }} required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{
                        padding: "0 14px", background: "var(--bg-overlay)",
                        border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace"
                      }}>
                      {showPass ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  {mode === "signup" && form.password && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                      {[
                        form.password.length >= 8,
                        /[A-Z]/.test(form.password),
                        /[0-9]/.test(form.password),
                        /[!@#$%^&*]/.test(form.password)
                      ].map((met, i) => (
                        <motion.div key={i}
                          animate={{ background: met ? "var(--success)" : "var(--border-subtle)" }}
                          style={{ flex: 1, height: 3, borderRadius: 2 }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <label style={{
                      fontSize: 11, fontFamily: "monospace",
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.08em", display: "block", marginBottom: 6
                    }}>Confirm Password</label>
                    <div style={wrapStyle("confirm")}>
                      <input
                        type="password" value={form.confirm_password}
                        placeholder="Re-enter password"
                        onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                        onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                        style={inputStyle("confirm")}
                      />
                    </div>
                    {form.confirm_password && (
                      <div style={{
                        fontSize: 11, fontFamily: "monospace", marginTop: 5,
                        color: form.password === form.confirm_password
                          ? "var(--success)" : "var(--danger)"
                      }}>
                        {form.password === form.confirm_password
                          ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        padding: "10px 14px", borderRadius: 10,
                        fontSize: 12, fontFamily: "monospace",
                        background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                        color: "var(--danger)"
                      }}
                    >
                      ⚠ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 30px color-mix(in srgb, var(--accent-primary) 35%, transparent)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    fontSize: 14, fontWeight: 600, border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: "var(--accent-gradient)",
                    color: "var(--text-inverse)",
                    opacity: loading ? 0.7 : 1, marginTop: 4
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <motion.span animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ display: "inline-block", width: 16, height: 16,
                          borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid white"
                        }} />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : mode === "login" ? "Sign In →" : "Create Account →"}
                </motion.button>

              </motion.div>
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Bottom links */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ textAlign: "center", marginTop: 20 }}
        >
          <motion.a href="/login" whileHover={{ color: "var(--accent-primary)" }}
            style={{
              fontSize: 12, color: "var(--text-muted)",
              textDecoration: "none", display: "block", marginBottom: 6
            }}>
            Are you a clinic/doctor? Sign in here →
          </motion.a>
          <a href="/"
            style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none", fontFamily: "monospace" }}>
            ← Back to home
          </a>
        </motion.div>
      </div>
    </div>
  );
}