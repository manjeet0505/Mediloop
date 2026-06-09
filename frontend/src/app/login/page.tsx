"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { authService } from "@/lib/auth";

function GlowOrb({ x, y, color, size }: { x: string; y: string; color: string; size: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle,${color} 0%,transparent 70%)`, transform: "translate(-50%,-50%)", filter: "blur(40px)" }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 8, repeat: Infinity }}
    />
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
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#020408" }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <GlowOrb x="15%" y="20%" color="rgba(99,102,241,0.2)" size={600} />
        <GlowOrb x="85%" y="80%" color="rgba(139,92,246,0.15)" size={500} />
        <GlowOrb x="50%" y="50%" color="rgba(6,182,212,0.08)" size={400} />
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)"
        }} />
        {/* Animated rings */}
        {[300, 500, 700].map((s, i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: s, height: s, border: "1px solid rgba(99,102,241,0.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i * 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="text-center mb-10">
          <motion.a href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
              <motion.div className="absolute inset-0 rounded-2xl -z-10"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(12px)", opacity: 0.6 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <div className="text-left">
              <div className="font-black text-white text-xl">MedLoop AI</div>
              <div className="text-xs text-slate-600 font-mono">Autonomous Care Platform</div>
            </div>
          </motion.a>
          <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to your clinic dashboard</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 80px rgba(99,102,241,0.08)" }}>

          {/* Card inner glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 0%,rgba(99,102,241,0.08) 0%,transparent 60%)" }} />

          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">

            {/* Email */}
            <div>
              <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                Email Address
              </label>
              <motion.div animate={{ boxShadow: focused === "email" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                className="rounded-xl overflow-hidden">
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="clinic@example.com"
                  className="w-full px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                  style={{ background: "rgba(0,0,0,0.4)", border: "none" }}
                  required
                />
              </motion.div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                Password
              </label>
              <motion.div animate={{ boxShadow: focused === "password" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                className="rounded-xl overflow-hidden flex items-center">
                <input type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  className="flex-1 px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                  style={{ background: "rgba(0,0,0,0.4)", border: "none" }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="px-4 text-slate-600 hover:text-slate-400 transition-colors"
                  style={{ background: "rgba(0,0,0,0.4)" }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </motion.div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="rounded-xl px-4 py-3 text-xs font-mono text-red-400"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-white text-sm relative overflow-hidden disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <motion.div className="absolute inset-0"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
                initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} />
              <span className="relative flex items-center justify-center gap-2">
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-xs text-slate-700 font-mono">OR</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Signup link */}
            <div className="text-center">
              <span className="text-sm text-slate-600">Don't have an account? </span>
              <motion.a href="/signup" whileHover={{ color: "#a5b4fc" }}
                className="text-sm text-indigo-400 font-semibold cursor-pointer">
                Create clinic account →
              </motion.a>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center mt-8">
          <p className="text-xs text-slate-700 font-mono">
            Protected by MedLoop AI Security · JWT + AES-256
          </p>
        </motion.div>
      </div>
    </div>
  );
}