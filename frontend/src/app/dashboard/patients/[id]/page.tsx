"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TABS = ["Overview", "Medicines", "Dose History", "Stock", "Prescriptions"];

const MEDICINES = [
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", times: 2, color: "#6366f1" },
  { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "60 days", times: 1, color: "#06b6d4" },
  { name: "Vitamin D3", dosage: "60000IU", frequency: "Once weekly", duration: "8 weeks", times: 1, color: "#10b981" },
];

const DOSE_HISTORY = [
  { date: "Today, 9:00 AM", medicine: "Metformin 500mg", status: "taken", time: "9:03 AM" },
  { date: "Today, 9:00 AM", medicine: "Amlodipine 5mg", status: "taken", time: "9:03 AM" },
  { date: "Yesterday, 9:00 PM", medicine: "Metformin 500mg", status: "missed", time: null },
  { date: "Yesterday, 9:00 AM", medicine: "Metformin 500mg", status: "taken", time: "9:15 AM" },
  { date: "Yesterday, 9:00 AM", medicine: "Amlodipine 5mg", status: "taken", time: "9:15 AM" },
  { date: "2 days ago, 9:00 AM", medicine: "Metformin 500mg", status: "taken", time: "8:58 AM" },
];

const VITALS = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", status: "normal", icon: "ti-heart-rate-monitor" },
  { label: "Blood Sugar", value: "142", unit: "mg/dL", status: "warning", icon: "ti-droplet" },
  { label: "Weight", value: "72", unit: "kg", status: "normal", icon: "ti-scale" },
  { label: "SpO2", value: "98", unit: "%", status: "normal", icon: "ti-lungs" },
];

function StatBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    normal:   { bg: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)", label: "Normal" },
    warning:  { bg: "color-mix(in srgb, var(--warning) 12%, transparent)", color: "var(--warning)", label: "Watch" },
    critical: { bg: "color-mix(in srgb, var(--danger) 12%, transparent)",  color: "var(--danger)",  label: "Critical" },
  };
  const s = map[status] ?? map.normal;
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 20,
      fontFamily: "monospace", fontWeight: 500,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}30`,
    }}>
      {s.label}
    </span>
  );
}

function AdherenceRing({ value }: { value: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none"
          stroke="var(--border-subtle)" strokeWidth="8" />
        <motion.circle cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 26, fontWeight: 700, color }}>{value}%</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
          adherence
        </span>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [adherence] = useState(87);

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetch(`${API}/api/v1/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setPatient(d))
        .catch(() => setPatient(null))
        .finally(() => setLoading(false));
    }, 100);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <motion.div animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid var(--border-subtle)",
          borderTop: "2px solid var(--accent-primary)"
        }} />
    </div>
  );

  if (!patient) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <i className="ti ti-user-off" style={{ fontSize: 48, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
      <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Patient not found</p>
      <motion.a href="/dashboard/patients" whileHover={{ scale: 1.03 }}
        style={{
          display: "inline-block", marginTop: 16, padding: "8px 20px",
          borderRadius: 10, fontSize: 13, textDecoration: "none",
          background: "var(--accent-gradient)", color: "var(--text-inverse)"
        }}>
        ← Back to Patients
      </motion.a>
    </div>
  );

  const initials = patient.full_name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* Back button */}
      <motion.a href="/dashboard/patients"
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -3 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text-muted)", textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
        Back to Patients
      </motion.a>

      {/* Patient header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16, padding: "24px 28px",
          marginBottom: 20, position: "relative", overflow: "hidden"
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 200, height: 200,
          borderRadius: "50%", background: "var(--accent-primary)",
          filter: "blur(80px)", opacity: 0.06, pointerEvents: "none"
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
              border: "2px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "var(--accent-primary)"
            }}>
              {initials}
            </div>
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 14, height: 14, borderRadius: "50%",
              background: "var(--success)",
              border: "2px solid var(--bg-surface)"
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
                {patient.full_name}
              </h1>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 20,
                fontFamily: "monospace", fontWeight: 500,
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                color: "var(--success)",
                border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)"
              }}>
                ACTIVE
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { icon: "ti-phone", val: patient.phone },
                { icon: "ti-calendar", val: `Age ${patient.age ?? "—"}` },
                { icon: "ti-world", val: patient.language === "hi" ? "Hindi" : "English" },
                { icon: "ti-clock", val: `Joined ${new Date(patient.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 13, color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Send Reminder", icon: "ti-send", color: "#6366f1" },
              { label: "View Report", icon: "ti-file-description", color: "#10b981" },
              { label: "Edit", icon: "ti-edit", color: "var(--text-muted)" },
            ].map((btn, i) => (
              <motion.button key={i}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10, fontSize: 12,
                  fontWeight: 500, border: "1px solid var(--border-subtle)",
                  background: i === 0 ? "var(--accent-gradient)" : "var(--bg-overlay)",
                  color: i === 0 ? "var(--text-inverse)" : "var(--text-secondary)",
                  cursor: "pointer"
                }}>
                <i className={`ti ${btn.icon}`} style={{ fontSize: 14 }} />
                {btn.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12, padding: 4,
          width: "fit-content"
        }}
      >
        {TABS.map(tab => (
          <motion.button key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            style={{
              padding: "7px 16px", borderRadius: 9, fontSize: 13,
              fontWeight: activeTab === tab ? 500 : 400,
              border: "none", cursor: "pointer",
              background: activeTab === tab
                ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                : "transparent",
              color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
              transition: "all 0.2s",
            }}>
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

              {/* Adherence ring */}
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 14, padding: 24, display: "flex",
                flexDirection: "column", alignItems: "center", gap: 16
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", alignSelf: "flex-start" }}>
                  Adherence Score
                </div>
                <AdherenceRing value={adherence} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                  {[
                    { l: "Taken", v: "52", c: "var(--success)" },
                    { l: "Missed", v: "8", c: "var(--danger)" },
                    { l: "Streak", v: "5 days", c: "var(--accent-primary)" },
                    { l: "This week", v: "91%", c: "var(--warning)" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: "8px 10px", borderRadius: 8,
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-subtle)"
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitals */}
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 14, padding: 24
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 16 }}>
                  Latest Vitals
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {VITALS.map((v, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px", borderRadius: 10,
                        background: "var(--bg-overlay)",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: v.status === "normal"
                            ? "color-mix(in srgb, var(--success) 12%, transparent)"
                            : "color-mix(in srgb, var(--warning) 12%, transparent)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <i className={`ti ${v.icon}`} style={{
                            fontSize: 14,
                            color: v.status === "normal" ? "var(--success)" : "var(--warning)"
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                          {v.value} <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{v.unit}</span>
                        </div>
                        <StatBadge status={v.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 14, padding: 20
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14 }}>
                    Contact Details
                  </div>
                  {[
                    { icon: "ti-phone", label: "Patient", val: patient.phone },
                    { icon: "ti-users", label: "Family", val: patient.family_phone ?? "Not set" },
                    { icon: "ti-stethoscope", label: "Doctor", val: patient.doctor_phone ?? "Not set" },
                  ].map((c, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 0",
                      borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none"
                    }}>
                      <i className={`ti ${c.icon}`} style={{ fontSize: 14, color: "var(--accent-primary)", width: 16 }} />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                  borderRadius: 14, padding: 20
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14 }}>
                    Active Medicines
                  </div>
                  {MEDICINES.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 0",
                      borderBottom: i < MEDICINES.length - 1 ? "1px solid var(--border-subtle)" : "none"
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: m.color, flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                          {m.name} {m.dosage}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {m.frequency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MEDICINES TAB ── */}
          {activeTab === "Medicines" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MEDICINES.map((med, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: "var(--bg-surface)",
                    border: `1px solid color-mix(in srgb, ${med.color} 20%, var(--border-subtle))`,
                    borderRadius: 14, padding: "20px 24px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 20, flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `color-mix(in srgb, ${med.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${med.color} 25%, transparent)`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <i className="ti ti-pill" style={{ fontSize: 20, color: med.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                        {med.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {med.dosage} · {med.frequency} · {med.duration}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { l: "Dosage", v: med.dosage },
                      { l: "Times/day", v: String(med.times) },
                      { l: "Duration", v: med.duration },
                    ].map((s, j) => (
                      <div key={j} style={{
                        padding: "8px 14px", borderRadius: 10, textAlign: "center",
                        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)"
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: med.color }}>{s.v}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{s.l}</div>
                      </div>
                    ))}
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{
                        padding: "8px 14px", borderRadius: 10, fontSize: 12,
                        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)", cursor: "pointer"
                      }}>
                      <i className="ti ti-edit" style={{ fontSize: 13 }} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "14px", borderRadius: 14, fontSize: 13,
                  border: "1px dashed var(--border-default)", background: "transparent",
                  color: "var(--accent-primary)", cursor: "pointer", width: "100%"
                }}>
                <i className="ti ti-plus" style={{ fontSize: 16 }} />
                Add Medicine
              </motion.button>
            </div>
          )}

          {/* ── DOSE HISTORY TAB ── */}
          {activeTab === "Dose History" && (
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14, overflow: "hidden"
            }}>
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Dose Log</span>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 10,
                  fontFamily: "monospace",
                  background: "color-mix(in srgb, var(--success) 12%, transparent)",
                  color: "var(--success)"
                }}>87% this week</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {DOSE_HISTORY.map((dose, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 20px",
                      borderBottom: i < DOSE_HISTORY.length - 1 ? "1px solid var(--border-subtle)" : "none"
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: dose.status === "taken"
                        ? "color-mix(in srgb, var(--success) 12%, transparent)"
                        : "color-mix(in srgb, var(--danger) 12%, transparent)",
                    }}>
                      <i className={`ti ${dose.status === "taken" ? "ti-check" : "ti-x"}`}
                        style={{
                          fontSize: 14,
                          color: dose.status === "taken" ? "var(--success)" : "var(--danger)"
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                        {dose.medicine}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {dose.date}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 20,
                        fontFamily: "monospace", fontWeight: 500,
                        background: dose.status === "taken"
                          ? "color-mix(in srgb, var(--success) 12%, transparent)"
                          : "color-mix(in srgb, var(--danger) 12%, transparent)",
                        color: dose.status === "taken" ? "var(--success)" : "var(--danger)",
                      }}>
                        {dose.status === "taken" ? `✓ ${dose.time}` : "✗ missed"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── STOCK TAB ── */}
          {activeTab === "Stock" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {MEDICINES.map((med, i) => {
                const remaining = [10, 45, 6][i];
                const total = [60, 60, 8][i];
                const pct = Math.round((remaining / total) * 100);
                const status = pct > 30 ? "ok" : pct > 15 ? "low" : "critical";
                const statusColor = status === "ok" ? "var(--success)" : status === "low" ? "var(--warning)" : "var(--danger)";
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      background: "var(--bg-surface)",
                      border: `1px solid color-mix(in srgb, ${statusColor} 20%, var(--border-subtle))`,
                      borderRadius: 14, padding: 20
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: med.color }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                          {med.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        fontFamily: "monospace",
                        background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                        color: statusColor
                      }}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {remaining} of {total} doses
                        </span>
                        <span style={{ fontSize: 11, color: statusColor, fontFamily: "monospace" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "var(--border-subtle)", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ height: "100%", background: statusColor, borderRadius: 3 }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 12 }}>
                      ~{Math.floor(remaining / med.times)} days remaining
                    </div>
                    {status !== "ok" && (
                      <motion.a
                        href={`https://pharmeasy.in/search/all?name=${med.name}`}
                        target="_blank"
                        whileHover={{ scale: 1.02 }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 6, padding: "8px", borderRadius: 10, fontSize: 12,
                          textDecoration: "none", fontWeight: 500,
                          background: "var(--accent-gradient)", color: "var(--text-inverse)"
                        }}>
                        <i className="ti ti-shopping-cart" style={{ fontSize: 13 }} />
                        Reorder on Pharmeasy
                      </motion.a>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── PRESCRIPTIONS TAB ── */}
          {activeTab === "Prescriptions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
                borderRadius: 14, padding: 48, textAlign: "center"
              }}>
                <i className="ti ti-file-text" style={{ fontSize: 48, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                  No prescriptions uploaded yet
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                  Upload a prescription image to auto-parse medicines
                </p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: "none", cursor: "pointer",
                    background: "var(--accent-gradient)", color: "var(--text-inverse)"
                  }}>
                  <i className="ti ti-upload" style={{ fontSize: 15 }} />
                  Upload Prescription
                </motion.button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}