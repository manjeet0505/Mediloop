"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const VITAL_OPTIONS = [
  { value: "bp", label: "Blood Pressure", unit: "mmHg", hasSecond: true },
  { value: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", hasSecond: false },
  { value: "weight", label: "Weight", unit: "kg", hasSecond: false },
  { value: "spo2", label: "SpO2", unit: "%", hasSecond: false },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm", hasSecond: false },
];

export default function LogVitalsModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vitalType, setVitalType] = useState("bp");
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<null | "normal" | "watch" | "critical">(null);

  const selected = VITAL_OPTIONS.find((v) => v.value === vitalType)!;

  const reset = () => {
    setValue1("");
    setValue2("");
    setError("");
    setSuccess(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!value1) {
      setError("Please enter a value");
      return;
    }
    const token = authService.getToken();
    if (!token) return;

    setSubmitting(true);
    setError("");

    try {
      const params = new URLSearchParams({
        vital_type: vitalType,
        value_1: value1,
      });
      if (selected.hasSecond && value2) params.append("value_2", value2);

      const res = await fetch(`${API}/api/v1/patient/me/vitals?${params.toString()}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setSuccess(data.status);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1100);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 100, padding: 20,
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "var(--bg-surface)", borderRadius: 18, padding: 28,
              maxWidth: 380, width: "100%", border: "1px solid var(--border-subtle)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: "center", padding: "24px 0" }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: success === "critical" ? "var(--danger-bg, rgba(239,68,68,0.12))"
                      : success === "watch" ? "var(--warning-bg)" : "var(--success-bg)",
                  }}>
                    <i className="ti ti-check" style={{
                      fontSize: 24,
                      color: success === "critical" ? "var(--danger)" : success === "watch" ? "var(--warning)" : "var(--success)",
                    }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    Reading saved
                  </p>
                  {success === "critical" && (
                    <p style={{ fontSize: 12, color: "var(--danger)" }}>
                      This is outside the safe range — your care team has been notified.
                    </p>
                  )}
                  {success === "watch" && (
                    <p style={{ fontSize: 12, color: "var(--warning)" }}>
                      Slightly outside the normal range — keep an eye on this.
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      Log a Vital
                    </h2>
                    <button onClick={handleClose} style={{
                      background: "var(--bg-overlay)", border: "none", borderRadius: 8,
                      width: 28, height: 28, cursor: "pointer", color: "var(--text-muted)", fontSize: 14,
                    }}>✕</button>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                      VITAL TYPE
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {VITAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setVitalType(opt.value); setValue1(""); setValue2(""); setError(""); }}
                          style={{
                            padding: "6px 12px", borderRadius: 8, fontSize: 12,
                            border: `1px solid ${vitalType === opt.value ? "var(--text-primary)" : "var(--border-default)"}`,
                            background: vitalType === opt.value ? "var(--text-primary)" : "transparent",
                            color: vitalType === opt.value ? "var(--bg-page)" : "var(--text-secondary)",
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                        {selected.hasSecond ? "SYSTOLIC" : selected.label.toUpperCase()} ({selected.unit})
                      </label>
                      <input
                        type="number"
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                        placeholder="0"
                        style={{
                          width: "100%", padding: "10px 12px", borderRadius: 8,
                          border: "1px solid var(--border-default)", background: "var(--bg-overlay)",
                          color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none",
                        }}
                      />
                    </div>
                    {selected.hasSecond && (
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                          DIASTOLIC (mmHg)
                        </label>
                        <input
                          type="number"
                          value={value2}
                          onChange={(e) => setValue2(e.target.value)}
                          placeholder="0"
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid var(--border-default)", background: "var(--bg-overlay)",
                            color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 12 }}>{error}</p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      width: "100%", marginTop: 12, padding: "11px 0", borderRadius: 10,
                      border: "none", background: "var(--accent-gradient)", color: "var(--text-inverse)",
                      fontSize: 13.5, fontWeight: 600, cursor: submitting ? "default" : "pointer",
                      opacity: submitting ? 0.6 : 1, fontFamily: "inherit",
                    }}
                  >
                    {submitting ? "Saving..." : "Save Reading"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}