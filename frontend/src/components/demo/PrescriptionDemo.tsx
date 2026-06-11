"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { prescriptionApi } from "@/lib/api";
import { GlowRing } from "@/components/ui/GlowRing";

const SAMPLE = `Patient: Rahul Sharma, Age 45
Doctor: Dr. Priya Mehta, AIIMS Delhi

1. Metformin 500mg - twice daily after meals - 30 days
2. Amlodipine 5mg - once daily morning - 60 days
3. Vitamin D3 60000IU - once weekly - 8 weeks`;

export function PrescriptionDemo() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await prescriptionApi.parseText(text);
      setResult(res);
    } catch {
      setError("Backend offline — start FastAPI server first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 h-full"
      style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <GlowRing color="rgba(99,102,241,0.6)" size={20} />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>
          Agent 1 — Live Prescription Parser
        </span>
      </div>

      {/* Input */}
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste prescription text here..."
        className="w-full rounded-xl p-4 text-sm resize-none font-mono mb-3"
style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", height: 130, outline: "none", color: "var(--text-primary)" }}
      />

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
          whileTap={{ scale: 0.97 }} onClick={parse} disabled={loading || !text.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
         style={{ background: "var(--accent-gradient)" }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-white border-t-transparent rounded-full inline-block" />
              Parsing...
            </span>
          ) : "Parse →"}
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setText(SAMPLE)}
          className="px-5 py-2.5 rounded-xl text-sm"
style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
          Load Sample
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-xs font-mono p-3 rounded-xl mb-3"
         style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)" }}>
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result?.success && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono px-2 py-1 rounded-lg"
              style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                ✓ PARSED via {result.llm_used?.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: "Patient", v: result.result?.patient_name },
                { l: "Doctor", v: result.result?.doctor_name }
              ].map((f, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-surface)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{f.l}</div>
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {result.result?.medications?.map((med: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{med.medicine_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{med.frequency} · {med.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono" style={{ color: "var(--accent-primary)" }}>{med.dosage}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{med.times_per_day}×/day</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}