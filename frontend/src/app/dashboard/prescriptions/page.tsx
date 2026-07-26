"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import UploadPrescriptionModal from "@/components/patients/UploadPrescriptionModal";
import {
  EASE,
  CountUp,
  MouseGlow,
  MagneticButton,
  RotatingRingAvatar,
  UnderlineSearch,
} from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ConfidenceBadge({ value }: { value: number }) {
  if (value === undefined || value === null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--danger)";
  return (
    <span style={{
      fontSize: 9.5, padding: "1px 6px", borderRadius: 8,
      fontFamily: "monospace", fontWeight: 500,
      background: `color-mix(in srgb, ${color} 14%, transparent)`,
      color, marginLeft: 6,
    }}>
      {pct}%
    </span>
  );
}

function PatientPickerModal({ isOpen, onClose, onPick }: { isOpen: boolean; onClose: () => void; onPick: (id: string, name: string) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const token = authService.getToken();
    if (!token) return;
    setLoading(true);
    fetch(`${API}/api/v1/patients/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d) ? d : []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420, background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 24, maxHeight: "70vh", display: "flex", flexDirection: "column",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Select Patient</h2>
              <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, marginBottom: 12,
                background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "inherit",
              }} />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 12 }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 12 }}>No patients found</div>
              ) : (
                filtered.map(p => (
                  <motion.button key={p.id} onClick={() => onPick(p.id, p.full_name)}
                    whileHover={{ x: 3, background: "var(--bg-hover)" }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "8px", borderRadius: 8, border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2,
                    }}
                  >
                    <RotatingRingAvatar name={p.full_name} size={30} />
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{p.full_name}</span>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchPrescriptions = () => {
    const token = authService.getToken();
    if (!token) return;
    setLoading(true);
    fetch(`${API}/api/v1/prescription/clinic/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPrescriptions(Array.isArray(d) ? d : []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetchPrescriptions();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = prescriptions.filter(p =>
    p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.doctor_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const flaggedCount = prescriptions.filter(p => p.safety_flag).length;
  const uniqueDoctors = new Set(prescriptions.map(p => p.doctor_name).filter(Boolean)).size;
  const totalMeds = prescriptions.reduce((sum, p) => sum + (p.medications?.length || 0), 0);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
      <MouseGlow />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12, position: "relative", zIndex: 2 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>Prescriptions</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading..." : `${prescriptions.length} prescriptions across all patients`}
          </p>
        </div>
        <MagneticButton variant="primary" onClick={() => setPickerOpen(true)}>
          <i className="ti ti-upload" style={{ fontSize: 15 }} />
          Upload Prescription
        </MagneticButton>
      </motion.div>

      {/* ── Inline stats ── */}
      {!loading && prescriptions.length > 0 && (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          style={{
            display: "flex", gap: 32, marginBottom: 28, paddingBottom: 24,
            borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap", position: "relative", zIndex: 2,
          }}>
          {[
            { label: "total", value: prescriptions.length, color: "var(--text-primary)" },
            { label: "medicines", value: totalMeds, color: "var(--accent-primary)" },
            { label: "doctors", value: uniqueDoctors, color: "var(--success)" },
            { label: "flagged", value: flaggedCount, color: flaggedCount > 0 ? "var(--warning)" : "var(--text-muted)" },
          ].map((s, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>
                <CountUp to={s.value} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Search ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
        style={{ marginBottom: 32, position: "relative", zIndex: 2 }}>
        <UnderlineSearch value={search} onChange={setSearch} placeholder="Search by patient or doctor..." />
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: "60px 0", textAlign: "center" }}>
          <i className="ti ti-file-text" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
            {search ? "No prescriptions match your search" : "No prescriptions uploaded yet"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Upload one to get started</p>
        </motion.div>
      ) : (
        // ── TIMELINE ──
        <div style={{ position: "relative", paddingLeft: 28, zIndex: 2 }}>
          <motion.div
            initial={{ height: 0 }} animate={{ height: "100%" }}
            transition={{ duration: filtered.length * 0.15 + 0.4, ease: EASE }}
            style={{
              position: "absolute", left: 7, top: 6, width: 1.5,
              background: "linear-gradient(to bottom, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 15%, transparent))",
            }}
          />

          <AnimatePresence mode="popLayout">
            {filtered.map((rx, i) => {
              const dotColor = rx.safety_flag ? "var(--warning)" : "var(--accent-primary)";
              return (
                <motion.div
                  key={rx.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                  style={{ position: "relative", paddingBottom: 22, borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none", marginBottom: 22 }}
                >
                  <motion.div
                    animate={rx.safety_flag ? { boxShadow: [`0 0 0px ${dotColor}`, `0 0 8px ${dotColor}`, `0 0 0px ${dotColor}`] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: "absolute", left: -28, top: 4,
                      width: 10, height: 10, borderRadius: "50%",
                      background: dotColor,
                      border: "2px solid var(--bg-page)",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <a href={`/dashboard/patients/${rx.patient_id}`} style={{
                        fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none",
                      }}>
                        {rx.patient_name}
                      </a>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {rx.doctor_name || "Unknown Doctor"} ·{" "}
                        {rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </div>
                    </div>
                    {rx.safety_flag && (
                      <span style={{
                        fontSize: 10.5, color: "var(--warning)", height: "fit-content",
                      }}>
                        ⚠ {rx.safety_note || "Flagged"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(rx.medications || []).map((m: any, j: number) => (
                      <span key={j} style={{
                        fontSize: 12, padding: "5px 10px", borderRadius: 8,
                        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
                        display: "inline-flex", alignItems: "center",
                      }}>
                        {m.medicine_name} <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>{m.dosage}</span>
                        <ConfidenceBadge value={m.confidence} />
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <PatientPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id, name) => { setPickerOpen(false); setUploadTarget({ id, name }); }}
      />

      {uploadTarget && (
        <UploadPrescriptionModal
          isOpen={!!uploadTarget}
          patientId={uploadTarget.id}
          onClose={() => setUploadTarget(null)}
          onSuccess={() => { setUploadTarget(null); fetchPrescriptions(); }}
        />
      )}
    </div>
  );
}