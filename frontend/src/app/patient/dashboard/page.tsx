"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const MEDICINES_TODAY = [
  { name: "Metformin", dosage: "500mg", time: "9:00 AM", taken: true, color: "#6366f1" },
  { name: "Metformin", dosage: "500mg", time: "9:00 PM", taken: false, color: "#6366f1" },
  { name: "Amlodipine", dosage: "5mg", time: "9:00 AM", taken: true, color: "#06b6d4" },
  { name: "Vitamin D3", dosage: "60000IU", time: "9:00 AM (weekly)", taken: true, color: "#10b981" },
];

const WEEK_DATA = [
  { day: "Mon", taken: 3, total: 3 },
  { day: "Tue", taken: 2, total: 3 },
  { day: "Wed", taken: 3, total: 3 },
  { day: "Thu", taken: 1, total: 3 },
  { day: "Fri", taken: 3, total: 3 },
  { day: "Sat", taken: 2, total: 3 },
  { day: "Sun", taken: 2, total: 3 },
];

function AdherenceRing({ value }: { value: number }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 170, height: 170 }}>
      <svg width="170" height="170" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="85" cy="85" r={r} fill="none"
          stroke="var(--border-subtle)" strokeWidth="10" />
        <motion.circle cx="85" cy="85" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}
        >
          {value}%
        </motion.span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
          adherence
        </span>
      </div>
    </div>
  );
}

function StreakBadge({ days }: { days: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 20,
        background: "color-mix(in srgb, #f59e0b 15%, transparent)",
        border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
      }}
    >
      <span style={{ fontSize: 16 }}>🔥</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
        {days} day streak
      </span>
    </motion.div>
  );
}

export default function PatientDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("Good morning");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [medicines, setMedicines] = useState(MEDICINES_TODAY);

  useEffect(() => {
    setUser(authService.getUser());
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleConfirm = (index: number) => {
    setConfirmingId(index);
    setTimeout(() => {
      setMedicines(prev => prev.map((m, i) =>
        i === index ? { ...m, taken: true } : m
      ));
      setConfirmingId(null);
    }, 800);
  };

  const takenToday = medicines.filter(m => m.taken).length;
  const totalToday = medicines.length;
  const adherence = 87;
  const streak = 5;

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>
            {greeting} 👋
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            {firstName}
          </h1>
        </div>
        <StreakBadge days={streak} />
      </motion.div>

      {/* Adherence card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 20, padding: "24px 20px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 16,
          position: "relative", overflow: "hidden"
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 160, height: 160, borderRadius: "50%",
          background: "var(--accent-primary)",
          filter: "blur(60px)", opacity: 0.08,
          pointerEvents: "none"
        }} />

        <AdherenceRing value={adherence} />

        {/* Week bar chart */}
        <div style={{ width: "100%" }}>
          <div style={{
            fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace",
            marginBottom: 10, textAlign: "center"
          }}>
            This week
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", justifyContent: "center" }}>
            {WEEK_DATA.map((day, i) => {
              const pct = (day.taken / day.total) * 100;
              const color = pct === 100 ? "#10b981" : pct >= 66 ? "#f59e0b" : "#ef4444";
              const isToday = i === 6;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 40 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                    style={{
                      width: isToday ? 28 : 22,
                      height: 40,
                      borderRadius: 6,
                      background: "var(--border-subtle)",
                      position: "relative", overflow: "hidden",
                      border: isToday ? `1px solid ${color}` : "none"
                    }}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                      style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: color, borderRadius: 6, opacity: isToday ? 1 : 0.7
                      }}
                    />
                  </motion.div>
                  <span style={{
                    fontSize: 9, fontFamily: "monospace",
                    color: isToday ? "var(--accent-primary)" : "var(--text-muted)",
                    fontWeight: isToday ? 600 : 400
                  }}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Today's medicines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Today's Medicines
          </h2>
          <span style={{
            fontSize: 11, fontFamily: "monospace",
            color: "var(--text-muted)"
          }}>
            {takenToday}/{totalToday} taken
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {medicines.map((med, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 16,
                background: med.taken
                  ? "color-mix(in srgb, var(--success) 6%, var(--bg-surface))"
                  : "var(--bg-surface)",
                border: `1px solid ${med.taken
                  ? "color-mix(in srgb, var(--success) 20%, transparent)"
                  : "var(--border-subtle)"}`,
                opacity: med.taken ? 0.8 : 1,
              }}
            >
              {/* Medicine icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `color-mix(in srgb, ${med.color} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${med.color} 25%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <i className="ti ti-pill" style={{ fontSize: 20, color: med.color }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: "var(--text-primary)", marginBottom: 2
                }}>
                  {med.name} {med.dosage}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)",
                  fontFamily: "monospace", display: "flex",
                  alignItems: "center", gap: 4
                }}>
                  <i className="ti ti-clock" style={{ fontSize: 11 }} />
                  {med.time}
                </div>
              </div>

              {/* Action */}
              {med.taken ? (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "color-mix(in srgb, var(--success) 15%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  <i className="ti ti-check" style={{ fontSize: 16, color: "var(--success)" }} />
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleConfirm(i)}
                  disabled={confirmingId === i}
                  style={{
                    padding: "8px 14px", borderRadius: 10, fontSize: 12,
                    fontWeight: 600, border: "none", cursor: "pointer",
                    background: "var(--accent-gradient)",
                    color: "var(--text-inverse)", flexShrink: 0,
                    opacity: confirmingId === i ? 0.7 : 1
                  }}
                >
                  {confirmingId === i ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block" }}
                    >
                      ↻
                    </motion.span>
                  ) : "Taken ✓"}
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
      >
        {[
          { label: "Next dose", value: "9:00 PM", sub: "Metformin 500mg", icon: "ti-clock", color: "#6366f1" },
          { label: "Stock alert", value: "2 days", sub: "Metformin running low", icon: "ti-package", color: "#ef4444" },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ y: -3 }}
            style={{
              padding: "16px", borderRadius: 16,
              background: "var(--bg-surface)",
              border: `1px solid color-mix(in srgb, ${s.color} 20%, var(--border-subtle))`,
              position: "relative", overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: -20, right: -20, width: 70, height: 70,
              borderRadius: "50%", background: s.color,
              filter: "blur(25px)", opacity: 0.15
            }} />
            <i className={`ti ${s.icon}`} style={{
              fontSize: 20, color: s.color, marginBottom: 8, display: "block"
            }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              {s.sub}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 20, padding: "16px"
        }}
      >
        <h3 style={{
          fontSize: 14, fontWeight: 600,
          color: "var(--text-primary)", marginBottom: 14
        }}>
          Quick Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Upload Prescription", icon: "ti-camera", color: "#6366f1", href: "/patient/prescriptions" },
            { label: "Order Medicine", icon: "ti-shopping-cart", color: "#10b981", href: "https://pharmeasy.in" },
            { label: "Book Follow-up", icon: "ti-calendar", color: "#f59e0b", href: "/patient/profile" },
            { label: "Health Report", icon: "ti-file-description", color: "#06b6d4", href: "/patient/profile" },
          ].map((action, i) => (
            <motion.a
              key={i}
              href={action.href}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 8, padding: "16px 12px", borderRadius: 14,
                background: `color-mix(in srgb, ${action.color} 8%, var(--bg-overlay))`,
                border: `1px solid color-mix(in srgb, ${action.color} 15%, transparent)`,
                textDecoration: "none", cursor: "pointer"
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `color-mix(in srgb, ${action.color} 15%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <i className={`ti ${action.icon}`} style={{ fontSize: 20, color: action.color }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                textAlign: "center", lineHeight: 1.3
              }}>
                {action.label}
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>

    </div>
  );
}