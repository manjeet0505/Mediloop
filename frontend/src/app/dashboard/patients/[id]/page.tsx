"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import UploadPrescriptionModal from "@/components/patients/UploadPrescriptionModal";
import {
  EASE,
  CountUp,
  MouseGlow,
  MagneticButton,
  RotatingRingAvatar,
} from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TABS = ["Overview", "Medicines", "Dose History", "Stock", "Prescriptions"];

const MEDICINES = [
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", times: 2, color: "#6366f1" },
  { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "60 days", times: 1, color: "#06b6d4" },
  { name: "Vitamin D3", dosage: "60000IU", frequency: "Once weekly", duration: "8 weeks", times: 1, color: "#10b981" },
];

const VITALS = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", status: "normal", icon: "ti-heart-rate-monitor" },
  { label: "Blood Sugar", value: "142", unit: "mg/dL", status: "warning", icon: "ti-droplet" },
  { label: "Weight", value: "72", unit: "kg", status: "normal", icon: "ti-scale" },
  { label: "SpO2", value: "98", unit: "%", status: "normal", icon: "ti-lungs" },
];

function StatusDot({ status }: { status: string }) {
  const color = status === "normal" ? "var(--success)" : status === "warning" ? "var(--warning)" : "var(--danger)";
  const label = status === "normal" ? "normal" : status === "warning" ? "watch" : "critical";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color, fontFamily: "monospace" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function AdherenceRing({ value }: { value: number }) {
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ position: "relative", width: 118, height: 118 }}>
      <svg width="118" height="118" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="59" cy="59" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
        <motion.circle cx="59" cy="59" r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}><CountUp to={value} />%</span>
        <span style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 2 }}>adherence</span>
      </div>
    </div>
  );
}

/** "Today, 9:00 AM" / "Yesterday, 9:00 PM" / "3 days ago, 8:00 AM" */
function formatDoseDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const dayDiff = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  return `${dayDiff} days ago, ${time}`;
}

function formatTakenTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function PatientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [adherence] = useState(87);

  const [realMedicines, setRealMedicines] = useState<any[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const fetchMedicines = () => {
    const token = authService.getToken();
    if (!token) return;
    setLoadingMedicines(true);
    fetch(`${API}/api/v1/patients/${id}/medicines`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setRealMedicines(Array.isArray(d) ? d : []))
      .catch(() => setRealMedicines([]))
      .finally(() => setLoadingMedicines(false));
  };

 useEffect(() => {
  if (activeTab === "Medicines" || activeTab === "Stock" || activeTab === "Overview") fetchMedicines();
}, [activeTab, id]);

  // ── Dose History — real data ──
  const [doseHistory, setDoseHistory] = useState<any[]>([]);
  const [weekAdherence, setWeekAdherence] = useState<number | null>(null);
  const [loadingDoseHistory, setLoadingDoseHistory] = useState(false);

  const fetchDoseHistory = () => {
    const token = authService.getToken();
    if (!token) return;
    setLoadingDoseHistory(true);
    fetch(`${API}/api/v1/patients/${id}/dose-history?days=14`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        setDoseHistory(Array.isArray(d.history) ? d.history : []);
        setWeekAdherence(typeof d.week_adherence === "number" ? d.week_adherence : null);
      })
      .catch(() => { setDoseHistory([]); setWeekAdherence(null); })
      .finally(() => setLoadingDoseHistory(false));
  };

  useEffect(() => {
  if (activeTab === "Dose History" || activeTab === "Overview") fetchDoseHistory();
}, [activeTab, id]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const fetchPrescriptions = () => {
    const token = authService.getToken();
    if (!token) return;
    setLoadingPrescriptions(true);
    fetch(`${API}/api/v1/prescription/patient/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setPrescriptions(Array.isArray(d) ? d : d.prescriptions || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoadingPrescriptions(false));
  };

  useEffect(() => {
    if (activeTab === "Prescriptions") fetchPrescriptions();
  }, [activeTab, id]);

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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
      <MouseGlow />

      {/* Back link */}
      <motion.a href="/dashboard/patients"
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -3 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text-muted)", textDecoration: "none",
          marginBottom: 22, position: "relative", zIndex: 2,
        }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
        Back to Patients
      </motion.a>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap",
          paddingBottom: 24, marginBottom: 24,
          borderBottom: "1px solid var(--border-subtle)",
          position: "relative", zIndex: 2,
        }}
      >
        <RotatingRingAvatar name={patient.full_name} accent size={64} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {patient.full_name}
            </h1>
            <StatusDot status="normal" />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              patient.phone,
              `Age ${patient.age ?? "—"}`,
              patient.language === "hi" ? "Hindi" : "English",
              `Joined ${new Date(patient.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
            ].map((val, i) => (
              <span key={i} style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{val}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MagneticButton variant="ghost" onClick={() => {}} style={{ padding: "8px 14px", fontSize: 12.5 }}>
            <i className="ti ti-edit" style={{ fontSize: 14 }} />
            Edit
          </MagneticButton>
          <MagneticButton variant="ghost" onClick={() => {}} style={{ padding: "8px 14px", fontSize: 12.5 }}>
            <i className="ti ti-file-description" style={{ fontSize: 14 }} />
            View Report
          </MagneticButton>
          <MagneticButton variant="primary" onClick={() => {}} style={{ padding: "8px 14px", fontSize: 12.5 }}>
            <i className="ti ti-send" style={{ fontSize: 14 }} />
            Send Reminder
          </MagneticButton>
        </div>
      </motion.div>

      {/* ── Tabs (underline style) ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{
          display: "flex", gap: 26, marginBottom: 28,
          borderBottom: "1px solid var(--border-subtle)",
          position: "relative", zIndex: 2,
        }}
      >
        {TABS.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0 0 12px", fontSize: 13.5, fontWeight: activeTab === tab ? 600 : 400,
              border: "none", background: "transparent", cursor: "pointer",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              position: "relative", fontFamily: "inherit",
            }}>
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-underline"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                style={{
                  position: "absolute", left: 0, right: 0, bottom: -1, height: 2,
                  background: "var(--accent-gradient)", borderRadius: 2,
                }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{ position: "relative", zIndex: 2 }}
        >

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>

              {/* Adherence */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                  Adherence Score
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                  <AdherenceRing value={adherence} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { l: "Taken", v: "52", c: "var(--success)" },
                    { l: "Missed", v: "8", c: "var(--danger)" },
                    { l: "Streak", v: "5 days", c: "var(--accent-primary)" },
                    { l: "This week", v: "91%", c: "var(--warning)" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitals */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                  Latest Vitals
                </div>
                <div>
                  {VITALS.map((v, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 0",
                        borderBottom: i < VITALS.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <i className={`ti ${v.icon}`} style={{ fontSize: 14, color: "var(--text-muted)" }} />
                        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{v.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                          {v.value} <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{v.unit}</span>
                        </div>
                        <StatusDot status={v.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick info */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                  Contact Details
                </div>
                <div style={{ marginBottom: 24 }}>
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
                      <i className={`ti ${c.icon}`} style={{ fontSize: 13, color: "var(--text-muted)", width: 14 }} />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.label}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{c.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                  Active Medicines
                </div>
                <div>
                  {MEDICINES.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 0",
                      borderBottom: i < MEDICINES.length - 1 ? "1px solid var(--border-subtle)" : "none"
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>
                          {m.name} {m.dosage}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{m.frequency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MEDICINES TAB ── */}
          {activeTab === "Medicines" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {loadingMedicines ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
                </div>
              ) : realMedicines.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                  <i className="ti ti-pill" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>No active medicines</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                    Upload a prescription to add medicines automatically
                  </p>
                </div>
              ) : (
                realMedicines.map((med, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
                      padding: "16px 0",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: med.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{med.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{med.dosage} · {med.doses_per_day}x/day</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {[
                        { l: "Stock left", v: `${med.remaining}/${med.total}` },
                        { l: "Days left", v: String(med.days_left) },
                        { l: "Adherence 30d", v: `${med.adherence_30d}%` },
                      ].map((s, j) => (
                        <div key={j} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: med.color }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ── DOSE HISTORY TAB — now real data ── */}
          {activeTab === "Dose History" && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingBottom: 14, marginBottom: 4, borderBottom: "1px solid var(--border-subtle)",
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Dose Log</span>
                {weekAdherence !== null && (
                  <span style={{ fontSize: 11.5, color: weekAdherence >= 80 ? "var(--success)" : "var(--warning)", fontFamily: "monospace" }}>
                    {weekAdherence}% this week
                  </span>
                )}
              </div>

              {loadingDoseHistory ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
                </div>
              ) : doseHistory.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                  <i className="ti ti-clipboard-list" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>No dose history yet</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                    History will appear once doses are scheduled and logged
                  </p>
                </div>
              ) : (
                doseHistory.map((dose, i) => (
                  <motion.div key={dose.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.6) }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "13px 0",
                      borderBottom: i < doseHistory.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <i className={`ti ${dose.status === "taken" ? "ti-check" : dose.status === "missed" ? "ti-x" : "ti-clock"}`}
                      style={{
                        fontSize: 14, width: 16, flexShrink: 0,
                        color: dose.status === "taken" ? "var(--success)" : dose.status === "missed" ? "var(--danger)" : "var(--text-muted)",
                      }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                        {dose.medicine_name}{dose.dosage ? ` ${dose.dosage}` : ""}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDoseDate(dose.scheduled_time)}</div>
                    </div>
                    <span style={{
                      fontSize: 11.5, fontFamily: "monospace",
                      color: dose.status === "taken" ? "var(--success)" : dose.status === "missed" ? "var(--danger)" : "var(--text-muted)",
                    }}>
                      {dose.status === "taken" ? formatTakenTime(dose.taken_at) : dose.status === "missed" ? "missed" : "pending"}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ── STOCK TAB ── */}
          {activeTab === "Stock" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
              {loadingMedicines ? (
                <div style={{ textAlign: "center", padding: 40, gridColumn: "1 / -1" }}>
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
                </div>
              ) : realMedicines.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", gridColumn: "1 / -1" }}>
                  <i className="ti ti-box" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>No stock data yet</p>
                </div>
              ) : (
                realMedicines.map((med, i) => {
                  const pct = med.total > 0 ? Math.round((med.remaining / med.total) * 100) : 0;
                  const status = pct > 30 ? "ok" : pct > 15 ? "low" : "critical";
                  const statusColor = status === "ok" ? "var(--success)" : status === "low" ? "var(--warning)" : "var(--danger)";
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{ paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: med.color }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{med.name}</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontFamily: "monospace", color: statusColor }}>{status.toUpperCase()}</span>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{med.remaining} of {med.total} doses</span>
                          <span style={{ fontSize: 11, color: statusColor, fontFamily: "monospace" }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ height: "100%", background: statusColor, borderRadius: 2 }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                        ~{med.days_left} days remaining
                      </div>
                      {status !== "ok" && (
                        <a href={`https://pharmeasy.in/search/all?name=${med.name}`} target="_blank"
                          style={{ fontSize: 12, color: "var(--accent-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-shopping-cart" style={{ fontSize: 13 }} />
                          Reorder on Pharmeasy
                        </a>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* ── PRESCRIPTIONS TAB ── */}
          {activeTab === "Prescriptions" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <MagneticButton variant="primary" onClick={() => setShowUploadModal(true)} style={{ padding: "9px 18px", fontSize: 13 }}>
                  <i className="ti ti-upload" style={{ fontSize: 15 }} />
                  Upload Prescription
                </MagneticButton>
              </div>

              {loadingPrescriptions ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
                </div>
              ) : prescriptions.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                  <i className="ti ti-file-text" style={{ fontSize: 44, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>No prescriptions uploaded yet</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Upload a prescription image to auto-parse medicines</p>
                </div>
              ) : (
                prescriptions.map((rx, i) => (
                  <motion.div key={rx.id || i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ padding: "18px 0", borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                          {rx.doctor_name || "Unknown Doctor"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </div>
                      </div>
                      {rx.safety_flag && (
                        <span style={{ fontSize: 10.5, color: "var(--warning)" }}>⚠ Flagged</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(rx.medications || []).map((m: any, j: number) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 12.5, color: "var(--text-primary)" }}>{m.medicine_name}</span>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{m.dosage} · {m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      <UploadPrescriptionModal
        isOpen={showUploadModal}
        patientId={id}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          fetchPrescriptions();
        }}
      />
    </div>
  );
}