"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { MagneticButton } from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "var(--accent-primary)" },
  completed: { label: "Completed", color: "var(--success)" },
  cancelled: { label: "Cancelled", color: "var(--text-muted)" },
  missed: { label: "Missed", color: "var(--danger)" },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function nowLocalInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border-default)", background: "var(--bg-overlay)",
  color: "var(--text-primary)", fontSize: 13.5, fontFamily: "inherit", outline: "none",
};

export default function AppointmentsTab({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [when, setWhen] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);

  const headers = () => ({ Authorization: `Bearer ${authService.getToken()}` });

  const fetchAppointments = () => {
    setLoading(true);
    fetch(`${API}/api/v1/patients/${patientId}/appointments`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  const fetchCalendarStatus = () => {
    fetch(`${API}/api/v1/calendar/status`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setCalendarConnected(!!d.connected))
      .catch(() => setCalendarConnected(null));
  };

  useEffect(() => {
    fetchAppointments();
    fetchCalendarStatus();
  }, [patientId]);

  const connectCalendar = async () => {
    try {
      const res = await fetch(`${API}/api/v1/calendar/connect`, { headers: headers() });
      const data = await res.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
    } catch {
      setError("Could not start Google Calendar connection");
    }
  };

  const handleSubmit = async () => {
    if (!when) {
      setError("Please pick a date and time");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const params = new URLSearchParams({ scheduled_at: new Date(when).toISOString() });
      if (doctor.trim()) params.append("doctor_name", doctor.trim());
      if (notes.trim()) params.append("notes", notes.trim());

      const res = await fetch(`${API}/api/v1/patients/${patientId}/appointments?${params.toString()}`, {
        method: "POST",
        headers: headers(),
      });
      if (!res.ok) throw new Error();

      setWhen(""); setDoctor(""); setNotes("");
      setShowForm(false);
      fetchAppointments();
    } catch {
      setError("Failed to schedule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`${API}/api/v1/appointments/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      fetchAppointments();
    } catch {
      alert("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      {/* Calendar connection strip */}
      {calendarConnected !== null && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "12px 0", marginBottom: 8, borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ti ti-brand-google" style={{ fontSize: 15, color: "var(--text-muted)" }} />
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              {calendarConnected
                ? "Google Calendar connected — new appointments sync automatically"
                : "Connect Google Calendar to sync appointments automatically"}
            </span>
          </div>
          {calendarConnected ? (
            <span style={{ fontSize: 11, color: "var(--success)", fontFamily: "monospace" }}>● connected</span>
          ) : (
            <button onClick={connectCalendar} style={{
              fontSize: 12, padding: "5px 14px", borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--border-default)", background: "transparent",
              color: "var(--text-secondary)", fontFamily: "inherit",
            }}>
              Connect
            </button>
          )}
        </div>
      )}

      {/* Header + schedule button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 16px" }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Appointments</span>
        <MagneticButton variant="primary" onClick={() => setShowForm((s) => !s)} style={{ padding: "8px 16px", fontSize: 12.5 }}>
          <i className={`ti ${showForm ? "ti-x" : "ti-calendar-plus"}`} style={{ fontSize: 14 }} />
          {showForm ? "Close" : "Schedule"}
        </MagneticButton>
      </div>

      {/* Inline schedule form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "18px 0 22px", marginBottom: 8,
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>DATE & TIME</label>
                  <input type="datetime-local" value={when} min={nowLocalInputValue()}
                    onChange={(e) => setWhen(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>DOCTOR</label>
                  <input type="text" value={doctor} placeholder="Dr. Priya Mehta"
                    onChange={(e) => setDoctor(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>NOTES (OPTIONAL)</label>
                <input type="text" value={notes} placeholder="Routine checkup"
                  onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
              </div>
              {error && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{error}</p>}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting}
                style={{
                  padding: "10px 22px", borderRadius: 9, border: "none",
                  background: "var(--accent-gradient)", color: "var(--text-inverse)",
                  fontSize: 13, fontWeight: 600, cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1, fontFamily: "inherit",
                }}>
                {submitting ? "Scheduling..." : "Schedule Appointment"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center" }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>No appointments yet</p>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
            Schedule one and the patient gets automatic reminders
          </p>
        </div>
      ) : (
        appointments.map((a, i) => {
          const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.scheduled;
          return (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              style={{ padding: "16px 0", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {a.doctor_name || "Doctor"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {formatWhen(a.scheduled_at)}{a.notes ? ` · ${a.notes}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {a.google_synced && (
                    <span title="Synced to Google Calendar" style={{ fontSize: 11, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <i className="ti ti-calendar-check" style={{ fontSize: 13 }} /> synced
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: st.color, fontFamily: "monospace" }}>{st.label.toUpperCase()}</span>
                  {a.status === "scheduled" && (
                    <button onClick={() => handleCancel(a.id)} disabled={cancellingId === a.id}
                      style={{
                        fontSize: 11.5, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                        border: "1px solid var(--border-default)", background: "transparent",
                        color: "var(--text-secondary)", fontFamily: "inherit",
                        opacity: cancellingId === a.id ? 0.5 : 1,
                      }}>
                      {cancellingId === a.id ? "..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {a.pre_visit_brief && (
                <div style={{ marginTop: 12, marginLeft: 22 }}>
                  <button onClick={() => setExpandedBrief(expandedBrief === a.id ? null : a.id)}
                    style={{
                      fontSize: 11.5, color: "var(--accent-primary)", background: "transparent",
                      border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                    <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                    AI pre-visit brief {expandedBrief === a.id ? "▴" : "▾"}
                  </button>
                  <AnimatePresence>
                    {expandedBrief === a.id && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 8, maxWidth: 640 }}>
                        {a.pre_visit_brief}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}