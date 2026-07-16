"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchPatient(path: string, token: string) {
  const res = await fetch(`${API}/api/v1/patient${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function heatColor(pct: number | null): string {
  if (pct === null) return "#0a0a0a";
  if (pct === 0) return "#3a1414";
  if (pct < 50) return "#5c2e0e";
  if (pct < 80) return "#5c4a0e";
  if (pct < 100) return "#0e4a2a";
  return "#10b981";
}

function Heatmap({ cells }: { cells: any[] }) {
  const [hovered, setHovered] = useState<any>(null);

  // chunk chronological cells into columns of 7 (weeks)
  const weeks: any[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((cell, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.003 }}
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: heatColor(cell.pct),
                  cursor: "pointer",
                  border: hovered?.date === cell.date ? "1px solid #fff" : "1px solid transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              marginTop: 10, fontSize: 12, color: "#888",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ color: "#e8e8e8", fontWeight: 500 }}>
              {new Date(hovered.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            {hovered.total > 0 ? (
              <span>{hovered.taken}/{hovered.total} doses taken ({hovered.pct}%)</span>
            ) : (
              <span style={{ color: "#444" }}>No doses scheduled</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 11, color: "#444" }}>
        <span>Less</span>
        {[null, 0, 40, 70, 100].map((p, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: heatColor(p as any) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function MedicineDrawer({ medicine, onClose }: { medicine: any; onClose: () => void }) {
  return (
    <AnimatePresence>
      {medicine && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 91,
              width: "min(400px, 100vw)", background: "#050505",
              borderLeft: "1px solid #1a1a1a", padding: 32, overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: medicine.color, boxShadow: `0 0 10px ${medicine.color}`,
                  marginBottom: 12,
                }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                  {medicine.name}
                </h2>
                <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{medicine.dosage}</p>
              </div>
              <button onClick={onClose} style={{
                background: "transparent", border: "1px solid #1f1f1f", borderRadius: 8,
                width: 30, height: 30, color: "#666", cursor: "pointer",
              }}>✕</button>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                30-Day Adherence
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
                  {medicine.adherence_30d}%
                </span>
                <span style={{ fontSize: 12, color: "#444" }}>
                  {medicine.taken_30d} taken · {medicine.missed_30d} missed
                </span>
              </div>
              <div style={{ height: 3, background: "#141414", borderRadius: 2, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${medicine.adherence_30d}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: "100%", background: medicine.adherence_30d >= 80 ? "#10b981" : "#f59e0b" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Schedule
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #0f0f0f" }}>
                <span style={{ fontSize: 13, color: "#888" }}>Frequency</span>
                <span style={{ fontSize: 13, color: "#e8e8e8" }}>{medicine.doses_per_day}x daily</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#444", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Stock
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#888" }}>{medicine.remaining} of {medicine.total} left</span>
                <span style={{ fontSize: 13, color: medicine.days_left <= 7 ? "#ef4444" : "#888" }}>
                  {medicine.days_left} days left
                </span>
              </div>
              <div style={{ height: 3, background: "#141414", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${Math.round((medicine.remaining / medicine.total) * 100)}%`,
                  background: medicine.days_left <= 7 ? "#ef4444" : medicine.color,
                }} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const token = authService.getToken();
      if (!token) return;
      try {
        const [list, heat] = await Promise.all([
          fetchPatient("/me/medicines/list", token),
          fetchPatient("/me/medicines/heatmap?weeks=12", token),
        ]);
        setMedicines(list);
        setHeatmap(heat.days);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 48 }}>
        <p style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>Your medicines</p>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
          Medicines
        </h1>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
          ADHERENCE HISTORY
        </h2>
        {loading ? (
          <div style={{ height: 100, background: "#0a0a0a", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
        ) : (
          <Heatmap cells={heatmap} />
        )}
      </motion.div>

      <div style={{ height: 1, background: "#141414", marginBottom: 48 }} />

      {/* Medicine cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
          ACTIVE MEDICINES
        </h2>

        {loading ? (
          [1, 2].map(i => (
            <div key={i} style={{ height: 88, background: "#0a0a0a", borderRadius: 12, marginBottom: 10, animation: "pulse 1.5s infinite" }} />
          ))
        ) : medicines.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#444", fontSize: 13 }}>
            No active medicines found
          </div>
        ) : (
          medicines.map((med, i) => (
            <motion.div
              key={med.name}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              whileHover={{ borderColor: "#2a2a2a" }}
              onClick={() => setSelected(med)}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "18px 20px", borderRadius: 12, marginBottom: 10,
                border: "1px solid #141414", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: med.color, boxShadow: `0 0 8px ${med.color}`, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                  {med.name} <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>{med.dosage}</span>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                  {med.doses_per_day}x daily · {med.remaining} doses left
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: med.adherence_30d >= 80 ? "#10b981" : "#f59e0b",
                }}>
                  {med.adherence_30d}%
                </div>
                <div style={{ fontSize: 11, color: "#444" }}>30d</div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "#333" }} />
            </motion.div>
          ))
        )}
      </motion.div>

      <MedicineDrawer medicine={selected} onClose={() => setSelected(null)} />

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
    </div>
  );
}