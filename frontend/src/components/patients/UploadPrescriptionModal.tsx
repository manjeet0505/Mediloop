"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UploadPrescriptionModalProps {
  isOpen: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PARSE_STAGES = [
  "Reading image...",
  "Identifying medicines...",
  "Extracting dosages...",
  "Running safety checks...",
];

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--danger)";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 10,
      fontFamily: "monospace", fontWeight: 500,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
    }}>
      {pct}% sure
    </span>
  );
}

function EditableField({ label, value, onChange, small = false }: {
  label: string; value: string; onChange: (v: string) => void; small?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, color: "var(--text-muted)",
        marginBottom: 4, fontFamily: "monospace", textTransform: "uppercase",
      }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: small ? "6px 8px" : "8px 10px",
          borderRadius: 6, fontSize: 12.5,
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)", outline: "none", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

export default function UploadPrescriptionModal({ isOpen, patientId, onClose, onSuccess }: UploadPrescriptionModalProps) {
  const [step, setStep] = useState<"upload" | "parsing" | "review" | "saving" | "done">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parseStage, setParseStage] = useState(0);
  const [error, setError] = useState("");

  const [doctorName, setDoctorName] = useState("");
  const [safetyFlag, setSafetyFlag] = useState(false);
  const [safetyNote, setSafetyNote] = useState("");
  const [medications, setMedications] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageIntervalRef = useRef<any>(null);

  const reset = () => {
    setStep("upload"); setFile(null); setPreviewUrl(null); setError("");
    setDoctorName(""); setSafetyFlag(false); setSafetyNote(""); setMedications([]);
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const startParse = async () => {
    if (!file) return;
    setStep("parsing");
    setError("");
    setParseStage(0);

    stageIntervalRef.current = setInterval(() => {
      setParseStage(p => Math.min(p + 1, PARSE_STAGES.length - 1));
    }, 900);

    try {
      const token = authService.getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_id", patientId);

      const res = await fetch(`${API}/api/v1/prescription/parse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(stageIntervalRef.current);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Could not parse this image");
      }

      setDoctorName(data.care_plan.doctor_name || "");
      setSafetyFlag(data.care_plan.safety_flag);
      setSafetyNote(data.care_plan.safety_note || "");
      setMedications(data.care_plan.medications);
      setStep("review");
    } catch (err: any) {
      clearInterval(stageIntervalRef.current);
      setError(err.message || "Something went wrong");
      setStep("upload");
    }
  };

  const updateMed = (i: number, field: string, value: string | number) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const removeMed = (i: number) => {
    setMedications(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleConfirm = async () => {
    setStep("saving");
    setError("");
    try {
      const token = authService.getToken();
      const res = await fetch(`${API}/api/v1/prescription/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_name: doctorName,
          raw_text: "",
          safety_flag: safetyFlag,
          safety_note: safetyNote,
          medications: medications.map(m => ({
            medicine_name: m.medicine_name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            times_per_day: Number(m.times_per_day) || 1,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
      }
      setStep("done");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Could not save prescription");
      setStep("review");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={step === "parsing" || step === "saving" ? undefined : handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560,
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 16, padding: 28, maxHeight: "88vh", overflowY: "auto",
            }}
          >
            {/* ── UPLOAD STEP ── */}
            {step === "upload" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Upload Prescription</h2>
                  <button onClick={handleClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    <i className="ti ti-x" style={{ fontSize: 18 }} />
                  </button>
                </div>

                <div
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragActive ? "var(--accent-primary)" : "var(--border-default)"}`,
                    borderRadius: 14, padding: previewUrl ? 12 : 40,
                    textAlign: "center", cursor: "pointer",
                    background: dragActive ? "color-mix(in srgb, var(--accent-primary) 6%, transparent)" : "var(--bg-overlay)",
                    transition: "all 0.15s",
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" style={{ maxHeight: 240, borderRadius: 10, margin: "0 auto", display: "block" }} />
                  ) : (
                    <>
                      <i className="ti ti-file-upload" style={{ fontSize: 36, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                        Drag & drop a prescription photo
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>or click to browse — JPG, PNG</p>
                    </>
                  )}
                </div>

                {error && (
                  <div style={{
                    marginTop: 14, padding: "10px 12px", borderRadius: 8,
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                    fontSize: 12, color: "var(--danger)",
                  }}>
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: file ? 1.01 : 1 }} whileTap={{ scale: file ? 0.98 : 1 }}
                  onClick={startParse}
                  disabled={!file}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, marginTop: 18,
                    fontSize: 13.5, fontWeight: 600, border: "none",
                    background: file ? "var(--accent-gradient)" : "var(--bg-overlay)",
                    color: file ? "var(--text-inverse)" : "var(--text-muted)",
                    cursor: file ? "pointer" : "default",
                  }}
                >
                  Parse with AI
                </motion.button>
              </>
            )}

            {/* ── PARSING STEP ── */}
            {step === "parsing" && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 44, height: 44, borderRadius: "50%", margin: "0 auto 24px",
                    border: "3px solid var(--border-subtle)", borderTop: "3px solid var(--accent-primary)",
                  }}
                />
                <AnimatePresence mode="wait">
                  <motion.p key={parseStage}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{ fontSize: 14, color: "var(--text-secondary)" }}
                  >
                    {PARSE_STAGES[parseStage]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* ── REVIEW STEP ── */}
            {step === "review" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Review & Confirm</h2>
                  <button onClick={handleClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    <i className="ti ti-x" style={{ fontSize: 18 }} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>
                  AI-extracted fields — edit anything that looks off before saving
                </p>

                {safetyFlag && (
                  <div style={{
                    display: "flex", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16,
                    background: "color-mix(in srgb, var(--warning) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
                  }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 15, color: "var(--warning)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--warning)" }}>{safetyNote}</span>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <EditableField label="Doctor Name" value={doctorName} onChange={setDoctorName} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
                  {medications.map((med, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 14,
                        background: "var(--bg-overlay)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Medicine {i + 1}</span>
                          {med.confidence !== undefined && <ConfidenceBadge value={med.confidence} />}
                        </div>
                        <button onClick={() => removeMed(i)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--danger)" }}>
                          <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <EditableField label="Name" value={med.medicine_name} onChange={v => updateMed(i, "medicine_name", v)} small />
                        <EditableField label="Dosage" value={med.dosage} onChange={v => updateMed(i, "dosage", v)} small />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        <EditableField label="Frequency" value={med.frequency} onChange={v => updateMed(i, "frequency", v)} small />
                        <EditableField label="Duration" value={med.duration || "30 days"} onChange={v => updateMed(i, "duration", v)} small />
                        <EditableField label="Times/day" value={String(med.times_per_day)} onChange={v => updateMed(i, "times_per_day", v)} small />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {error && (
                  <div style={{
                    marginTop: 12, padding: "10px 12px", borderRadius: 8,
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                    fontSize: 12, color: "var(--danger)",
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                      border: "1px solid var(--border-default)", background: "transparent",
                      color: "var(--text-secondary)", cursor: "pointer",
                    }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={medications.length === 0}
                    style={{
                      flex: 2, padding: "12px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                      border: "none", cursor: "pointer",
                      background: medications.length ? "var(--accent-gradient)" : "var(--bg-overlay)",
                      color: medications.length ? "var(--text-inverse)" : "var(--text-muted)",
                    }}>
                    Confirm & Save ({medications.length} medicine{medications.length !== 1 ? "s" : ""})
                  </motion.button>
                </div>
              </>
            )}

            {/* ── SAVING STEP ── */}
            {step === "saving" && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 40, height: 40, borderRadius: "50%", margin: "0 auto 20px",
                    border: "3px solid var(--border-subtle)", borderTop: "3px solid var(--accent-primary)",
                  }}
                />
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Saving prescription & scheduling doses...</p>
              </div>
            )}

            {/* ── DONE STEP ── */}
            {step === "done" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
                    background: "color-mix(in srgb, var(--success) 15%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <i className="ti ti-check" style={{ fontSize: 26, color: "var(--success)" }} />
                </motion.div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Prescription saved
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
                  Dose reminders are now scheduled and will run automatically
                </p>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: "1px solid var(--border-default)", background: "transparent",
                    color: "var(--text-secondary)", cursor: "pointer",
                  }}>
                  Done
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}