"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AddPatientModalProps {
  isOpen: boolean;
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
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 11, color: "var(--text-muted)",
        marginBottom: 6, fontFamily: "monospace", textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)", fontSize: 13, outline: "none",
          fontFamily: "inherit", transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--accent-primary)")}
        onBlur={e => (e.target.style.borderColor = "var(--border-subtle)")}
      />
    </div>
  );
}

function InviteCodeReveal({ code, patientName, patientPhone }: { code: string; patientName: string; patientPhone: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const waMessage = encodeURIComponent(
    `Hi ${patientName}! Your MedLoop patient portal is ready. Use this invite code to sign up: ${code}\n\nDownload/visit the portal and enter this code during signup to link your account.`
  );
  const waPhone = patientPhone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(code)}&bgcolor=0a0a0a&color=ffffff&qzone=1`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: "center" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
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
        {patientName} added successfully
      </h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
        Share this invite code so they can link their patient portal login
      </p>

      {/* QR code */}
      <div style={{
        width: 160, height: 160, margin: "0 auto 20px", borderRadius: 12,
        overflow: "hidden", border: "1px solid var(--border-subtle)",
      }}>
        <img src={qrUrl} alt="Invite QR code" width={160} height={160} style={{ display: "block" }} />
      </div>

      {/* Code reveal — staggered characters */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 6, marginBottom: 20,
      }}>
        {code.split("").map((char, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -12, rotateX: -90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
            style={{
              width: 34, height: 42, borderRadius: 8,
              background: "var(--bg-overlay)",
              border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, var(--border-subtle))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "var(--accent-primary)",
              fontFamily: "monospace",
            }}
          >
            {char}
          </motion.div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleCopy}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 9, fontSize: 12.5, fontWeight: 500,
            border: "1px solid var(--border-default)", background: "var(--bg-overlay)",
            color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-check" style={{ fontSize: 14, color: "var(--success)" }} />
                Copied
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-copy" style={{ fontSize: 14 }} />
                Copy code
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.a
          href={waLink} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 9, fontSize: 12.5, fontWeight: 500,
            border: "none", background: "#25D366", color: "#052e14",
            cursor: "pointer", textDecoration: "none",
          }}
        >
          <i className="ti ti-brand-whatsapp" style={{ fontSize: 15 }} />
          Share on WhatsApp
        </motion.a>
      </div>
    </motion.div>
  );
}

export default function AddPatientModal({ isOpen, onClose, onSuccess }: AddPatientModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("en");

  const reset = () => {
    setStep("form");
    setFullName(""); setPhone(""); setFamilyPhone(""); setDoctorPhone(""); setAge("");
    setLanguage("en"); setError(""); setCreatedPatient(null);
  };

  const handleClose = () => {
    reset();
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
      const res = await fetch(`${API}/api/v1/patients/`, {
        method: "POST",
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
      const patient = await res.json();
      setCreatedPatient(patient);
      setStep("success");
      onSuccess(patient);
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
            {step === "form" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                    Add New Patient
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField label="Age" value={age} onChange={setAge} placeholder="45" type="number" />
                  <div style={{ marginBottom: 14 }}>
                    <label style={{
                      display: "block", fontSize: 11, color: "var(--text-muted)",
                      marginBottom: 6, fontFamily: "monospace", textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 8,
                        background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)", fontSize: 13, outline: "none",
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
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 8, marginBottom: 14,
                      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                    }}
                  >
                    <i className="ti ti-alert-circle" style={{ fontSize: 14, color: "var(--danger)" }} />
                    <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.01 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10,
                    fontSize: 13.5, fontWeight: 600, border: "none",
                    background: submitting ? "var(--bg-overlay)" : "var(--accent-gradient)",
                    color: submitting ? "var(--text-muted)" : "var(--text-inverse)",
                    cursor: submitting ? "default" : "pointer",
                    marginTop: 6, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8,
                  }}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: 14, height: 14, borderRadius: "50%",
                          border: "2px solid var(--border-subtle)",
                          borderTop: "2px solid var(--text-secondary)",
                        }}
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-plus" style={{ fontSize: 15 }} />
                      Create Patient
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              createdPatient && (
                <>
                  <InviteCodeReveal
                    code={createdPatient.invite_code}
                    patientName={createdPatient.full_name}
                    patientPhone={createdPatient.phone}
                  />
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    style={{
                      width: "100%", padding: "11px", borderRadius: 10, marginTop: 22,
                      fontSize: 13, fontWeight: 500,
                      border: "1px solid var(--border-default)",
                      background: "transparent", color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </motion.button>
                </>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}