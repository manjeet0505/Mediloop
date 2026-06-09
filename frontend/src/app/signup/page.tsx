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

  const nextStep = () => { setError(""); setStep(s => s + 1); };
  const prevStep = () => { setError(""); setStep(s => s - 1); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return setError("Full name is required");
      if (!form.email.includes("@")) return setError("Valid email required");
      if (!form.phone.startsWith("+91") || form.phone.length !== 13) return setError("Phone format: +91XXXXXXXXXX");
    }
    if (step === 1) {
      if (!form.clinic_name.trim()) return setError("Clinic name is required");
    }
    if (step === 2) {
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
      if (!/[A-Z]/.test(form.password)) return setError("Password needs uppercase letter");
      if (!/[0-9]/.test(form.password)) return setError("Password needs a number");
      if (!/[!@#$%^&*]/.test(form.password)) return setError("Password needs special character");
      if (form.password !== form.confirm_password) return setError("Passwords do not match");
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() === true) nextStep();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep() !== true) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.signup({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        clinic_name: form.clinic_name,
        phone: form.phone,
      });
      authService.setSession(res.access_token, res.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Signup failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none";
  const inputStyle = { background: "rgba(0,0,0,0.4)", border: "none" };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12"
      style={{ background: "#020408" }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <GlowOrb x="20%" y="30%" color="rgba(99,102,241,0.18)" size={600} />
        <GlowOrb x="80%" y="70%" color="rgba(139,92,246,0.14)" size={500} />
        <GlowOrb x="50%" y="10%" color="rgba(6,182,212,0.08)" size={400} />
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)"
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <motion.a href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>M</div>
              <motion.div className="absolute inset-0 rounded-xl -z-10"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(10px)", opacity: 0.5 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
            </div>
            <span className="font-black text-white text-lg">MedLoop AI</span>
          </motion.a>
          <h1 className="text-3xl font-black text-white mb-1">Create Account</h1>
          <p className="text-slate-500 text-sm">Join India's first autonomous care platform</p>
        </motion.div>

        {/* Stepper */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                animate={{
                  background: i < step ? "linear-gradient(135deg,#10b981,#059669)" : i === step ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
                  borderColor: i <= step ? "transparent" : "rgba(255,255,255,0.1)",
                  scale: i === step ? 1.1 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border"
                style={{ border: "1px solid" }}>
                {i < step ? "✓" : i + 1}
              </motion.div>
              <span className={`text-xs font-mono hidden sm:block ${i === step ? "text-indigo-400" : "text-slate-700"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <motion.div className="w-8 h-px"
                  animate={{ background: i < step ? "#10b981" : "rgba(255,255,255,0.08)" }}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.15 }}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 0 80px rgba(99,102,241,0.08)" }}>

          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 0%,rgba(99,102,241,0.06) 0%,transparent 60%)" }} />

          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">

              {/* Step 0 — Account */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">
                    Step 1 — Your Details
                  </div>
                  {[
                    { key: "full_name", label: "Full Name", type: "text", placeholder: "Dr. Anjali Sharma" },
                    { key: "email", label: "Email Address", type: "email", placeholder: "doctor@clinic.com" },
                    { key: "phone", label: "Phone Number", type: "tel", placeholder: "+91XXXXXXXXXX" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                        {field.label}
                      </label>
                      <motion.div animate={{ boxShadow: focused === field.key ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                        className="rounded-xl overflow-hidden">
                        <input type={field.type}
                          value={(form as any)[field.key]}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                          onFocus={() => setFocused(field.key)}
                          onBlur={() => setFocused(null)}
                          placeholder={field.placeholder}
                          className={inputClass} style={inputStyle}
                        />
                      </motion.div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 1 — Clinic */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">
                    Step 2 — Clinic Details
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                      Clinic Name
                    </label>
                    <motion.div animate={{ boxShadow: focused === "clinic" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                      className="rounded-xl overflow-hidden">
                      <input type="text" value={form.clinic_name}
                        onChange={e => setForm({ ...form, clinic_name: e.target.value })}
                        onFocus={() => setFocused("clinic")}
                        onBlur={() => setFocused(null)}
                        placeholder="Apollo Clinic, Gurugram"
                        className={inputClass} style={inputStyle}
                      />
                    </motion.div>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: "clinic", l: "Clinic", d: "Manage patients & prescriptions" },
                        { v: "doctor", l: "Doctor", d: "View patient summaries" },
                      ].map((opt) => (
                        <motion.div key={opt.v}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setForm({ ...form, role: opt.v })}
                          className="rounded-xl p-4 cursor-pointer"
                          style={{
                            background: form.role === opt.v ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.3)",
                            border: `1px solid ${form.role === opt.v ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                          }}>
                          <div className="font-semibold text-white text-sm mb-1">{opt.l}</div>
                          <div className="text-xs text-slate-600">{opt.d}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Security */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">
                    Step 3 — Set Password
                  </div>
                  {/* Password strength indicator */}
                  <div>
                    <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                      Password
                    </label>
                    <motion.div animate={{ boxShadow: focused === "pass" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                      className="rounded-xl overflow-hidden flex">
                      <input type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        onFocus={() => setFocused("pass")}
                        onBlur={() => setFocused(null)}
                        placeholder="Min 8 chars, uppercase, number, symbol"
                        className={`${inputClass} flex-1`} style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="px-4 text-slate-600 hover:text-slate-400"
                        style={{ background: "rgba(0,0,0,0.4)" }}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </motion.div>
                    {/* Strength bars */}
                    {form.password && (
                      <div className="flex gap-1 mt-2">
                        {[
                          form.password.length >= 8,
                          /[A-Z]/.test(form.password),
                          /[0-9]/.test(form.password),
                          /[!@#$%^&*]/.test(form.password),
                        ].map((met, i) => (
                          <motion.div key={i} className="h-1 flex-1 rounded-full"
                            animate={{ background: met ? "#10b981" : "rgba(255,255,255,0.08)" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 block">
                      Confirm Password
                    </label>
                    <motion.div animate={{ boxShadow: focused === "confirm" ? "0 0 0 2px rgba(99,102,241,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)" }}
                      className="rounded-xl overflow-hidden">
                      <input type="password" value={form.confirm_password}
                        onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                        onFocus={() => setFocused("confirm")}
                        onBlur={() => setFocused(null)}
                        placeholder="Re-enter password"
                        className={inputClass} style={inputStyle}
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

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl px-4 py-3 text-xs font-mono text-red-400 mt-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <motion.button type="button" onClick={prevStep}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-slate-400 text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  ← Back
                </motion.button>
              )}
              {step < 2 ? (
                <motion.button type="button" onClick={handleNext}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Continue →
                </motion.button>
              ) : (
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm relative overflow-hidden disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                        Creating account...
                      </>
                    ) : "Create Account →"}
                  </span>
                </motion.button>
              )}
            </div>

            {/* Login link */}
            <div className="text-center mt-5">
              <span className="text-sm text-slate-600">Already have an account? </span>
              <motion.a href="/login" whileHover={{ color: "#a5b4fc" }}
                className="text-sm text-indigo-400 font-semibold cursor-pointer">
                Sign in →
              </motion.a>
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center mt-6">
          <p className="text-xs text-slate-700 font-mono">
            Protected by MedLoop AI Security · JWT + AES-256 · HIPAA-lite
          </p>
        </motion.div>
      </div>
    </div>
  );
}