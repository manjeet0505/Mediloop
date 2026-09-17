"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const VITAL_META: Record<string, { label: string; unit: string; icon: string }> = {
  bp: { label: "Blood Pressure", unit: "mmHg", icon: "ti-heart-rate-monitor" },
  blood_sugar: { label: "Blood Sugar", unit: "mg/dL", icon: "ti-droplet" },
  weight: { label: "Weight", unit: "kg", icon: "ti-weight" },
  spo2: { label: "SpO2", unit: "%", icon: "ti-lungs" },
  heart_rate: { label: "Heart Rate", unit: "bpm", icon: "ti-activity-heartbeat" },
};

export default function VitalsCard({ patientId }: { patientId: string }) {
  const [vitals, setVitals] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;
    fetch(`${API}/api/v1/patients/${patientId}/vitals/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setVitals(d || {}))
      .catch(() => setVitals({}))
      .finally(() => setLoading(false));
  }, [patientId]);

  const entries = Object.entries(vitals);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
        Latest Vitals
      </div>

      {loading ? (
        <div style={{ padding: "20px 0" }} />
      ) : entries.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <i className="ti ti-heart-rate-monitor" style={{ fontSize: 28, color: "var(--text-muted)", display: "block", marginBottom: 8, opacity: 0.4 }} />
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No vitals logged by patient yet</p>
        </div>
      ) : (
        entries.map(([type, v], i) => {
          const meta = VITAL_META[type] ?? { label: type, unit: "" };
          const display = v.value_2 ? `${v.value_1}/${v.value_2}` : v.value_1;
          const statusColor = v.status === "critical" ? "var(--danger)" : v.status === "watch" ? "var(--warning)" : "var(--success)";

          return (
            <motion.div key={type}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < entries.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className={`ti ${meta.icon}`} style={{ fontSize: 13, color: "var(--text-muted)", width: 14 }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{meta.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>
                  {display} <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 400 }}>{meta.unit}</span>
                </span>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}