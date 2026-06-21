"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const MEDICINES_TODAY = [
  { name: "Metformin", dosage: "500mg", time: "9:00 AM", taken: true, color: "#6366f1" },
  { name: "Metformin", dosage: "500mg", time: "9:00 PM", taken: false, color: "#6366f1" },
  { name: "Amlodipine", dosage: "5mg", time: "9:00 AM", taken: true, color: "#06b6d4" },
  { name: "Vitamin D3", dosage: "60000IU", time: "9:00 AM · weekly", taken: true, color: "#10b981" },
];

const WEEK_DATA = [
  { day: "M", taken: 3, total: 3 },
  { day: "T", taken: 2, total: 3 },
  { day: "W", taken: 3, total: 3 },
  { day: "T", taken: 1, total: 3 },
  { day: "F", taken: 3, total: 3 },
  { day: "S", taken: 2, total: 3 },
  { day: "S", taken: 2, total: 3 },
];

const VITALS = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", status: "normal" },
  { label: "Blood Sugar", value: "142", unit: "mg/dL", status: "warning" },
  { label: "Weight", value: "72", unit: "kg", status: "normal" },
];

function AdherenceRing({ value, size = 168 }: { value: number; size?: number }) {
  const r = size * 0.42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";
  const center = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
        <motion.circle cx={center} cy={center} r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <span style={{ fontSize: 36, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          {value}<span style={{ fontSize: 18, color: "var(--text-muted)" }}>%</span>
        </span>
        <span style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.04em" }}>ADHERENCE</span>
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
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
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const handleConfirm = (index: number) => {
    setConfirmingId(index);
    setTimeout(() => {
      setMedicines(prev => prev.map((m, i) => i === index ? { ...m, taken: true } : m));
      setConfirmingId(null);
    }, 600);
  };

  const takenToday = medicines.filter(m => m.taken).length;
  const totalToday = medicines.length;
  const adherence = 87;
  const streak = 5;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6, letterSpacing: "0.02em" }}>
            {today}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {greeting}, {firstName}
          </h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                width: 4, height: 14, borderRadius: 2,
                background: i <= streak ? "var(--accent-primary)" : "var(--border-subtle)"
              }} />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{streak}-day streak</span>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="patient-stat-grid">
        {[
          { l: "Doses today", v: `${takenToday}/${totalToday}` },
          { l: "This week", v: "91%" },
          { l: "Next dose", v: "9:00 PM" },
          { l: "Stock runs out", v: "2 days", warn: true },
        ].map((s, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.02em" }}>{s.l}</div>
            <div style={{ fontSize: 21, fontWeight: 600, color: s.warn ? "var(--danger)" : "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 280px", gap: 14 }} className="patient-main-grid">

        {/* Adherence */}
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 18 }}>
            Adherence
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <AdherenceRing value={adherence} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 5, marginBottom: 20 }}>
            {WEEK_DATA.map((day, i) => {
              const pct = (day.taken / day.total) * 100;
              const isToday = i === 6;
              const color = pct === 100 ? "var(--success)" : pct >= 66 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <div style={{
                    width: "100%", maxWidth: 22, height: 36, borderRadius: 4,
                    background: "var(--border-subtle)", position: "relative", overflow: "hidden"
                  }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                      transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: color, opacity: isToday ? 1 : 0.55 }} />
                  </div>
                  <span style={{ fontSize: 10, color: isToday ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isToday ? 600 : 400 }}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>52</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>doses taken</div>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>8</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>missed</div>
            </div>
          </div>
        </Card>

        {/* Medicines */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Today's medicines</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{takenToday} of {totalToday} taken</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {medicines.map((med, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 4px",
                borderBottom: i < medicines.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <div style={{
                  width: 3, height: 32, borderRadius: 2, flexShrink: 0,
                  background: med.color, opacity: med.taken ? 0.4 : 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                    {med.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{med.dosage}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{med.time}</div>
                </div>
                {med.taken ? (
                  <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>Taken</span>
                ) : (
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => handleConfirm(i)} disabled={confirmingId === i}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                      border: "1px solid var(--border-default)", cursor: "pointer",
                      background: "transparent", color: "var(--text-primary)",
                      opacity: confirmingId === i ? 0.5 : 1,
                    }}>
                    {confirmingId === i ? "..." : "Mark taken"}
                  </motion.button>
                )}
              </div>
            ))}
          </div>

          {/* Vitals */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Latest vitals</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {VITALS.map((v, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-overlay)" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                    {v.value} <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 400 }}>{v.unit}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{v.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <Card style={{
            padding: 18,
            borderColor: "color-mix(in srgb, var(--danger) 30%, var(--border-subtle))",
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>
              Stock running low
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
              Metformin runs out in 2 days.
            </p>
            <a href="https://pharmeasy.in/search/all?name=Metformin" target="_blank"
              style={{
                display: "block", textAlign: "center", padding: "9px",
                borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                background: "var(--text-primary)", color: "var(--bg-page)",
                textDecoration: "none",
              }}>
              Reorder
            </a>
          </Card>

          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Quick actions
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Upload prescription", href: "/patient/prescriptions" },
                { label: "Book follow-up", href: "/patient/profile" },
                { label: "Health report", href: "/patient/profile" },
              ].map((a, i) => (
                <a key={i} href={a.href}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 4px",
                    borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none",
                    fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
                  }}>
                  {a.label}
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                </a>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Next follow-up
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: "var(--bg-overlay)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>22</span>
                <span style={{ fontSize: 8.5, color: "var(--text-muted)" }}>JUN</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Dr. Priya Mehta</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>In 3 days</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1100px) {
          .patient-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .patient-stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}