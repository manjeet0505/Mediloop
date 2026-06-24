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
  { label: "SpO2", value: "98", unit: "%", ok: true, trend: "stable", icon: "ti-lungs" },
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
      <div style={{ fontSize: 28, fontWeight: 300, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {time}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{date}</div>
    </div>
  );
}

function GlassPanel({ children, style, accent }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  return (
    <div style={{
      background: "color-mix(in srgb, var(--bg-surface) 80%, transparent)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${accent ? `color-mix(in srgb, ${accent} 20%, var(--border-subtle))` : "var(--border-subtle)"}`,
      borderRadius: 20,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {accent && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
        }} />
      )}
      {children}
    </div>
  );
}

function Ring({ value, size = 120 }: { value: number; size?: number }) {
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
        <span style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function DoseTimeline({ meds }: { meds: any[] }) {
  const slots = [
    { time: "8:00 AM", label: "Morning" },
    { time: "9:00 AM", label: "Morning" },
    { time: "2:00 PM", label: "Afternoon" },
    { time: "9:00 PM", label: "Evening" },
  ];

  return (
    <div style={{ position: "relative", padding: "8px 0" }}>
      <div style={{
        position: "absolute", top: "50%", left: 0, right: 0, height: 1,
        background: "var(--border-subtle)", transform: "translateY(-50%)",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        {slots.map((slot, i) => {
          const med = meds.find(m => m.time === slot.time);
          const status = !med ? "empty" : med.taken ? "taken" : "pending";
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{slot.time}</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: status === "taken"
                    ? "color-mix(in srgb, #10b981 20%, transparent)"
                    : status === "pending"
                    ? "color-mix(in srgb, #6366f1 20%, transparent)"
                    : "var(--bg-overlay)",
                  border: status === "taken"
                    ? "1px solid #10b98150"
                    : status === "pending"
                    ? "1px solid #6366f150"
                    : "1px solid var(--border-subtle)",
                  position: "relative", zIndex: 1,
                }}>
                {status === "taken" && <i className="ti ti-check" style={{ fontSize: 14, color: "#10b981" }} />}
                {status === "pending" && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }}
                  />
                )}
                {status === "empty" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border-subtle)" }} />}
              </motion.div>
              {med && (
                <div style={{ fontSize: 9.5, color: status === "taken" ? "#10b981" : "var(--text-muted)", textAlign: "center", maxWidth: 60 }}>
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

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [greeting, setGreeting] = useState("Good morning");

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>

      {/* ── TOP HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            {name || "Patient"} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>/ Overview</span>
          </h1>
        </div>
        <LiveClock />
      </motion.div>

      {/* ── ROW 1: Health Score + Next Dose + Streak ── */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px", gap: 14 }} className="pg-row1">

        {/* Health Score */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <GlassPanel accent="#6366f1" style={{ padding: 20, height: "100%" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Health Score
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ring value={healthScore} size={80} />
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Overall</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs attention"}
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Next Dose Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <GlassPanel accent="#6366f1" style={{ padding: "18px 24px" }}>
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(135deg, color-mix(in srgb, #6366f1 8%, transparent) 0%, transparent 60%)",
            }} />
            {nextDose ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "color-mix(in srgb, #6366f1 15%, transparent)",
                    border: "1px solid color-mix(in srgb, #6366f1 25%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="ti ti-pill" style={{ fontSize: 22, color: "#6366f1" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 6,
                        background: "color-mix(in srgb, #f59e0b 15%, transparent)",
                        color: "#f59e0b", fontWeight: 600, letterSpacing: "0.04em"
                      }}>DUE</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Next dose</span>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                      {nextDose.name} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 15 }}>{nextDose.dosage}</span>
                    </p>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{nextDose.time}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { const i = meds.findIndex(m => !m.taken); if (i !== -1) markTaken(i); }}
                  style={{
                    padding: "12px 24px", borderRadius: 12, fontSize: 13.5,
                    fontWeight: 600, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
                  }}>
                  Mark taken
                </motion.button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "color-mix(in srgb, #10b981 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-check" style={{ fontSize: 20, color: "#10b981" }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>All doses taken</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Great job today!</p>
                </div>
              </div>
            )}
          </GlassPanel>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <GlassPanel accent="#f59e0b" style={{ padding: 20, height: "100%" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Streak
            </p>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#f59e0b", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>
              {streak}
              <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>days</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div key={i}
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    flex: 1, height: 20, borderRadius: 3,
                    background: i < streak ? "color-mix(in srgb, #f59e0b 60%, transparent)" : "var(--border-subtle)",
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* ── ROW 2: Dose Timeline ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <GlassPanel style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>Today's dose schedule</p>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{taken} of {total} taken</span>
          </div>
          <DoseTimeline meds={meds} />
        </GlassPanel>
      </motion.div>

      {/* ── ROW 3: Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 14 }} className="pg-row3">

        {/* Medicines */}
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <GlassPanel style={{ padding: "20px 22px", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Medicines</p>
              <span style={{
                fontSize: 10.5, padding: "3px 10px", borderRadius: 20,
                background: "color-mix(in srgb, #6366f1 12%, transparent)",
                color: "#6366f1", fontWeight: 500
              }}>{total} active</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meds.map((med, i) => (
                <motion.div key={i}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 14,
                    background: med.taken
                      ? "color-mix(in srgb, #10b981 6%, var(--bg-overlay))"
                      : "var(--bg-overlay)",
                    border: `1px solid ${med.taken ? "color-mix(in srgb, #10b981 15%, transparent)" : "var(--border-subtle)"}`,
                    transition: "all 0.3s",
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `color-mix(in srgb, ${med.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${med.color} 20%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="ti ti-pill" style={{ fontSize: 16, color: med.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                      {med.name} <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 400 }}>{med.dosage}</span>
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{med.time}</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {med.taken ? (
                      <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "color-mix(in srgb, #10b981 15%, transparent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <i className="ti ti-check" style={{ fontSize: 14, color: "#10b981" }} />
                      </motion.div>
                    ) : confirming === i ? (
                      <motion.div key="load" style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2].map(d => (
                          <motion.div key={d} animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: d * 0.1 }}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)" }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.button key="btn"
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => markTaken(i)}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12,
                          fontWeight: 500, border: "1px solid var(--border-default)",
                          background: "transparent", color: "var(--text-secondary)", cursor: "pointer",
                        }}>
                        Take
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Adherence + Week */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <GlassPanel style={{ padding: "20px 22px", height: "100%" }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>Adherence</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <Ring value={adherence} size={100} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Taken</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{adherenceData?.taken_total ?? 52}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Missed</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{adherenceData?.missed_total ?? 8}</p>
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 -22px 18px" }} />
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 12 }}>This week</p>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              {weekData.map((day: any, i: number) => {
                const isToday = i === 6;
                const fill = day.p === 100 ? "#10b981" : day.p >= 66 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: "100%", maxWidth: 28, height: 48, borderRadius: 4, background: "var(--bg-overlay)", position: "relative", overflow: "hidden", border: isToday ? `1px solid ${fill}40` : "none" }}>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${day.p}%` }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: fill, opacity: isToday ? 1 : 0.55 }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: isToday ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isToday ? 600 : 400 }}>
                      {day.d}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Vitals */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.19 }}>
            <GlassPanel style={{ padding: "18px 20px" }}>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14 }}>Vitals</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {VITALS.map((v, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10,
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className={`ti ${v.icon}`} style={{ fontSize: 14, color: v.ok ? "#10b981" : "#f59e0b" }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{v.value}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{v.label}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 5,
                        background: v.ok ? "color-mix(in srgb, #10b981 12%, transparent)" : "color-mix(in srgb, #f59e0b 12%, transparent)",
                        color: v.ok ? "#10b981" : "#f59e0b",
                      }}>{v.ok ? "Normal" : "Watch"}</span>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{v.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Stock */}
          {lowStock.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
              <GlassPanel accent="#ef4444" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>Stock Alert</p>
                </div>
                {lowStock.map((s: any, i: number) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
                      <strong style={{ color: "var(--text-primary)" }}>{s.name}</strong> runs out in {s.days_left} days
                    </p>
                    <motion.a href={`https://pharmeasy.in/search/all?name=${s.name}`} target="_blank"
                      whileHover={{ scale: 1.02 }}
                      style={{
                        display: "block", textAlign: "center", padding: "9px",
                        borderRadius: 9, fontSize: 12.5, fontWeight: 500,
                        background: "#ef4444", color: "#fff", textDecoration: "none",
                      }}>
                      Reorder now
                    </motion.a>
                  </div>
                ))}
              </GlassPanel>
            </motion.div>
          )}

          {/* Follow up */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
            <GlassPanel style={{ padding: "16px 18px" }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Next follow-up</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: "color-mix(in srgb, #6366f1 12%, transparent)",
                  border: "1px solid color-mix(in srgb, #6366f1 20%, transparent)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#6366f1", lineHeight: 1 }}>22</span>
                  <span style={{ fontSize: 8, color: "#6366f1", letterSpacing: "0.06em" }}>JUN</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Dr. Priya Mehta</p>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>In 3 days · 10:00 AM</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1200px) {
          .pg-row3 { grid-template-columns: 1fr 1fr !important; }
          .pg-row3 > div:last-child { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
        @media (max-width: 900px) {
          .pg-row1 { grid-template-columns: 1fr !important; }
          .pg-row3 { grid-template-columns: 1fr !important; }
          .pg-row3 > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}