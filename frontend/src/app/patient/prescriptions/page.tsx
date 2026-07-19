"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";
import UploadPrescriptionModal from "@/components/patients/UploadPrescriptionModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PatientPrescriptionsPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchPrescriptions = async (pid: string) => {
    const token = authService.getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/prescription/patient/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPrescriptions(Array.isArray(data) ? data : data.prescriptions || []);
    } catch (err) {
      console.error(err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    fetch(`${API}/api/v1/patient/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setPatientId(d.patient_id);
        fetchPrescriptions(d.patient_id);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
          Prescriptions
        </h1>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowUploadModal(true)}
          disabled={!patientId}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            border: "none", cursor: patientId ? "pointer" : "default",
            background: patientId ? "var(--accent-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))" : "#1a1a1a",
            color: patientId ? "#fff" : "#555",
          }}>
          <i className="ti ti-upload" style={{ fontSize: 15 }} />
          Upload Prescription
        </motion.button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 28, height: 28, borderRadius: "50%", margin: "0 auto",
              border: "2px solid #1f1f1f", borderTop: "2px solid #6366f1",
            }} />
        </div>
      ) : prescriptions.length === 0 ? (
        <div style={{
          border: "1px solid #1a1a1a", borderRadius: 14, padding: 60, textAlign: "center",
        }}>
          <i className="ti ti-file-text" style={{ fontSize: 44, color: "#333", display: "block", marginBottom: 14 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 4 }}>
            No prescriptions uploaded yet
          </p>
          <p style={{ fontSize: 13, color: "#444" }}>
            Upload a prescription photo and we'll auto-extract your medicines
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {prescriptions.map((rx, i) => (
            <motion.div key={rx.id ?? i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ border: "1px solid #1a1a1a", borderRadius: 14, padding: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8" }}>
                    {rx.doctor_name || "Unknown Doctor"}
                  </div>
                  <div style={{ fontSize: 11, color: "#444" }}>
                    {rx.created_at
                      ? new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : ""}
                  </div>
                </div>
                {rx.safety_flag && (
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 20,
                    background: "#1a1200", color: "#f59e0b",
                  }}>
                    ⚠ Flagged
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(rx.medications || []).map((m: any, j: number) => (
                  <div key={j} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8, background: "#0a0a0a",
                    border: "1px solid #141414",
                  }}>
                    <span style={{ fontSize: 12, color: "#e8e8e8" }}>{m.medicine_name}</span>
                    <span style={{ fontSize: 11, color: "#555" }}>
                      {m.dosage} · {m.frequency}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {patientId && (
        <UploadPrescriptionModal
          isOpen={showUploadModal}
          patientId={patientId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchPrescriptions(patientId);
          }}
        />
      )}
    </div>
  );
}