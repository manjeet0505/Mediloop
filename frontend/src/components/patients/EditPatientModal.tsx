"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { MagneticButton } from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface EditPatientModalProps {
  isOpen: boolean;
  patient: any;
  onClose: () => void;
  onSuccess: (patient: any) => void;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
];

function FormField({
  label, value, onChange, placeholder, required = false, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11, color: "var(--text-muted)",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 2px", background: "transparent",
          border: "none", borderBottom: `1.5px solid ${focused ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          color: "var(--text-primary)", fontSize: 14, outline: "none",
          fontFamily: "inherit", transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

export default function EditPatientModal({ isOpen, patient, onClose, onSuccess }: EditPatientModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("en");

  // Prefill from patient whenever modal opens / patient changes
  useEffect(() => {
    if (isOpen && patient) {
      setFullName(patient.full_name || "");
      setPhone(patient.phone || "");
      setFamilyPhone(patient.family_phone || "");
      setDoctorPhone(patient.doctor_phone || "");
      setAge(patient.age != null ? String(patient.age) : "");
      setLanguage(patient.language || "en");
      setError("");
    }
  }, [isOpen, patient]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = authService.getToken();
      const res = await fetch(`${API}/api/v1/patients/${patient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          family_phone: familyPhone.trim() || null,
          doctor_phone: doctorPhone.trim() || null,
          age: age ? parseInt(age) : null,
          language,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
      }
      const updated = await res.json();
      onSuccess(updated);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 440,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16, padding: 28,
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                Edit Patient
              </h2>
              <button onClick={handleClose} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: 4,
              }}>
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>

            <FormField label="Full Name" value={fullName} onChange={setFullName} placeholder="Rahul Sharma" required />
            <FormField label="Phone" value={phone} onChange={setPhone} placeholder="+91XXXXXXXXXX" required />
            <FormField label="Family Phone (optional)" value={familyPhone} onChange={setFamilyPhone} placeholder="+91XXXXXXXXXX" />
            <FormField label="Doctor Phone (optional)" value={doctorPhone} onChange={setDoctorPhone} placeholder="+91XXXXXXXXXX" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Age" value={age} onChange={setAge} placeholder="45" type="number" />
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: 11, color: "var(--text-muted)",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 2px", background: "transparent",
                    border: "none", borderBottom: "1.5px solid var(--border-subtle)",
                    color: "var(--text-primary)", fontSize: 14, outline: "none",
                    fontFamily: "inherit", cursor: "pointer",
                  }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", marginBottom: 14 }}
              >
                <i className="ti ti-alert-circle" style={{ fontSize: 14, color: "var(--danger)" }} />
                <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
              </motion.div>
            )}

            <div style={{ marginTop: 10 }}>
              <MagneticButton
                variant="primary"
                onClick={submitting ? () => {} : handleSubmit}
                style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: "2px solid var(--border-subtle)",
                        borderTop: "2px solid var(--text-inverse)",
                      }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" style={{ fontSize: 15 }} />
                    Save Changes
                  </>
                )}
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}