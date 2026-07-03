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

const WEEK_DEFAULT = [
  { d: "M", p: 100 }, { d: "T", p: 67 }, { d: "W", p: 100 },
  { d: "T", p: 33 }, { d: "F", p: 100 }, { d: "S", p: 67 }, { d: "S", p: 67 },
];

const VITALS = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", ok: true, trend: "+2", icon: "ti-heart-rate-monitor" },
  { label: "Blood Sugar", value: "142", unit: "mg/dL", ok: false, trend: "+8", icon: "ti-droplet" },
  { label: "Weight", value: "72", unit: "kg", ok: true, trend: "-0.5", icon: "ti-scale" },
  { label: "SpO2", value: "98", unit: "%", ok: true, trend: "—", icon: "ti-lungs" },
];

const ACTIVITY = [
  { time: "9:03 AM", msg: "Metformin 500mg taken", type: "taken", ago: "3h ago" },
  { time: "9:03 AM", msg: "Amlodipine 5mg taken", type: "taken", ago: "3h ago" },
  { time: "Yesterday", msg: "Metformin 500mg missed", type: "missed", ago: "1d ago" },
  { time: "Yesterday", msg: "Reminder sent via WhatsApp", type: "reminder", ago: "1d ago" },
  { time: "2 days ago", msg: "Vitamin D3 taken", type: "taken", ago: "2d ago" },
  { time: "2 days ago", msg: "Stock alert triggered", type: "alert", ago: "2d ago" },
];

const AI_TIPS = [
  "Your blood sugar is slightly elevated. Try reducing refined carbs today.",
  "5-day streak! Consistency is the key to better health outcomes.",
  "Metformin is best taken with meals to reduce stomach discomfort.",
  "Your adherence this week is above average. Keep it up!",
];

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
      setDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 26, fontWeight: 300, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{time}</div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{date}</div>
    </div>
  );
}

function Glass({ children, style, accent, hover }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, boxShadow: `0 20px 60px rgba(0,0,0,0.4)` } : undefined}
      transition={{ duration: 0.2 }}
      style={{
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
    </motion.div>
  );
}

function Ring({ value, size = 110 }: { value: number; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 600, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function DoseTimeline({ meds }: { meds: any[] }) {
  const slots = [
    { time: "8:00 AM" }, { time: "9:00 AM" }, { time: "2:00 PM" }, { time: "9:00 PM" },
  ];
  return (
    <div style={{ position: "relative", padding: "12px 0 8px" }}>
      <div style={{ position: "absolute", top: "45%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.06)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        {slots.map((slot, i) => {
          const med = meds.find(m => m.time === slot.time);
          const status = !med ? "empty" : med.taken ? "taken" : "pending";
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>{slot.time}</div>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: status === "taken" ? "rgba(16,185,129,0.2)" : status === "pending" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  border: status === "taken" ? "1px solid rgba(16,185,129,0.4)" : status === "pending" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  position: "relative", zIndex: 1,
                  boxShadow: status === "taken" ? "0 0 16px rgba(16,185,129,0.2)" : status === "pending" ? "0 0 16px rgba(99,102,241,0.25)" : "none",
                }}>
                {status === "taken" && <i className="ti ti-check" style={{ fontSize: 16, color: "#10b981" }} />}
                {status === "pending" && (
                  <motion.div animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8" }} />
                )}
                {status === "empty" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />}
              </motion.div>
              {med && (
                <div style={{ fontSize: 10, color: status === "taken" ? "#10b981" : "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: 64 }}>
                  {med.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const typeConfig: Record<string, { color: string; icon: string }> = {
    taken:    { color: "#10b981", icon: "ti-check" },
    missed:   { color: "#ef4444", icon: "ti-x" },
    reminder: { color: "#6366f1", icon: "ti-bell" },
    alert:    { color: "#f59e0b", icon: "ti-alert-triangle" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {ACTIVITY.map((item, i) => {
        const cfg = typeConfig[item.type];
        return (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "11px 0",
              borderBottom: i < ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 1,
            }}>
              <i className={`ti ${cfg.icon}`} style={{ fontSize: 13, color: cfg.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>{item.msg}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.time}</p>
            </div>
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{item.ago}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function StockBar({ name, remaining, total, color, daysLeft }: {
  name: string; remaining: number; total: number; color: string; daysLeft: number;
}) {
  const pct = Math.round((remaining / total) * 100);
  const danger = daysLeft <= 7;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>{name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: danger ? "#ef4444" : "rgba(255,255,255,0.35)" }}>
            {daysLeft}d left
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{remaining}/{total}</span>
        </div>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            height: "100%", borderRadius: 3,
            background: danger ? "#ef4444" : color,
            boxShadow: `0 0 8px ${danger ? "#ef444440" : color + "40"}`,
          }}
        />
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Good morning");
  const [tipIndex] = useState(Math.floor(Math.random() * AI_TIPS.length));

  useEffect(() => {
    setUser(authService.getUser());
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    const timer = setTimeout(async () => {
      const token = authService.getToken();
      if (!token) return;
      try {
        const [medicines, adherence, stock] = await Promise.all([
          fetchPatient("/me/medicines", token),
          fetchPatient("/me/adherence", token),
          fetchPatient("/me/stock", token),
        ]);
        setMeds(medicines);
        setAdherenceData(adherence);
        setStockData(stock);
      } catch (err) {
        console.error("Patient API error:", err);
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

  const adherence = adherenceData?.overall ?? 87;
  const streak = adherenceData?.streak ?? 5;
  const weekData = adherenceData?.week ?? WEEK_DEFAULT;
  const taken = meds.filter(m => m.taken).length;
  const total = meds.length;
  const nextDose = meds.find(m => !m.taken);
  const lowStock = stockData.filter((s: any) => s.days_left <= 7);
  const healthScore = Math.round((adherence * 0.6) + (VITALS.filter(v => v.ok).length / VITALS.length * 40));
  const name = user?.full_name?.split(" ")[0] ?? "";

  const stockDisplay = stockData.length > 0 ? stockData : [
    { name: "Metformin", remaining: 10, qty: 60, color: "#6366f1", days_left: 2 },
    { name: "Amlodipine", remaining: 45, qty: 60, color: "#06b6d4", days_left: 45 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#fff", letterSpacing: "-0.025em" }}>
            {name || "Patient"} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/ Overview</span>
          </h1>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── ROW 1: Health Score + Next Dose + Streak ── */}
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr 210px", gap: 12 }} className="pg-r1">

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <Glass accent="#6366f1" style={{ padding: 20, height: "100%" }}>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>Health Score</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Ring value={healthScore} size={80} />
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{healthScore}</p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs work"}
                </p>
              </div>
            </div>
          </Glass>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Glass accent="#6366f1" style={{ padding: "18px 24px", height: "100%" }}>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 60%)",
            }} />
            {nextDose ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 20px rgba(99,102,241,0.2)",
                  }}>
                    <i className="ti ti-pill" style={{ fontSize: 22, color: "#818cf8" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 10, padding: "2px 9px", borderRadius: 6,
                        background: "rgba(245,158,11,0.2)", color: "#fbbf24",
                        fontWeight: 700, letterSpacing: "0.05em",
                        boxShadow: "0 0 12px rgba(245,158,11,0.15)",
                      }}>DUE</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Next dose</span>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                      {nextDose.name} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 14 }}>{nextDose.dosage}</span>
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{nextDose.time}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(99,102,241,0.5)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { const i = meds.findIndex(m => !m.taken); if (i !== -1) markTaken(i); }}
                  style={{
                    padding: "12px 26px", borderRadius: 12, fontSize: 13.5,
                    fontWeight: 600, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", flexShrink: 0,
                    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  }}>
                  Mark taken
                </motion.button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-check" style={{ fontSize: 20, color: "#10b981" }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>All doses taken today</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Come back tonight for next dose</p>
                </div>
              </div>
            )}
          </Glass>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Glass accent="#f59e0b" style={{ padding: 20, height: "100%" }}>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Streak</p>
            <div style={{ fontSize: 38, fontWeight: 700, color: "#f59e0b", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4,
              textShadow: "0 0 30px rgba(245,158,11,0.4)" }}>
              {streak}
              <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>days</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div key={i}
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: 0.5 + i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    flex: 1, height: 22, borderRadius: 3,
                    background: i < streak ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.06)",
                    boxShadow: i < streak ? "0 0 8px rgba(245,158,11,0.2)" : "none",
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          </Glass>
        </motion.div>
      </div>

      {/* ── ROW 2: Stats strip ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="pg-r2">
        {[
          { l: "Doses today", v: total > 0 ? `${taken}/${total}` : "—", accent: "#6366f1" },
          { l: "This week", v: `${adherenceData?.week?.filter((w: any) => w.p === 100).length ?? 3}/7 days`, accent: "#10b981" },
          { l: "All time adherence", v: `${adherence}%`, accent: "#8b5cf6" },
          { l: "Stock critical", v: lowStock.length > 0 ? `${lowStock[0].days_left} days` : "OK", accent: "#ef4444", danger: true },
        ].map((s, i) => (
          <Glass key={i} hover accent={s.danger ? "#ef4444" : undefined} style={{ padding: "14px 18px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{s.l}</p>
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: s.danger ? "#ef4444" : "#fff" }}>
              {s.v ?? "OK"}
            </p>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.accent}, transparent)`, opacity: 0.5 }} />
          </Glass>
        ))}
      </motion.div>

      {/* ── ROW 3: Dose timeline ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        <Glass style={{ padding: "16px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>Today's schedule</p>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{taken} of {total} taken</span>
          </div>
          <DoseTimeline meds={meds} />
        </Glass>
      </motion.div>

      {/* ── ROW 4: Main 3-col grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="pg-r4">

        {/* Medicines */}
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Glass style={{ padding: "20px 22px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>Medicines</p>
              <span style={{
                fontSize: 10.5, padding: "3px 10px", borderRadius: 20,
                background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 500,
              }}>{total} active</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meds.map((med, i) => (
                <motion.div key={i} layout
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 14px", borderRadius: 14,
                    background: med.taken ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${med.taken ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: med.taken ? "inset 0 0 20px rgba(16,185,129,0.05)" : "none",
                    transition: "all 0.4s",
                    position: "relative", overflow: "hidden",
                  }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                    background: med.color, borderRadius: "14px 0 0 14px",
                    opacity: med.taken ? 0.4 : 1,
                    boxShadow: `0 0 10px ${med.color}60`,
                  }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginLeft: 8,
                    background: `color-mix(in srgb, ${med.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${med.color} 20%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="ti ti-pill" style={{ fontSize: 16, color: med.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
                      {med.name} <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{med.dosage}</span>
                    </p>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{med.time}</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {med.taken ? (
                      <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(16,185,129,0.3)" }}>
                        <i className="ti ti-check" style={{ fontSize: 14, color: "#10b981" }} />
                      </motion.div>
                    ) : confirming === i ? (
                      <motion.div key="load" style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2].map(d => (
                          <motion.div key={d} animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: d * 0.1 }}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.button key="btn" whileHover={{ scale: 1.05, background: "rgba(99,102,241,0.2)" }} whileTap={{ scale: 0.95 }}
                        onClick={() => markTaken(i)}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.7)", cursor: "pointer",
                          transition: "all 0.2s",
                        }}>
                        Take
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </Glass>
        </motion.div>

        {/* Adherence */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <Glass style={{ padding: "20px 22px", height: "100%" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 20 }}>Adherence</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
              <Ring value={adherence} size={100} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Taken</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: "#10b981", letterSpacing: "-0.02em" }}>{adherenceData?.taken_total ?? 52}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Missed</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", letterSpacing: "-0.02em" }}>{adherenceData?.missed_total ?? 8}</p>
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 -22px 18px" }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>This week</p>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              {weekData.map((day: any, i: number) => {
                const isToday = i === 6;
                const fill = day.p === 100 ? "#10b981" : day.p >= 66 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: "100%", maxWidth: 28, height: 50, borderRadius: 4, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden", border: isToday ? `1px solid ${fill}50` : "none", boxShadow: isToday ? `0 0 12px ${fill}20` : "none" }}>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${day.p}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: fill, opacity: isToday ? 1 : 0.5 }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: isToday ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: isToday ? 600 : 400 }}>{day.d}</span>
                  </div>
                );
              })}
            </div>
          </Glass>
        </motion.div>

        {/* Vitals */}
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.19 }}>
          <Glass style={{ padding: "20px 22px", height: "100%" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 18 }}>Vitals</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {VITALS.map((v, i) => (
                <motion.div key={i} whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className={`ti ${v.icon}`} style={{ fontSize: 15, color: v.ok ? "#10b981" : "#f59e0b" }} />
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{v.value}
                        <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 4 }}>{v.unit}</span>
                      </p>
                      <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{v.label}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "block", fontSize: 10, padding: "2px 8px", borderRadius: 5, marginBottom: 3,
                      background: v.ok ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color: v.ok ? "#10b981" : "#f59e0b",
                    }}>{v.ok ? "Normal" : "Watch"}</span>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)" }}>{v.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Glass>
        </motion.div>
      </div>

      {/* ── ROW 5: Activity + Stock + AI tip + Follow-up ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="pg-r5">

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Glass style={{ padding: "20px 22px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>Activity</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: 10.5, color: "#10b981" }}>Live</span>
              </div>
            </div>
            <ActivityFeed />
          </Glass>
        </motion.div>

        {/* Stock levels */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Glass style={{ padding: "20px 22px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>Stock levels</p>
              {lowStock.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ fontSize: 10.5, color: "#ef4444" }}>Alert</span>
                </div>
              )}
            </div>
            {stockDisplay.map((s: any, i: number) => (
  <StockBar key={i} name={s.name} remaining={s.remaining} total={s.qty ?? s.total} color={s.color} daysLeft={s.days_left} />
))}
            {lowStock.length > 0 && (
              <motion.a href={`https://pharmeasy.in/search/all?name=${lowStock[0].name}`} target="_blank"
                whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(239,68,68,0.3)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "block", textAlign: "center", padding: "10px", borderRadius: 10,
                  fontSize: 13, fontWeight: 500, textDecoration: "none", marginTop: 14,
                  background: "rgba(239,68,68,0.15)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}>
                Reorder {lowStock[0].name}
              </motion.a>
            )}
          </Glass>
        </motion.div>

        {/* AI tip + Follow-up */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26 }}>
            <Glass accent="#8b5cf6" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 13, color: "#a78bfa" }} />
                </div>
                <p style={{ fontSize: 11.5, fontWeight: 500, color: "#a78bfa" }}>AI Health Tip</p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                {AI_TIPS[tipIndex]}
              </p>
            </Glass>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}>
            <Glass style={{ padding: "18px 20px" }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>Next follow-up</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 16px rgba(99,102,241,0.15)",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#818cf8", lineHeight: 1 }}>22</span>
                  <span style={{ fontSize: 8.5, color: "rgba(99,102,241,0.7)", letterSpacing: "0.06em" }}>JUN</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Dr. Priya Mehta</p>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>In 3 days · 10:00 AM</p>
                </div>
              </div>
              <motion.button whileHover={{ background: "rgba(99,102,241,0.2)" }}
                style={{
                  width: "100%", marginTop: 14, padding: "9px", borderRadius: 9, fontSize: 12.5,
                  fontWeight: 500, border: "1px solid rgba(99,102,241,0.2)",
                  background: "rgba(99,102,241,0.1)", color: "#818cf8", cursor: "pointer",
                }}>
                View details →
              </motion.button>
            </Glass>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1200px) {
          .pg-r1 { grid-template-columns: 1fr 1fr !important; }
          .pg-r1 > div:nth-child(2) { grid-column: 1 / -1; order: -1; }
          .pg-r4, .pg-r5 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .pg-r1, .pg-r2, .pg-r4, .pg-r5 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}