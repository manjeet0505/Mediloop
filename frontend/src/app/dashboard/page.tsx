"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";
import AddPatientModal from "@/components/patients/AddPatientModal";
import {
  EASE,
  CountUp,
  MouseGlow,
  TiltCard,
  MagneticButton,
  RotatingRingAvatar,
  GradientHeroNumber,
} from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function AdherenceGauge({ value }: { value: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.3 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 21, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          <CountUp to={value} />%
        </span>
        <span style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 3 }}>adherence</span>
      </div>
    </div>
  );
}

function InlineStat({ label, value, color, index }: { label: string; value: number; color: string; index: number }) {
  return (
    <motion.div key={index}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.06, type: "spring", stiffness: 260, damping: 26 }}
    >
      <div style={{ fontSize: 21, fontWeight: 600, color, letterSpacing: "-0.01em" }}>
        <CountUp to={value} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
    </motion.div>
  );
}

function PatientRow({ p, index }: { p: any; index: number }) {
  const statusColor = p.status === "critical" ? "var(--danger)" : p.status === "warning" ? "var(--warning)" : p.status === "new" ? "var(--accent-primary)" : "var(--success)";
  const adherenceColor = p.adherence >= 80 ? "var(--success)" : p.adherence >= 60 ? "var(--warning)" : "var(--danger)";
  const isLive = p.status === "active" || p.status === "new";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: EASE }}
    >
      <motion.div
        whileHover={{ x: 4, backgroundColor: "var(--bg-hover)" }}
        onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 6px",
          borderBottom: "1px solid var(--border-subtle)",
          cursor: "pointer", borderRadius: 8,
        }}
      >
        <RotatingRingAvatar name={p.full_name} accent={isLive} size={38} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{p.full_name}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10.5, color: statusColor,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
              {p.status}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
            {p.age ? `${p.age} yrs · ` : ""}{p.lastSeen}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, width: 90 }}>
          <div style={{ flex: 1, height: 3, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${p.adherence}%` }}
              transition={{ duration: 0.8, delay: 0.4 + index * 0.05, ease: EASE }}
              style={{ height: "100%", background: adherenceColor, borderRadius: 2 }}
            />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: adherenceColor, width: 28, textAlign: "right", fontFamily: "monospace" }}>
            {p.adherence}%
          </span>
        </div>

        <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0, opacity: 0.5 }} />
      </motion.div>
    </motion.div>
  );
}

function AgentRow({ name, status, metric, metricLabel, color, index }: {
  name: string; status: "live" | "building"; metric: string; metricLabel: string; color: string; index: number;
}) {
  const isLive = status === "live";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.06, duration: 0.4, ease: EASE }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 4px",
        borderBottom: "1px solid var(--border-subtle)",
        opacity: isLive ? 1 : 0.55,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{name}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color, fontFamily: "monospace" }}>{metric}</span>
      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 90, textAlign: "right" }}>{metricLabel}</span>
      {isLive ? (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontSize: 9, color: "var(--success)", fontFamily: "monospace", width: 40, textAlign: "right" }}
        >LIVE</motion.span>
      ) : (
        <span style={{ fontSize: 9, color: "var(--warning)", fontFamily: "monospace", width: 40, textAlign: "right" }}>SOON</span>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
const [alerts, setAlerts] = useState<any[]>([]);
const [agentMetrics, setAgentMetrics] = useState({
  prescriptions_parsed_today: 0,
  reminders_sent_today: 0,
  active_stock_alerts: 0,
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [user, setUser] = useState<any>(null);
const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
  setUser(authService.getUser());
  const timer = setTimeout(() => {
    const token = authService.getToken();
    if (!token) { window.location.href = "/login"; return; }
    fetchWithAuth(`${API}/api/v1/patients/dashboard-summary`, token)
      .then(data => {
        setPatients(Array.isArray(data.patients) ? data.patients : []);
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        setAgentMetrics(data.agent_metrics ?? {
          prescriptions_parsed_today: 0,
          reminders_sent_today: 0,
          active_stock_alerts: 0,
        });
      })
      .catch(() => setError("Could not load dashboard — check if backend is running"))
      .finally(() => setLoading(false));
  }, 100);
  return () => clearTimeout(timer);
}, []);

  const total = patients.length;
  const active = patients.filter(p => p.is_active).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const doctorName = user?.full_name?.split(" ")[0] ?? "";

 const ALERTS = alerts.map(a => ({
  title: a.type === "stock_critical" ? `${a.patient_name} — Stock` : `${a.patient_name} — Missed Doses`,
  sub: a.title,
  color: a.severity === "critical" ? "var(--danger)" : "var(--warning)",
  icon: a.type === "stock_critical" ? "ti-package" : "ti-bell-off",
}));

const AGENTS = [
  { name: "Prescription AI", status: "live" as const, metric: String(agentMetrics.prescriptions_parsed_today), metricLabel: "parses today", color: "#6366f1" },
  { name: "Reminder Agent", status: "live" as const, metric: String(agentMetrics.reminders_sent_today), metricLabel: "sent today", color: "#06b6d4" },
  { name: "Stock Monitor", status: "live" as const, metric: String(agentMetrics.active_stock_alerts), metricLabel: "alerts active", color: "#10b981" },
  { name: "Health Monitor", status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#f59e0b" },
  { name: "Follow-up AI", status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#ec4899" },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "No activity yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const patientRows = patients.map(p => ({
  ...p,
  adherence: p.adherence_7d,
  status: p.status,
  lastSeen: timeAgo(p.last_activity),
}));

  const avgAdherence = patientRows.length
    ? Math.round(patientRows.reduce((s, p) => s + p.adherence, 0) / patientRows.length)
    : 87;
  const liveAgents = AGENTS.filter(a => a.status === "live").length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
      <MouseGlow />

      {/* ── HERO ── */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap", position: "relative", zIndex: 2,
      }}>
        <div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}
          >
            {greet}{doctorName ? `, Dr. ${doctorName}` : ""}
          </motion.p>
          <GradientHeroNumber value={loading ? "—" : total} loading={loading} size={56} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }}
            />
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              patients under your care · {liveAgents} agents active
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <AdherenceGauge value={avgAdherence} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <MagneticButton variant="ghost" onClick={() => window.location.href = "/dashboard/patients"}>
              <i className="ti ti-users" style={{ fontSize: 15 }} />
              All Patients
            </MagneticButton>
            <MagneticButton variant="primary" onClick={() => setModalOpen(true)}>
              <i className="ti ti-plus" style={{ fontSize: 15 }} />
              Add Patient
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      {/* ── INLINE STATS ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          display: "flex", gap: 32, marginTop: 28, marginBottom: 36, paddingBottom: 24,
          borderBottom: "1px solid var(--border-subtle)", position: "relative", zIndex: 2, flexWrap: "wrap",
        }}
      >
        <InlineStat index={0} label="active cases" value={loading ? 0 : active} color="var(--success)" />
        <InlineStat index={1} label="critical alerts" value={ALERTS.length} color="var(--danger)" />
       <InlineStat index={2} label="reminders today" value={agentMetrics.reminders_sent_today} color="var(--warning)" />
        <InlineStat index={3} label="agents live" value={liveAgents} color="var(--accent-primary)" />
      </motion.div>

      {/* ── MAIN TWO COL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 40, alignItems: "start", position: "relative", zIndex: 2 }}>

        <div>
          {/* Patients */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Patients</span>
            <a href="/dashboard/patients" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
              View all →
            </a>
          </div>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
            </div>
          ) : error ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{error}</p>
            </div>
          ) : patientRows.length === 0 ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <i className="ti ti-users" style={{ fontSize: 32, color: "var(--text-muted)", display: "block", marginBottom: 10, opacity: 0.5 }} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No patients yet</p>
            </div>
          ) : (
            patientRows.slice(0, 6).map((p, i) => <PatientRow key={p.id} p={p} index={i} />)
          )}

          {/* Agent network */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "36px 0 6px" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Agent Network</span>
            <span style={{ fontSize: 11, color: "var(--success)", fontFamily: "monospace" }}>{liveAgents} live</span>
          </div>
          <div>
            {AGENTS.map((a, i) => <AgentRow key={a.name} {...a} index={i} />)}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, overflow: "hidden" }}
          >
            <div style={{
              padding: "13px 16px", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Live Alerts</span>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }}
              />
            </div>
            <div style={{ padding: "6px 10px" }}>
              {ALERTS.map((alert, i) => (
                <div key={i} style={{
                  padding: "10px 0", display: "flex", flexDirection: "column", gap: 2,
                  borderBottom: i < ALERTS.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: alert.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{alert.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 11 }}>{alert.sub}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "13px 16px" }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Quick Actions</div>
            {[
              { label: "Upload Prescription", icon: "ti-file-upload", href: "/dashboard/prescriptions" },
              { label: "Check Stock Levels", icon: "ti-package", href: "/dashboard/stock" },
              { label: "Send Bulk Reminder", icon: "ti-send" },
              { label: "Generate PDF Report", icon: "ti-file-description" },
            ].map((action, i) => (
              <motion.a key={i} href={action.href || "#"}
                whileHover={{ x: 3, color: "var(--text-primary)" }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 0", textDecoration: "none", cursor: "pointer",
                  color: "var(--text-secondary)",
                  borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <i className={`ti ${action.icon}`} style={{ fontSize: 13.5, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 12.5 }}>{action.label}</span>
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "13px 16px" }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>System Status</div>
            {[
              { label: "FastAPI Backend", ok: true },
              { label: "Neon PostgreSQL", ok: true },
              { label: "Reminder Scheduler", ok: true },
              { label: "WhatsApp API", ok: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <motion.span
                    animate={s.ok ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: "50%", background: s.ok ? "var(--success)" : "var(--warning)" }}
                  />
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: s.ok ? "var(--success)" : "var(--warning)" }}>
                    {s.ok ? "operational" : "pending"}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newPatient) => setPatients(prev => [newPatient, ...prev])}
      />
    </div>
  );
}