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

const VITALS = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", status: "normal", icon: "ti-heart-rate-monitor" },
  { label: "Blood Sugar", value: "142", unit: "mg/dL", status: "warning", icon: "ti-droplet" },
  { label: "Weight", value: "72", unit: "kg", status: "normal", icon: "ti-scale" },
];

function AdherenceRing({ value, size = 180 }: { value: number; size?: number }) {
  const r = size * 0.41;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  const center = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="12" />
        <motion.circle cx={center} cy={center} r={r} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2
      }}>
        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1 }}>
          {value}%
        </motion.span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>adherence</span>
      </div>
    </div>
  );
}

function GlassCard({ children, style, hoverGlow }: { children: React.ReactNode; style?: React.CSSProperties; hoverGlow?: string }) {
  return (
    <motion.div
      whileHover={hoverGlow ? { y: -3, boxShadow: `0 20px 50px ${hoverGlow}` } : undefined}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}>
      {children}
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
      setMedicines(prev => prev.map((m, i) => i === index ? { ...m, taken: true } : m));
      setConfirmingId(null);
    }, 700);
  };

  const takenToday = medicines.filter(m => m.taken).length;
  const totalToday = medicines.length;
  const adherence = 87;
  const streak = 5;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Greeting row */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)" }}>{firstName}</h1>
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 24,
            background: "color-mix(in srgb, #f59e0b 12%, transparent)",
            border: "1px solid color-mix(in srgb, #f59e0b 28%, transparent)",
          }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{streak} day streak</span>
        </motion.div>
      </motion.div>

      {/* Top stat strip */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}
        className="patient-stat-grid">
        {[
          { l: "Doses today", v: `${takenToday}/${totalToday}`, c: "#6366f1", icon: "ti-pill" },
          { l: "This week", v: "91%", c: "#10b981", icon: "ti-trending-up" },
          { l: "Next dose", v: "9:00 PM", c: "#f59e0b", icon: "ti-clock" },
          { l: "Stock alert", v: "2 days", c: "#ef4444", icon: "ti-package" },
        ].map((s, i) => (
          <GlassCard key={i} hoverGlow={`${s.c}18`} style={{ padding: "18px 20px" }}>
            <div style={{
              position: "absolute", top: -24, right: -24, width: 80, height: 80, borderRadius: "50%",
              background: s.c, filter: "blur(28px)", opacity: 0.14
            }} />
            <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.c, marginBottom: 10, display: "block" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginBottom: 2 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{s.l}</div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Main grid: adherence + medicines + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 300px", gap: 18 }} className="patient-main-grid">

        {/* Left — Adherence ring + week chart */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
          <GlassCard style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, height: "100%" }}>
            <div style={{
              position: "absolute", top: -50, left: -50, width: 180, height: 180, borderRadius: "50%",
              background: "var(--accent-primary)", filter: "blur(60px)", opacity: 0.1
            }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", alignSelf: "flex-start" }}>
              Adherence Score
            </div>
            <AdherenceRing value={adherence} />

            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 10, textAlign: "center" }}>
                This week
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                {WEEK_DATA.map((day, i) => {
                  const pct = (day.taken / day.total) * 100;
                  const color = pct === 100 ? "#10b981" : pct >= 66 ? "#f59e0b" : "#ef4444";
                  const isToday = i === 6;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: isToday ? 26 : 20, height: 50, borderRadius: 6,
                        background: "var(--border-subtle)", position: "relative", overflow: "hidden",
                        border: isToday ? `1px solid ${color}` : "none"
                      }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                          transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                          style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: color, borderRadius: 6, opacity: isToday ? 1 : 0.7 }} />
                      </div>
                      <span style={{ fontSize: 9, fontFamily: "monospace", color: isToday ? "var(--accent-primary)" : "var(--text-muted)", fontWeight: isToday ? 600 : 400 }}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              {[{ l: "Taken", v: "52", c: "var(--success)" }, { l: "Missed", v: "8", c: "var(--danger)" }].map((s, i) => (
                <div key={i} style={{ padding: "10px", borderRadius: 12, background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Middle — Today's medicines */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <GlassCard style={{ padding: 22, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Today's Medicines</h2>
              <span style={{
                fontSize: 11, fontFamily: "monospace", padding: "3px 10px", borderRadius: 20,
                background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)", color: "var(--accent-primary)"
              }}>{takenToday}/{totalToday} taken</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {medicines.map((med, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16,
                    background: med.taken ? "color-mix(in srgb, var(--success) 5%, var(--bg-overlay))" : "var(--bg-overlay)",
                    border: `1px solid ${med.taken ? "color-mix(in srgb, var(--success) 18%, transparent)" : "var(--border-subtle)"}`,
                  }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: `color-mix(in srgb, ${med.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${med.color} 25%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <i className="ti ti-pill" style={{ fontSize: 22, color: med.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                      {med.name} {med.dosage}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
                      <i className="ti ti-clock" style={{ fontSize: 12 }} />
                      {med.time}
                    </div>
                  </div>
                  {med.taken ? (
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: "color-mix(in srgb, var(--success) 15%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <i className="ti ti-check" style={{ fontSize: 17, color: "var(--success)" }} />
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirm(i)} disabled={confirmingId === i}
                      style={{
                        padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                        border: "none", cursor: "pointer", background: "var(--accent-gradient)",
                        color: "var(--text-inverse)", flexShrink: 0, opacity: confirmingId === i ? 0.7 : 1
                      }}>
                      {confirmingId === i ? "..." : "Mark Taken ✓"}
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Vitals row inline */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Latest Vitals</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {VITALS.map((v, i) => (
                  <div key={i} style={{ padding: "12px", borderRadius: 12, background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <i className={`ti ${v.icon}`} style={{ fontSize: 16, color: v.status === "normal" ? "var(--success)" : "var(--warning)", marginBottom: 6, display: "block" }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {v.value} <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{v.unit}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{v.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right — Quick actions + stock alert */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <GlassCard style={{
            padding: 18, border: "1px solid color-mix(in srgb, var(--danger) 25%, var(--border-subtle))",
            background: "color-mix(in srgb, var(--danger) 4%, var(--bg-surface))"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: "var(--danger)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>Stock Alert</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
              Your Metformin runs out in <strong style={{ color: "var(--text-primary)" }}>2 days</strong>.
            </p>
            <motion.a href="https://pharmeasy.in/search/all?name=Metformin" target="_blank"
              whileHover={{ scale: 1.02 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                textDecoration: "none", background: "var(--accent-gradient)", color: "var(--text-inverse)"
              }}>
              <i className="ti ti-shopping-cart" style={{ fontSize: 14 }} />
              Reorder Now
            </motion.a>
          </GlassCard>

          <GlassCard style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Upload Prescription", icon: "ti-camera", color: "#6366f1", href: "/patient/prescriptions" },
                { label: "Book Follow-up", icon: "ti-calendar", color: "#f59e0b", href: "/patient/profile" },
                { label: "Health Report", icon: "ti-file-description", color: "#06b6d4", href: "/patient/profile" },
              ].map((action, i) => (
                <motion.a key={i} href={action.href}
                  whileHover={{ x: 3 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12,
                    background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                    textDecoration: "none", cursor: "pointer"
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: `color-mix(in srgb, ${action.color} 15%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <i className={`ti ${action.icon}`} style={{ fontSize: 15, color: action.color }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)" }}>{action.label}</span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: "auto" }} />
                </motion.a>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Next Follow-up
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "color-mix(in srgb, var(--accent-primary) 14%, transparent)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>22</span>
                <span style={{ fontSize: 8, color: "var(--accent-primary)", fontFamily: "monospace" }}>JUN</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Dr. Priya Mehta</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>In 3 days</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
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