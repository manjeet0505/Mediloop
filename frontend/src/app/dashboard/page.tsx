"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";
import AddPatientModal from "@/components/patients/AddPatientModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function StatCard({
  label, value, sub, color, icon, index
}: {
  label: string; value: string | number; sub: string;
  color: string; icon: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12, padding: "20px",
        position: "relative", overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* background glow */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 100, height: 100, borderRadius: "50%",
        background: color, filter: "blur(35px)", opacity: 0.18,
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", marginBottom: 14
      }}>
        <span style={{
          fontSize: 11, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.1em",
          fontFamily: "monospace"
        }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16, color }} />
        </div>
      </div>

      <div style={{
        fontSize: 32, fontWeight: 700, color,
        letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8
      }}>
        {value}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
    </motion.div>
  );
}

function AdherenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 5, background: "var(--border-subtle)",
        borderRadius: 3, overflow: "hidden"
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 3 }}
        />
      </div>
      <span style={{
        fontSize: 11, fontFamily: "monospace",
        color, width: 32, textAlign: "right"
      }}>
        {value}%
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:   { bg: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)" },
    warning:  { bg: "color-mix(in srgb, var(--warning) 12%, transparent)", color: "var(--warning)" },
    critical: { bg: "color-mix(in srgb, var(--danger) 12%, transparent)",  color: "var(--danger)"  },
    new:      { bg: "color-mix(in srgb, var(--accent-primary) 12%, transparent)", color: "var(--accent-primary)" },
  };
  const s = map[status] ?? map.active;
  return (
    <span style={{
      fontSize: 10, padding: "3px 8px", borderRadius: 20,
      fontFamily: "monospace", fontWeight: 500,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}30`,
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
}

function AgentStatusCard({
  name, status, metric, metricLabel, color, index
}: {
  name: string; status: "live" | "building";
  metric: string; metricLabel: string; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.07 }}
      style={{
        padding: "14px", borderRadius: 10,
        background: "var(--bg-overlay)",
        border: `1px solid color-mix(in srgb, ${color} 18%, var(--border-subtle))`,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 10
      }}>
        <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
          {name}
        </span>
        {status === "live" ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--success)", display: "inline-block"
              }}
            />
            <span style={{ fontSize: 9, color: "var(--success)", fontFamily: "monospace" }}>
              LIVE
            </span>
          </span>
        ) : (
          <span style={{
            fontSize: 9, color: "var(--warning)", fontFamily: "monospace",
            padding: "1px 6px", borderRadius: 8,
            background: "color-mix(in srgb, var(--warning) 10%, transparent)"
          }}>
            BUILDING
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 2 }}>
        {metric}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
        {metricLabel}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setNow(new Date().toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }));

    // Small delay to ensure localStorage is ready
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }

      fetchWithAuth(`${API}/api/v1/patients/`, token)
        .then(data => {
          setPatients(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Patient fetch error:", err);
          setError("Could not load patients — check if backend is running");
        })
        .finally(() => setLoading(false));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // derive stats from real data
  const total = patients.length;
  const active = patients.filter(p => p.is_active).length;

  const ALERTS = [
    { title: "Stock Critical", sub: "Metformin · 2 days left", color: "var(--danger)", icon: "ti-package" },
    { title: "3 Missed Doses", sub: "Family escalation triggered", color: "var(--warning)", icon: "ti-bell-off" },
    { title: "Follow-up Due", sub: "Appointment in 3 days", color: "var(--accent-primary)", icon: "ti-calendar" },
  ];

  const AGENTS = [
    { name: "Prescription AI", status: "live" as const, metric: "142", metricLabel: "parses today", color: "#6366f1" },
    { name: "Reminder Agent", status: "live" as const, metric: "48", metricLabel: "sent today", color: "#06b6d4" },
    { name: "Stock Monitor",  status: "live" as const, metric: "3", metricLabel: "alerts active", color: "#10b981" },
    { name: "Health Monitor", status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#f59e0b" },
    { name: "Follow-up AI",   status: "building" as const, metric: "—", metricLabel: "coming soon", color: "#ec4899" },
  ];

  // build patient rows with mock adherence for now
  const patientRows = patients.map((p, i) => ({
    ...p,
    adherence: [94, 72, 45, 88, 91, 67][i % 6],
    stock: ["OK", "Low", "Critical", "OK", "OK", "Low"][i % 6],
    status: ["active", "warning", "critical", "new", "active", "warning"][i % 6],
    lastSeen: ["2m ago", "1h ago", "3h ago", "Just now", "30m ago", "2h ago"][i % 6],
  }));

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12
        }}
      >
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 4
          }}>
            Clinic Overview
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {now} · {AGENTS.filter(a => a.status === "live").length} agents active
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <motion.a
            href="/dashboard/patients"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10, fontSize: 13,
              fontWeight: 500, textDecoration: "none",
              border: "1px solid var(--border-default)",
              background: "var(--bg-overlay)",
              color: "var(--text-secondary)",
            }}
          >
            <i className="ti ti-users" style={{ fontSize: 15 }} />
            All Patients
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 20px color-mix(in srgb, var(--accent-primary) 30%, transparent)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10, fontSize: 13,
              fontWeight: 500, border: "none", cursor: "pointer",
              background: "var(--accent-gradient)",
              color: "var(--text-inverse)",
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
            Add Patient
          </motion.button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12, marginBottom: 24
      }}>
        <StatCard index={0} label="Total Patients" value={loading ? "—" : total}
          sub={`${active} active`} color="#6366f1" icon="ti-users" />
        <StatCard index={1} label="Avg Adherence" value="87%"
          sub="↑ 4% vs last week" color="#10b981" icon="ti-activity" />
        <StatCard index={2} label="Critical Alerts" value={ALERTS.length}
          sub="2 stock · 1 missed" color="#ef4444" icon="ti-alert-triangle" />
        <StatCard index={3} label="Reminders Today" value="48"
          sub="12 pending confirm" color="#f59e0b" icon="ti-bell" />
      </div>

      {/* Main two-column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 16, alignItems: "start"
      }}>

        {/* Left — Patient table */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, overflow: "hidden", marginBottom: 16
            }}
          >
            {/* Table header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-subtle)"
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Patient List
                </span>
                <span style={{
                  marginLeft: 8, fontSize: 11, padding: "2px 8px",
                  borderRadius: 10, fontFamily: "monospace",
                  background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                  color: "var(--accent-primary)"
                }}>
                  {loading ? "…" : total} total
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, fontSize: 11,
                  background: "transparent", cursor: "pointer",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)"
                }}>
                  <i className="ti ti-search" style={{ fontSize: 13 }} />
                  Search
                </button>
                <button style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, fontSize: 11,
                  background: "transparent", cursor: "pointer",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)"
                }}>
                  <i className="ti ti-filter" style={{ fontSize: 13 }} />
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", margin: "0 auto 12px",
                    border: "2px solid var(--border-subtle)",
                    borderTop: "2px solid var(--accent-primary)"
                  }}
                />
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading patients...</p>
              </div>
            ) : error ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 32, color: "var(--danger)", marginBottom: 8, display: "block" }} />
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{error}</p>
              </div>
            ) : patientRows.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <i className="ti ti-users" style={{ fontSize: 40, color: "var(--text-muted)", marginBottom: 12, display: "block" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                  No patients yet
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Add your first patient to get started
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      {["Patient", "Age", "Adherence", "Stock", "Status", "Last Active", ""].map((h, i) => (
                        <th key={i} style={{
                          padding: "10px 20px", textAlign: "left",
                          fontSize: 10, color: "var(--text-muted)",
                          textTransform: "uppercase", letterSpacing: "0.1em",
                          fontFamily: "monospace", fontWeight: 400,
                          whiteSpace: "nowrap"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patientRows.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        style={{
                          borderBottom: i < patientRows.length - 1
                            ? "1px solid var(--border-subtle)" : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                        onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                              background: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
                              border: "1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 600, color: "var(--accent-primary)"
                            }}>
                              {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                                {p.full_name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                                {p.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-secondary)" }}>
                          {p.age ?? "—"}
                        </td>
                        <td style={{ padding: "14px 20px", minWidth: 140 }}>
                          <AdherenceBar value={p.adherence} />
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <StatusPill status={p.stock === "OK" ? "active" : p.stock === "Low" ? "warning" : "critical"} />
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <StatusPill status={p.status} />
                        </td>
                        <td style={{
                          padding: "14px 20px", fontSize: 11,
                          color: "var(--text-muted)", fontFamily: "monospace"
                        }}>
                          {p.lastSeen}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <i className="ti ti-chevron-right"
                            style={{ fontSize: 14, color: "var(--text-muted)" }} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Agent network row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, overflow: "hidden"
            }}
          >
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Agent Network
              </span>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                fontFamily: "monospace",
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                color: "var(--success)"
              }}>
                3 LIVE
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10, padding: 16
            }}>
              {AGENTS.map((a, i) => (
                <AgentStatusCard key={a.name} {...a} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right — Alerts panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Live alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, overflow: "hidden"
            }}
          >
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Live Alerts
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <motion.span
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--danger)", display: "inline-block"
                  }}
                />
                <span style={{ fontSize: 10, color: "var(--danger)", fontFamily: "monospace" }}>
                  {ALERTS.length} ACTIVE
                </span>
              </div>
            </div>
            <div style={{ padding: 10 }}>
              {ALERTS.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ x: 3 }}
                  style={{
                    display: "flex", gap: 10, padding: "10px 8px",
                    borderRadius: 8, cursor: "pointer", marginBottom: 4,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `color-mix(in srgb, ${alert.color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${alert.color} 20%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <i className={`ti ${alert.icon}`} style={{ fontSize: 14, color: alert.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 500,
                      color: "var(--text-primary)", marginBottom: 2
                    }}>
                      {alert.title}
                    </div>
                    <div style={{
                      fontSize: 11, color: "var(--text-muted)",
                      fontFamily: "monospace", whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {alert.sub}
                    </div>
                  </div>
                  <i className="ti ti-chevron-right"
                    style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0, alignSelf: "center" }} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, padding: 16
            }}
          >
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: "var(--text-primary)", marginBottom: 12
            }}>
              Quick Actions
            </div>
            {[
              { label: "Upload Prescription", icon: "ti-file-upload", color: "#6366f1" },
              { label: "Check Stock Levels", icon: "ti-package", color: "#10b981" },
              { label: "Send Bulk Reminder", icon: "ti-send", color: "#06b6d4" },
              { label: "Generate PDF Report", icon: "ti-file-description", color: "#f59e0b" },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", borderRadius: 8, marginBottom: 4,
                  background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", transition: "background 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: `color-mix(in srgb, ${action.color} 12%, transparent)`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <i className={`ti ${action.icon}`} style={{ fontSize: 14, color: action.color }} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {action.label}
                </span>
                <i className="ti ti-arrow-right"
                  style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: "auto" }} />
              </motion.button>
            ))}
          </motion.div>

          {/* System status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, padding: 16
            }}
          >
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: "var(--text-primary)", marginBottom: 12
            }}>
              System Status
            </div>
            {[
              { label: "FastAPI Backend", ok: true },
              { label: "Neon PostgreSQL", ok: true },
              { label: "Upstash Redis", ok: true },
              { label: "WhatsApp API", ok: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none"
              }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: s.ok ? "var(--success)" : "var(--warning)",
                    display: "inline-block"
                  }} />
                  <span style={{
                    fontSize: 10, fontFamily: "monospace",
                    color: s.ok ? "var(--success)" : "var(--warning)"
                  }}>
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