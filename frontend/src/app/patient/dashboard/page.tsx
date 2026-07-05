"use client";
import { useEffect, useState, useRef } from "react";
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

const WEEK_DEFAULT = [
  { d: "M", p: 100 }, { d: "T", p: 67 }, { d: "W", p: 100 },
  { d: "T", p: 33 }, { d: "F", p: 100 }, { d: "S", p: 67 }, { d: "S", p: 67 },
];

const VITALS = [
  { label: "Blood pressure", value: "128/82", unit: "mmHg", ok: true },
  { label: "Blood sugar", value: "142", unit: "mg/dL", ok: false },
  { label: "Weight", value: "72", unit: "kg", ok: true },
  { label: "SpO2", value: "98", unit: "%", ok: true },
];

const ACTIVITY = [
  { msg: "Metformin 500mg taken", type: "taken", ago: "3h ago" },
  { msg: "Amlodipine 5mg taken", type: "taken", ago: "3h ago" },
  { msg: "Metformin 500mg missed", type: "missed", ago: "1d ago" },
  { msg: "Reminder sent via WhatsApp", type: "reminder", ago: "1d ago" },
  { msg: "Stock alert — Metformin low", type: "alert", ago: "2d ago" },
];

function LiveClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const u = () => {
      const n = new Date();
      setT(n.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    u(); const id = setInterval(u, 1000); return () => clearInterval(id);
  }, []);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{t}</span>;
}

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return; ref.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val}</>;
}

function Divider() {
  return <div style={{ height: 1, background: "#141414", margin: "32px 0" }} />;
}

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "16px 0",
      borderBottom: "1px solid #0f0f0f",
      gap: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [stockData, setStockData] = useState<any[]>([]);

  useEffect(() => {
    setUser(authService.getUser());
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
      } catch (err) { console.error(err); }
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
  const name = user?.full_name?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>

      {/* ── HERO HEADER ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ marginBottom: 56 }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 48,
        }}>
          <div>
            <p style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>{greet}</p>
            <h1 style={{
              fontSize: 42, fontWeight: 700, color: "#fff",
              letterSpacing: "-0.04em", lineHeight: 1,
            }}>
              {name || "Patient"}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 36, fontWeight: 300, color: "#fff",
              letterSpacing: "-0.04em", lineHeight: 1,
            }}>
              <LiveClock />
            </div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
        </div>

        {/* Next dose strip */}
        {nextDose && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 0", borderTop: "1px solid #1a1a1a",
              borderBottom: "1px solid #1a1a1a",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 20,
                background: "#1a1200", color: "#f59e0b",
                border: "1px solid #2a1f00", fontWeight: 700, letterSpacing: "0.06em",
              }}>DUE NOW</span>
              <div>
                <span style={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                  {nextDose.name}
                </span>
                <span style={{ fontSize: 15, color: "#444", marginLeft: 8 }}>{nextDose.dosage}</span>
              </div>
              <span style={{ fontSize: 13, color: "#444" }}>{nextDose.time}</span>
            </div>
            <motion.button
              whileHover={{ background: "#fff", color: "#000" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { const i = meds.findIndex(m => !m.taken); if (i !== -1) markTaken(i); }}
              style={{
                padding: "9px 20px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, border: "1px solid #2a2a2a",
                background: "transparent", color: "#888", cursor: "pointer",
                transition: "all 0.15s", fontFamily: "inherit",
              }}>
              Mark taken →
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* ── STATS ROW ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, marginBottom: 56 }}>
        {[
          { label: "Doses today", value: total > 0 ? `${taken}/${total}` : "0/3", color: "#fff" },
          { label: "Streak", value: streak, suffix: " days", color: "#fff" },
          { label: "Adherence", value: adherence, suffix: "%", color: "#fff" },
          { label: "Stock alert", value: lowStock[0]?.days_left ?? "—", suffix: lowStock.length > 0 ? " days" : "", color: lowStock.length > 0 ? "#ef4444" : "#fff" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "0 0 0 32px",
            borderLeft: i === 0 ? "none" : "1px solid #141414",
            paddingLeft: i === 0 ? 0 : 32,
          }}>
            <div style={{ fontSize: 11, color: "#444", marginBottom: 10, letterSpacing: "0.02em" }}>{s.label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {typeof s.value === "number" ? <CountUp to={s.value} /> : s.value}
              {s.suffix && <span style={{ fontSize: 18, fontWeight: 400, color: i === 3 && lowStock.length > 0 ? "#ef4444" : "#333" }}>{s.suffix}</span>}
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── MAIN TWO COL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 64 }}>

        {/* LEFT */}
        <div>

          {/* Medicines section */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em" }}>
                TODAY'S MEDICINES
              </h2>
              <span style={{ fontSize: 12, color: "#333" }}>{taken} of {total || 3} taken</span>
            </div>

            {meds.length === 0 ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: 56, background: "#0a0a0a", borderRadius: 8, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
              ))
            ) : meds.map((med, i) => (
              <motion.div key={i} layout
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid #0f0f0f",
                  opacity: med.taken ? 0.4 : 1,
                  transition: "opacity 0.3s",
                }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: med.taken ? "#2a2a2a" : med.color,
                  flexShrink: 0,
                  boxShadow: med.taken ? "none" : `0 0 8px ${med.color}`,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: med.taken ? "#444" : "#e8e8e8" }}>
                    {med.name}
                  </span>
                  <span style={{ fontSize: 13, color: "#444", marginLeft: 8 }}>{med.dosage}</span>
                </div>
                <span style={{ fontSize: 12, color: "#333" }}>{med.time}</span>
                <AnimatePresence mode="wait">
                  {med.taken ? (
                    <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ fontSize: 12, color: "#2a5a3a", fontWeight: 500, minWidth: 80, textAlign: "right" }}>
                      Taken
                    </motion.span>
                  ) : confirming === i ? (
                    <motion.div key="load" style={{ display: "flex", gap: 3, minWidth: 80, justifyContent: "flex-end" }}>
                      {[0, 1, 2].map(d => (
                        <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                          style={{ width: 4, height: 4, borderRadius: "50%", background: "#444" }} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.button key="btn"
                      whileHover={{ color: "#fff", borderColor: "#444" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markTaken(i)}
                      style={{
                        padding: "5px 14px", borderRadius: 6, fontSize: 12,
                        border: "1px solid #222", background: "transparent",
                        color: "#555", cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.15s", minWidth: 80,
                      }}>
                      Take
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          <Divider />

          {/* Week chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
            <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 24 }}>
              THIS WEEK
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 64 }}>
              {weekData.map((day: any, i: number) => {
                const isToday = i === 6;
                const color = day.p === 100 ? "#10b981" : day.p >= 66 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: "100%", maxWidth: 32, height: 48, background: "#0a0a0a", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${day.p}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: color, opacity: isToday ? 1 : 0.4 }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: isToday ? "#fff" : "#333", fontWeight: isToday ? 600 : 400 }}>
                      {day.d}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <Divider />

          {/* Activity */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}>
            <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
              RECENT ACTIVITY
            </h2>
            {ACTIVITY.map((item, i) => (
              <Row key={i}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: item.type === "taken" ? "#10b981" : item.type === "missed" ? "#ef4444" : item.type === "alert" ? "#f59e0b" : "#6366f1",
                }} />
                <span style={{ fontSize: 13, color: "#888", flex: 1 }}>{item.msg}</span>
                <span style={{ fontSize: 11, color: "#333" }}>{item.ago}</span>
              </Row>
            ))}
          </motion.div>
        </div>

        {/* RIGHT */}
        <div>

          {/* Adherence */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
              ADHERENCE
            </h2>
           <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 8 }}>
  <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
    <circle cx="36" cy="36" r="30" fill="none" stroke="#141414" strokeWidth="5" />
    <motion.circle
      cx="36" cy="36" r="30" fill="none"
      stroke={adherence >= 80 ? "#10b981" : "#f59e0b"}
      strokeWidth="5" strokeLinecap="round"
      strokeDasharray={2 * Math.PI * 30}
      initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
      animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - adherence / 100) }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      transform="rotate(-90 36 36)"
    />
  </svg>
  <div style={{ fontSize: 44, fontWeight: 700, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>
    <CountUp to={adherence} /><span style={{ fontSize: 22, color: "#333", fontWeight: 400 }}>%</span>
  </div>
</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 20 }}>
              {adherenceData?.taken_total ?? 52} taken · {adherenceData?.missed_total ?? 8} missed
            </div>
            {/* Thin progress bar */}
            <div style={{ height: 2, background: "#141414", borderRadius: 1, overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${adherence}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                style={{ height: "100%", background: adherence >= 80 ? "#10b981" : "#f59e0b", borderRadius: 1 }}
              />
            </div>
          </motion.div>

          {/* Vitals */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.21 }}
            style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
              VITALS
            </h2>
            {VITALS.map((v, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: "1px solid #0f0f0f",
              }}>
                <span style={{ fontSize: 12, color: "#444" }}>{v.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>
                    {v.value} <span style={{ fontSize: 11, color: "#333", fontWeight: 400 }}>{v.unit}</span>
                  </span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4,
                    background: v.ok ? "#0a1a0f" : "#1a0f00",
                    color: v.ok ? "#10b981" : "#f59e0b",
                    border: `1px solid ${v.ok ? "#0f2a18" : "#2a1800"}`,
                  }}>{v.ok ? "Normal" : "Watch"}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Stock */}
          {lowStock.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
              style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
                STOCK ALERT
              </h2>
              {lowStock.map((s: any, i: number) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>{s.name}</span>
                    <span style={{ fontSize: 13, color: "#ef4444" }}>{s.days_left} days left</span>
                  </div>
                  <div style={{ height: 2, background: "#141414", borderRadius: 1, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{
                      height: "100%", borderRadius: 1,
                      width: `${Math.round((s.remaining / (s.total ?? 60)) * 100)}%`,
                      background: "#ef4444",
                    }} />
                  </div>
                  <a href={`https://pharmeasy.in/search/all?name=${s.name}`} target="_blank"
                    style={{
                      fontSize: 12, color: "#555", textDecoration: "none",
                      borderBottom: "1px solid #222", paddingBottom: 1,
                    }}>
                    Reorder on Pharmeasy →
                  </a>
                </div>
              ))}
            </motion.div>
          )}

          {/* Follow up */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.27 }}>
            <h2 style={{ fontSize: 13, color: "#666", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 20 }}>
              NEXT APPOINTMENT
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                border: "1px solid #1a1a1a",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>22</span>
                <span style={{ fontSize: 8, color: "#444", letterSpacing: "0.06em", marginTop: 1 }}>JUN</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e8e8e8" }}>Dr. Priya Mehta</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>In 3 days · 10:00 AM</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @media (max-width: 768px) {
          .pg-main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}