"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { authService } from "@/lib/auth";

const MEDICINES = [
  { name: "Metformin", dosage: "500mg", time: "9:00 AM", taken: true, color: "#6366f1" },
  { name: "Metformin", dosage: "500mg", time: "9:00 PM", taken: false, color: "#6366f1" },
  { name: "Amlodipine", dosage: "5mg", time: "9:00 AM", taken: true, color: "#06b6d4" },
  { name: "Vitamin D3", dosage: "60000IU", time: "weekly · 9:00 AM", taken: true, color: "#10b981" },
];

const WEEK = [
  { d: "M", p: 100 }, { d: "T", p: 67 }, { d: "W", p: 100 },
  { d: "T", p: 33 }, { d: "F", p: 100 }, { d: "S", p: 67 }, { d: "S", p: 67 },
];

const VITALS = [
  { label: "Blood pressure", value: "128/82", unit: "mmHg", ok: true },
  { label: "Blood sugar", value: "142", unit: "mg/dL", ok: false },
  { label: "Weight", value: "72", unit: "kg", ok: true },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.055 } } },
  item: {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  },
};

function Ring({ value, size = 156 }: { value: number; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 30, fontWeight: 600, color: "var(--text-primary)",
          letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {value}<span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 400 }}>%</span>
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 -22px" }} />;
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [meds, setMeds] = useState(MEDICINES);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const adherence = 87;
  const streak = 5;

  useEffect(() => {
    setUser(authService.getUser());
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
  const nextDose = meds.find(m => !m.taken);
  const name = user?.full_name?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show"
      style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Header row ── */}
      <motion.div variants={stagger.item}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.01em" }}>{dateStr}</p>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            {greet}{name ? `, ${name}` : ""}
          </h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 14px", borderRadius: 10,
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
            {[8, 12, 16, 14, 18].map((h, i) => (
              <motion.div key={i}
                initial={{ height: 0 }} animate={{ height: h }}
                transition={{ delay: 0.6 + i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: 3, borderRadius: 2, background: i < streak ? "var(--accent-primary)" : "var(--border-subtle)" }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
            {streak}-day streak
          </span>
        </div>
      </motion.div>

      {/* ── Hero — next dose ── */}
      {nextDose && (
        <motion.div variants={stagger.item}
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 16, padding: "22px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
            position: "relative", overflow: "hidden",
          }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(105deg, color-mix(in srgb, var(--accent-primary) 5%, transparent) 0%, transparent 50%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-primary) 18%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-clock" style={{ fontSize: 20, color: "var(--accent-primary)" }} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.01em" }}>
                Next dose
              </p>
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {nextDose.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{nextDose.dosage}</span>
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{nextDose.time}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const i = meds.findIndex(m => !m.taken);
              if (i !== -1) markTaken(i);
            }}
            style={{
              padding: "11px 22px", borderRadius: 10, fontSize: 13.5,
              fontWeight: 500, border: "none", cursor: "pointer",
              background: "var(--text-primary)", color: "var(--bg-page)",
              flexShrink: 0, position: "relative",
            }}>
            Mark taken
          </motion.button>
        </motion.div>
      )}

      {/* ── Stat strip ── */}
      <motion.div variants={stagger.item}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
        className="patient-stat-grid">
        {[
          { l: "Doses today", v: `${taken}/${total}` },
          { l: "This week", v: "91%" },
          { l: "All time", v: `${adherence}%` },
          { l: "Stock runs out", v: "2 days", danger: true },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ y: -2, transition: { duration: 0.18 } }}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 12, padding: "14px 16px",
            }}>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 7 }}>{s.l}</p>
            <p style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: (s as any).danger ? "var(--danger)" : "var(--text-primary)" }}>
              {s.v}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 268px", gap: 14 }} className="patient-main-grid">

        {/* Left — adherence */}
        <motion.div variants={stagger.item}
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 16, padding: "22px",
          }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>Adherence</p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <Ring value={adherence} />
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "flex-end", marginBottom: 20 }}>
            {WEEK.map((day, i) => {
              const isToday = i === 6;
              const fill = day.p === 100 ? "var(--success)" : day.p >= 66 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ width: "100%", maxWidth: 24, height: 40, borderRadius: 3, background: "var(--border-subtle)", position: "relative", overflow: "hidden" }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${day.p}%` }}
                      transition={{ delay: 0.5 + i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: fill, opacity: isToday ? 1 : 0.5 }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: isToday ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isToday ? 600 : 400 }}>
                    {day.d}
                  </span>
                </div>
              );
            })}
          </div>

          <Divider />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>52</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>taken</p>
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>8</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>missed</p>
            </div>
          </div>
        </motion.div>

        {/* Center — medicines + vitals */}
        <motion.div variants={stagger.item}
          style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: 16, padding: "22px", display: "flex", flexDirection: "column", gap: 0,
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Today's medicines</p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{taken} of {total} taken</p>
          </div>

          <div>
            <AnimatePresence>
              {meds.map((med, i) => (
                <motion.div key={i}
                  layout
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 0",
                    borderBottom: i < meds.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}>
                  <div style={{
                    width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                    background: med.color, opacity: med.taken ? 0.35 : 1,
                    transition: "opacity 0.3s",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                      {med.name}{" "}
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 400 }}>{med.dosage}</span>
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{med.time}</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {med.taken ? (
                      <motion.span key="taken"
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>
                        Taken
                      </motion.span>
                    ) : confirming === i ? (
                      <motion.div key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: "flex", gap: 3 }}>
                        {[0, 1, 2].map(d => (
                          <motion.div key={d}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: d * 0.1 }}
                            style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-muted)" }}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.button key="btn"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                        onClick={() => markTaken(i)}
                        style={{
                          padding: "7px 14px", borderRadius: 8, fontSize: 12.5,
                          fontWeight: 500, border: "1px solid var(--border-default)",
                          background: "transparent", color: "var(--text-secondary)",
                          cursor: "pointer", flexShrink: 0,
                        }}>
                        Mark taken
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Divider />
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Latest vitals</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {VITALS.map((v, i) => (
                <motion.div key={i} whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                  }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                    {v.value} <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 400 }}>{v.unit}</span>
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{v.label}</p>
                  <div style={{
                    display: "inline-block", marginTop: 6,
                    fontSize: 10, padding: "2px 7px", borderRadius: 4,
                    background: v.ok ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--warning) 12%, transparent)",
                    color: v.ok ? "var(--success)" : "var(--warning)",
                  }}>
                    {v.ok ? "Normal" : "Watch"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <motion.div variants={stagger.item}
            style={{
              background: "var(--bg-surface)", borderRadius: 14, padding: 18,
              border: "1px solid color-mix(in srgb, var(--danger) 22%, var(--border-subtle))",
            }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--danger)", marginBottom: 7 }}>
              Stock running low
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 14 }}>
              Metformin runs out in <strong style={{ color: "var(--text-primary)" }}>2 days</strong>.
            </p>
            <motion.a href="https://pharmeasy.in/search/all?name=Metformin" target="_blank"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                display: "block", textAlign: "center", padding: "10px",
                borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: "var(--text-primary)", color: "var(--bg-page)",
                textDecoration: "none",
              }}>
              Reorder
            </motion.a>
          </motion.div>

          <motion.div variants={stagger.item}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 14, padding: 18,
            }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>
              Quick actions
            </p>
            {[
              { l: "Upload prescription", href: "/patient/prescriptions", icon: "ti-upload" },
              { l: "Book follow-up", href: "/patient/profile", icon: "ti-calendar" },
              { l: "Health report", href: "/patient/profile", icon: "ti-file-description" },
            ].map((a, i) => (
              <motion.a key={i} href={a.href}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 2px",
                  borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none",
                  fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
                  gap: 8,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize: 15, color: "var(--text-muted)" }} />
                  {a.l}
                </div>
                <i className="ti ti-arrow-right" style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }} />
              </motion.a>
            ))}
          </motion.div>

          <motion.div variants={stagger.item}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 14, padding: 18,
            }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14 }}>
              Next follow-up
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>22</span>
                <span style={{ fontSize: 8.5, color: "var(--text-muted)", letterSpacing: "0.04em" }}>JUN</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Dr. Priya Mehta</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>In 3 days</p>
              </div>
            </div>
          </motion.div>
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
    </motion.div>
  );
}