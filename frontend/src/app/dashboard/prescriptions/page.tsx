"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import UploadPrescriptionModal from "@/components/patients/UploadPrescriptionModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                  <button key={p.id} onClick={() => onPick(p.id, p.full_name)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 8px", borderRadius: 8, border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600, color: "var(--accent-primary)", flexShrink: 0,
                    }}>
                      {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{p.full_name}</span>
                  </button>
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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Prescriptions</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {loading ? "Loading..." : `${prescriptions.length} prescriptions across all patients`}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setPickerOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
            borderRadius: 10, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
            background: "var(--accent-gradient)", color: "var(--text-inverse)",
          }}>
          <i className="ti ti-upload" style={{ fontSize: 15 }} />
          Upload Prescription
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          borderRadius: 10, marginBottom: 20, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        }}>
        <i className="ti ti-search" style={{ fontSize: 15, color: "var(--text-muted)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by patient or doctor..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit" }} />
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 60, textAlign: "center" }}>
          <i className="ti ti-file-text" style={{ fontSize: 44, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
            {search ? "No prescriptions match your search" : "No prescriptions uploaded yet"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Upload one to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((rx, i) => (
            <motion.div key={rx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <a href={`/dashboard/patients/${rx.patient_id}`} style={{
                    fontSize: 14, fontWeight: 600, color: "var(--accent-primary)", textDecoration: "none",
                  }}>
                    {rx.patient_name}
                  </a>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {rx.doctor_name || "Unknown Doctor"} ·{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </span>
                  </div>
                </div>
                {rx.safety_flag && (
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 20, height: "fit-content",
                    background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                    color: "var(--warning)", fontFamily: "monospace",
                  }}>
                    ⚠ Flagged
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(rx.medications || []).map((m: any, j: number) => (
                  <span key={j} style={{
                    fontSize: 12, padding: "5px 10px", borderRadius: 8,
                    background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
                  }}>
                    {m.medicine_name} <span style={{ color: "var(--text-muted)" }}>{m.dosage}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
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