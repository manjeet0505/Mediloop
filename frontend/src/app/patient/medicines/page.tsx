"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchPatient(path: string, token: string) {
  const res = await fetch(`${API}/api/v1/patient${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const SCHEDULE = [
  { time: "8:00 AM", label: "Early Morning" },
  { time: "9:00 AM", label: "Morning" },
  { time: "2:00 PM", label: "Afternoon" },
  { time: "9:00 PM", label: "Evening" },
];

const HISTORY = [
  { date: "Today", doses: [{ name: "Metformin 500mg", time: "9:00 AM", taken: true }, { name: "Amlodipine 5mg", time: "9:00 AM", taken: true }, { name: "Metformin 500mg", time: "9:00 PM", taken: false }] },
  { date: "Yesterday", doses: [{ name: "Metformin 500mg", time: "9:00 AM", taken: true }, { name: "Amlodipine 5mg", time: "9:00 AM", taken: true }, { name: "Metformin 500mg", time: "9:00 PM", taken: true }] },
  { date: "2 days ago", doses: [{ name: "Metformin 500mg", time: "9:00 AM", taken: true }, { name: "Amlodipine 5mg", time: "9:00 AM", taken: false }, { name: "Metformin 500mg", time: "9:00 PM", taken: true }] },
];

function Glass({ children, style, accent }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.055)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      border: `1px solid ${accent ? `color-mix(in srgb, ${accent} 30%, rgba(255,255,255,0.08))` : "rgba(255,255,255,0.08)"}`,
      borderRadius: 20,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      ...style,
    }}>
      {accent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}90, transparent)`,
        }} />
      )}
      {children}
    </div>
  );
}

function Ring({ value, size = 80 }: { value: number; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}%</span>
      </div>
    </div>
  );
}

export default function MedicinesPage() {
  const [meds, setMeds] = useState<any[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "schedule" | "history">("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const token = authService.getToken();
      if (!token) return;
      try {
        const medicines = await fetchPatient("/me/medicines", token);
        setMeds(medicines);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const markTaken = (i: number) => {
    setConfirming(i);
    setTimeout(() => {
      setMeds(p => p.map((m, idx) => idx === i ? { ...m, taken: true } : m));
      setConfirming(null);
    }, 600);
  };

  const taken = meds.filter(m => m.taken).length;
  const total = meds.length;
  const adherencePct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const TABS = [
    { id: "today" as const, label: "Today", icon: "ti-calendar-today" },
    { id: "schedule" as const, label: "Schedule", icon: "ti-clock" },
    { id: "history" as const, label: "History", icon: "ti-history" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Patient Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#fff", letterSpacing: "-0.025em" }}>
            Medicines <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/ Active</span>
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 12, fontSize: 13,
            fontWeight: 500, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
          }}>
          <i className="ti ti-upload" style={{ fontSize: 15 }} />
          Upload Prescription
        </motion.button>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="med-stats">
        {[
          { l: "Active medicines", v: total || 3, accent: "#6366f1" },
          { l: "Taken today", v: `${taken}/${total || 3}`, accent: "#10b981" },
          { l: "Today's adherence", v: `${adherencePct || 67}%`, accent: "#8b5cf6" },
          { l: "Next dose", v: meds.find(m => !m.taken)?.time ?? "—", accent: "#f59e0b" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}>
            <Glass style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{s.l}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.025em" }}>{s.v}</p>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.accent}, transparent)`, opacity: 0.6 }} />
            </Glass>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <Glass style={{ padding: 5, display: "inline-flex", gap: 4 }}>
          {TABS.map(tab => (
            <motion.button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 14, fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "rgba(99,102,241,0.25)" : "transparent",
                color: activeTab === tab.id ? "#818cf8" : "rgba(255,255,255,0.4)",
                boxShadow: activeTab === tab.id ? "0 0 20px rgba(99,102,241,0.15)" : "none",
                transition: "all 0.2s",
              }}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 15 }} />
              {tab.label}
            </motion.button>
          ))}
        </Glass>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">

        {/* TODAY TAB */}
        {activeTab === "today" && (
          <motion.div key="today"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }} className="med-today">

            {/* Medicine list */}
            <Glass style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Today's medicines</p>
                <span style={{
                  fontSize: 11, padding: "3px 12px", borderRadius: 20,
                  background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 500,
                }}>{taken} of {total || 3} taken</span>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #6366f1" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {meds.map((med, i) => (
                    <motion.div key={i} layout
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "16px 18px", borderRadius: 16,
                        background: med.taken ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${med.taken ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`,
                        position: "relative", overflow: "hidden",
                        transition: "all 0.4s",
                      }}>
                      {/* Left color bar */}
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                        background: med.color ?? "#6366f1",
                        borderRadius: "16px 0 0 16px",
                        opacity: med.taken ? 0.4 : 1,
                        boxShadow: `0 0 12px ${med.color ?? "#6366f1"}60`,
                      }} />

                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0, marginLeft: 8,
                        background: `color-mix(in srgb, ${med.color ?? "#6366f1"} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${med.color ?? "#6366f1"} 22%, transparent)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: med.taken ? "none" : `0 0 16px color-mix(in srgb, ${med.color ?? "#6366f1"} 20%, transparent)`,
                      }}>
                        <i className="ti ti-pill" style={{ fontSize: 20, color: med.color ?? "#6366f1" }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: med.taken ? "rgba(255,255,255,0.5)" : "#fff", marginBottom: 3 }}>
                          {med.name}
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>{med.dosage}</span>
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                            <i className="ti ti-clock" style={{ fontSize: 12 }} />
                            {med.time}
                          </span>
                          {med.taken && (
                            <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                              <i className="ti ti-check" style={{ fontSize: 11 }} />
                              Confirmed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <AnimatePresence mode="wait">
                        {med.taken ? (
                          <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{
                              width: 36, height: 36, borderRadius: "50%",
                              background: "rgba(16,185,129,0.2)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                            }}>
                            <i className="ti ti-check" style={{ fontSize: 16, color: "#10b981" }} />
                          </motion.div>
                        ) : confirming === i ? (
                          <motion.div key="load" style={{ display: "flex", gap: 3 }}>
                            {[0, 1, 2].map(d => (
                              <motion.div key={d} animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: d * 0.1 }}
                                style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.button key="btn"
                            whileHover={{ scale: 1.05, background: "rgba(99,102,241,0.25)", boxShadow: "0 0 16px rgba(99,102,241,0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markTaken(i)}
                            style={{
                              padding: "8px 18px", borderRadius: 10, fontSize: 13,
                              fontWeight: 500, border: "1px solid rgba(99,102,241,0.25)",
                              background: "rgba(99,102,241,0.12)", color: "#818cf8",
                              cursor: "pointer", transition: "all 0.2s",
                            }}>
                            Mark taken
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </Glass>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Today's adherence ring */}
              <Glass accent="#10b981" style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Today's Progress
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Ring value={adherencePct || 67} size={80} />
                  <div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                      {taken} of {total || 3} doses
                    </p>
                    <p style={{ fontSize: 12, color: adherencePct >= 80 ? "#10b981" : "#f59e0b" }}>
                      {adherencePct >= 80 ? "On track" : "Keep going"}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 16, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${adherencePct || 67}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    style={{ height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 2, boxShadow: "0 0 8px rgba(16,185,129,0.4)" }}
                  />
                </div>
              </Glass>

              {/* Medicine info cards */}
              {(meds.length > 0 ? meds : [
                { name: "Metformin", dosage: "500mg", color: "#6366f1", time: "9:00 AM" },
                { name: "Amlodipine", dosage: "5mg", color: "#06b6d4", time: "9:00 AM" },
              ]).slice(0, 3).map((med, i) => (
                <Glass key={i} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: med.color ?? "#6366f1", flexShrink: 0, boxShadow: `0 0 8px ${med.color ?? "#6366f1"}` }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{med.name} <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{med.dosage}</span></p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Next: {med.time}</p>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }} />
                  </div>
                </Glass>
              ))}
            </div>
          </motion.div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <motion.div key="schedule"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}>
            <Glass style={{ padding: "24px 28px" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 24 }}>Daily Schedule</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {SCHEDULE.map((slot, si) => {
                  const slotMeds = (meds.length > 0 ? meds : [
                    { name: "Metformin", dosage: "500mg", color: "#6366f1", time: "9:00 AM", taken: false },
                    { name: "Metformin", dosage: "500mg", color: "#6366f1", time: "9:00 PM", taken: false },
                    { name: "Amlodipine", dosage: "5mg", color: "#06b6d4", time: "9:00 AM", taken: false },
                  ]).filter(m => m.time === slot.time);

                  return (
                    <motion.div key={si}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: si * 0.08 }}
                      style={{
                        display: "flex", gap: 20, paddingBottom: si < SCHEDULE.length - 1 ? 24 : 0,
                        marginBottom: si < SCHEDULE.length - 1 ? 24 : 0,
                        borderBottom: si < SCHEDULE.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}>
                      {/* Time column */}
                      <div style={{ width: 80, flexShrink: 0, paddingTop: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: slotMeds.length > 0 ? "#fff" : "rgba(255,255,255,0.2)" }}>{slot.time}</p>
                        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{slot.label}</p>
                      </div>

                      {/* Timeline dot */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                          background: slotMeds.length > 0 ? "#6366f1" : "rgba(255,255,255,0.1)",
                          border: slotMeds.length > 0 ? "2px solid rgba(99,102,241,0.4)" : "2px solid rgba(255,255,255,0.08)",
                          boxShadow: slotMeds.length > 0 ? "0 0 12px rgba(99,102,241,0.4)" : "none",
                          marginTop: 4,
                        }} />
                        {si < SCHEDULE.length - 1 && (
                          <div style={{ width: 1, flex: 1, minHeight: 40, background: "rgba(255,255,255,0.05)", marginTop: 6 }} />
                        )}
                      </div>

                      {/* Medicines */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        {slotMeds.length > 0 ? slotMeds.map((med, mi) => (
                          <div key={mi} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 12,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: med.color, boxShadow: `0 0 8px ${med.color}` }} />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{med.name}</span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{med.dosage}</span>
                          </div>
                        )) : (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic", paddingTop: 2 }}>No medicines scheduled</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Glass>
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {HISTORY.map((day, di) => {
              const dayTaken = day.doses.filter(d => d.taken).length;
              const dayTotal = day.doses.length;
              const dayPct = Math.round((dayTaken / dayTotal) * 100);
              return (
                <motion.div key={di}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: di * 0.08 }}>
                  <Glass style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{day.date}</p>
                        <span style={{
                          fontSize: 11, padding: "2px 10px", borderRadius: 20,
                          background: dayPct === 100 ? "rgba(16,185,129,0.15)" : dayPct >= 66 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                          color: dayPct === 100 ? "#10b981" : dayPct >= 66 ? "#f59e0b" : "#ef4444",
                        }}>{dayPct}%</span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{dayTaken}/{dayTotal} doses</p>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${dayPct}%`,
                        background: dayPct === 100 ? "#10b981" : dayPct >= 66 ? "#f59e0b" : "#ef4444",
                        transition: "width 0.8s ease",
                      }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {day.doses.map((dose, dosi) => (
                        <div key={dosi} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px", borderRadius: 10,
                          background: dose.taken ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                          border: `1px solid ${dose.taken ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}`,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                            background: dose.taken ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <i className={`ti ${dose.taken ? "ti-check" : "ti-x"}`}
                              style={{ fontSize: 12, color: dose.taken ? "#10b981" : "#ef4444" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{dose.name}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{dose.time}</p>
                          </div>
                          <span style={{ fontSize: 11, color: dose.taken ? "#10b981" : "#ef4444", fontWeight: 500 }}>
                            {dose.taken ? "Taken" : "Missed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Glass>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .med-today { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .med-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}