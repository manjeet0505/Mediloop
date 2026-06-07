"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { stockApi } from "@/lib/api";
import { GlowRing } from "@/components/ui/GlowRing";

export function StockDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await stockApi.addStock({
        patient_id: "demo_001",
        medicine_name: "Metformin",
        total_quantity: 10,
        doses_taken: 8,
        doses_per_day: 2,
        start_date: new Date().toISOString(),
      });
      const res = await stockApi.checkStock("demo_001");
      setResult(res);
    } catch {
      setResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 h-full"
      style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <GlowRing color="rgba(16,185,129,0.6)" size={20} />
          </div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            Agent 3 — Stock Monitor
          </span>
        </div>
        <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
          whileTap={{ scale: 0.95 }} onClick={run} disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 disabled:opacity-40"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
          {loading ? "Checking..." : "Run Live Check"}
        </motion.button>
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <span className="text-xl">📦</span>
          </div>
          <p className="text-sm text-slate-600">Click "Run Live Check" to ping backend</p>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result?.alerts?.map((alert: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-5"
            style={{
              background: alert.reorder_suggested ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
              border: `1px solid ${alert.reorder_suggested ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`
            }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white">{alert.medicine_name}</span>
              <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold ${alert.reorder_suggested ? "text-red-400" : "text-emerald-400"}`}
                style={{ background: alert.reorder_suggested ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)" }}>
                {alert.reorder_suggested ? "⚠ CRITICAL" : "✓ OK"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: "Days Left", v: String(alert.remaining_days) },
                { l: "Doses Left", v: String(alert.remaining_quantity) },
                { l: "Reorder", v: alert.reorder_suggested ? "YES" : "NO" }
              ].map((m, j) => (
                <div key={j} className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className={`text-xl font-black ${alert.reorder_suggested ? "text-red-400" : "text-emerald-400"}`}>
                    {m.v}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
            {alert.reorder_suggested && (
              <motion.a href={alert.pharmeasy_link} target="_blank"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
                className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Order on Pharmeasy →
              </motion.a>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}