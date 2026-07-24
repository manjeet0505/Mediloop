"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import AddPatientModal from "@/components/patients/AddPatientModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const EASE = [0.16, 1, 0.3, 1] as const;

async function fetchWithAuth(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function CountUp({ to, duration = 1000, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(ease * to);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{decimals ? val.toFixed(decimals) : Math.round(val)}</>;
}

function AdherenceGauge({ value }: { value: number }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
      <svg width="108" height="108" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="7" />
        <motion.circle
          cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
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
        <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          <CountUp to={value} />%
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>adherence</span>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, color, index }: {
  icon: string; label: string; value: string | number; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.07, duration: 0.5, ease: EASE }}
      whileHover={{ y: -3, boxShadow: `0 14px 30px -10px color-mix(in srgb, ${color} 30%, transparent)` }}
      style={{
        flex: 1, minWidth: 150,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14, padding: "16px 18px",
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
        </div>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {typeof value === "number" ? <CountUp to={value} /> : value}
      </div>
    </motion.div>
  );
}

function PatientRow({ p, index }: { p: any; index: number }) {
  const statusColor = p.status === "critical" ? "var(--danger)" : p.status === "warning" ? "var(--warning)" : p.status === "new" ? "var(--accent-primary)" : "var(--success)";
  const adherenceColor = p.adherence >= 80 ? "var(--success)" : p.adherence >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: EASE }}
      whileHover={{ x: 3, backgroundColor: "var(--bg-hover)" }}
      onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px 13px 12px",
        borderLeft: `2.5px solid ${statusColor}`,
        cursor: "pointer", borderRadius: 8,
        marginBottom: 2,
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 25%, transparent), color-mix(in srgb, ${statusColor} 20%, transparent))`,
          border: `1.5px solid color-mix(in srgb, ${statusColor} 35%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "var(--text-primary)",
        }}>
          {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
          {p.full_name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {p.age ? `${p.age} yrs · ` : ""}{p.lastSeen}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 100 }}>
        <div style={{ flex: 1, height: 4, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${p.adherence}%` }}
            transition={{ duration: 0.8, delay: 0.4 + index * 0.05, ease: EASE }}
            style={{ height: "100%", background: adherenceColor, borderRadius: 2 }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: adherenceColor, width: 30, textAlign: "right", fontFamily: "monospace" }}>
          {p.adherence}%
        </span>
      </div>

      <span style={{
        fontSize: 9.5, padding: "3px 8px", borderRadius: 20, fontWeight: 600,
        background: `color-mix(in srgb, ${statusColor} 13%, transparent)`, color: statusColor,
        textTransform: "uppercase", letterSpacing: "0.04em", width: 60, textAlign: "center",
      }}>
        {p.status}
      </span>

      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }} />
    </motion.div>
  );
}

function AgentCard({ name, status, metric, metricLabel, color, index }: {
  name: string; status: "live" | "building"; metric: string; metricLabel: string; color: string; index: number;
}) {
  const isLive = status === "live";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.06, duration: 0.4, ease: EASE }}
      whileHover={isLive ? { y: -3, boxShadow: `0 14px 26px -10px color-mix(in srgb, ${color} 35%, transparent)` } : {}}
      style={{
        position: "relative", padding: "15px", borderRadius: 12, overflow: "hidden",
        background: "var(--bg-overlay)",
        border: `1px solid color-mix(in srgb, ${color} ${isLive ? 25 : 12}%, var(--border-subtle))`,
        opacity: isLive ? 1 : 0.7,
      }}
    >
      {isLive && (
        <motion.div
          animate={{ opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: -20, right: -20, width: 70, height: 70,
            borderRadius: "50%", background: color, filter: "blur(24px)", pointerEvents: "none",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500 }}>{name}</span>
        {isLive ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)" }}
            />
            <span style={{ fontSize: 9, color: "var(--success)", fontFamily: "monospace" }}>LIVE</span>
          </span>
        ) : (
          <span style={{
            fontSize: 8.5, color: "var(--warning)", fontFamily: "monospace",
            padding: "1px 6px", borderRadius: 8,
            background: "color-mix(in srgb, var(--warning) 10%, transparent)",
          }}>SOON</span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2, position: "relative" }}>{metric}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", position: "relative" }}>{metricLabel}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setUser(authService.getUser());
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetchWithAuth(`${API}/api/v1/patients/`, token)
        .then(data => setPatients(Array.isArray(data) ? data : []))
        .catch(() => setError("Could not load patients — check if backend is running"))
        .finally(() => setLoading(false));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const total = patients.length;
  const active = patients.filter(p => p.is_active).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const doctorName = user?.full_name?.split(" ")[0] ?? "";

  const ALERTS = [
    { title: "Stock Critical", sub: "Metformin · 2 days left", color: "var(--danger)", icon: "ti-package" },
    { title: "3 Missed Doses", sub: "Family escalation triggered", color: "var(--warning)", icon: "ti-bell-off" },
    { title: "Follow-up Due", sub: "Appointment in 3 days", color: "var(--accent-primary)", icon: "ti-calendar" },
  ];

  const AGENTS = [
    { name: "Prescription AI", status: "live" as const, metric: "142", metricLabel: "parses today", color: "#6366f1" },
    { name: "Reminder Agent", status: "live" as const, metric: "48", metricLabel: "sent today", color: "#06b6d4" },
    { name: "Stock Monitor", status: "live" as const, metric: "3", metricLabel: "alerts active", color: "#10b981" },
    { name: "Health Monitor", status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#f59e0b" },
    { name: "Follow-up AI", status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#ec4899" },
  ];

  const patientRows = patients.map((p, i) => ({
    ...p,
    adherence: [94, 72, 45, 88, 91, 67][i % 6],
    status: ["active", "warning", "critical", "new", "active", "warning"][i % 6],
    lastSeen: ["2m ago", "1h ago", "3h ago", "Just now", "30m ago", "2h ago"][i % 6],
  }));

  const avgAdherence = patientRows.length
    ? Math.round(patientRows.reduce((s, p) => s + p.adherence, 0) / patientRows.length)
    : 87;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 24, marginBottom: 28, flexWrap: "wrap",
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 18, padding: "26px 30px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", top: -80, right: 120, width: 260, height: 260,
          borderRadius: "50%", background: "var(--accent-gradient)", filter: "blur(90px)", opacity: 0.08,
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
            {greet}{doctorName ? `, Dr. ${doctorName}` : ""}
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 10 }}>
            Here's how your patients are doing
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {AGENTS.filter(a => a.status === "live").length} agents active · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative" }}>
          <AdherenceGauge value={avgAdherence} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <motion.a
              href="/dashboard/patients"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                textDecoration: "none", border: "1px solid var(--border-default)",
                background: "var(--bg-overlay)", color: "var(--text-secondary)",
              }}
            >
              <i className="ti ti-users" style={{ fontSize: 15 }} />
              All Patients
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 24px color-mix(in srgb, var(--accent-primary) 40%, transparent)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: "none", cursor: "pointer",
                background: "var(--accent-gradient)", color: "var(--text-inverse)",
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 15 }} />
              Add Patient
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── STAT CHIPS ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatChip index={0} icon="ti-users" label="Total Patients" value={loading ? 0 : total} color="#6366f1" />
        <StatChip index={1} icon="ti-alert-triangle" label="Critical Alerts" value={ALERTS.length} color="#ef4444" />
        <StatChip index={2} icon="ti-bell" label="Reminders Today" value={48} color="#f59e0b" />
        <StatChip index={3} icon="ti-checkup-list" label="Active Cases" value={loading ? 0 : active} color="#10b981" />
      </div>

      {/* ── MAIN TWO COL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        <div>
          {/* Patient list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 14, overflow: "hidden", marginBottom: 16,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)",
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Patients</span>
              <span style={{
                fontSize: 11, padding: "2px 9px", borderRadius: 10,
                background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                color: "var(--accent-primary)", fontFamily: "monospace",
              }}>
                {loading ? "…" : total}
              </span>
            </div>

            <div style={{ padding: "8px" }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
                </div>
              ) : error ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{error}</p>
                </div>
              ) : patientRows.length === 0 ? (
                <div style={{ padding: 50, textAlign: "center" }}>
                  <i className="ti ti-users" style={{ fontSize: 36, color: "var(--text-muted)", display: "block", marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No patients yet</p>
                </div>
              ) : (
                patientRows.slice(0, 7).map((p, i) => <PatientRow key={p.id} p={p} index={i} />)
              )}
            </div>
          </motion.div>

          {/* Agent network */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 14, overflow: "hidden",
            }}
          >
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Agent Network</span>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)",
                fontFamily: "monospace",
              }}>3 LIVE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, padding: 16 }}>
              {AGENTS.map((a, i) => <AgentCard key={a.name} {...a} index={i} />)}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, overflow: "hidden" }}
          >
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Live Alerts</span>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--danger)" }}
              />
            </div>
            <div style={{ padding: 10 }}>
              {ALERTS.map((alert, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08, duration: 0.4, ease: EASE }}
                  whileHover={{ x: 3, backgroundColor: "var(--bg-hover)" }}
                  style={{
                    display: "flex", gap: 10, padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                    borderLeft: `2px solid ${alert.color}`, marginBottom: 4,
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: `color-mix(in srgb, ${alert.color} 12%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className={`ti ${alert.icon}`} style={{ fontSize: 14, color: alert.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{alert.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{alert.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Quick Actions</div>
            {[
              { label: "Upload Prescription", icon: "ti-file-upload", color: "#6366f1", href: "/dashboard/prescriptions" },
              { label: "Check Stock Levels", icon: "ti-package", color: "#10b981", href: "/dashboard/stock" },
              { label: "Send Bulk Reminder", icon: "ti-send", color: "#06b6d4" },
              { label: "Generate PDF Report", icon: "ti-file-description", color: "#f59e0b" },
            ].map((action, i) => (
              <motion.a key={i} href={action.href || "#"}
                whileHover={{ x: 4, backgroundColor: "var(--bg-hover)" }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 8px", borderRadius: 8, marginBottom: 2,
                  textDecoration: "none", cursor: "pointer",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: `color-mix(in srgb, ${action.color} 12%, transparent)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${action.icon}`} style={{ fontSize: 13, color: action.color }} />
                </div>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{action.label}</span>
                <i className="ti ti-arrow-right" style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }} />
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>System Status</div>
            {[
              { label: "FastAPI Backend", ok: true },
              { label: "Neon PostgreSQL", ok: true },
              { label: "Reminder Scheduler", ok: true },
              { label: "WhatsApp API", ok: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <motion.span
                    animate={s.ok ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: s.ok ? "var(--success)" : "var(--warning)" }}
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