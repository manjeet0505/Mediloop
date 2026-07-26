"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import AddPatientModal from "@/components/patients/AddPatientModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const prevTo = useRef<number | null>(null);
  useEffect(() => {
    if (prevTo.current === to) return;
    prevTo.current = to;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(ease * to);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{Math.round(val)}</>;
}

function PatientRow({ p, index }: { p: any; index: number }) {
  const joinedDaysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const isNew = joinedDaysAgo <= 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.03 * index, duration: 0.4, ease: EASE }}
      whileHover={{ x: 4 }}
      onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "18px 4px",
        borderBottom: "1px solid var(--border-subtle)",
        cursor: "pointer",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
        background: "var(--bg-overlay)",
        border: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 600, color: "var(--text-secondary)",
      }}>
        {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-primary)" }}>{p.full_name}</span>
          {isNew && (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)" }} />
          )}
          {p.is_active && (
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: "var(--success)",
              opacity: 0.7,
            }} />
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {p.phone}
        </div>
      </div>

      <span style={{ fontSize: 13, color: "var(--text-muted)", width: 40, textAlign: "right" }}>
        {p.age ?? "—"}
      </span>
      <span style={{
        fontSize: 11, color: "var(--text-muted)", width: 24, textAlign: "center",
        textTransform: "uppercase",
      }}>
        {p.language}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-muted)", width: 80, textAlign: "right" }}>
        {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </span>
      <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "var(--text-muted)", flexShrink: 0, opacity: 0.5 }} />
    </motion.div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetch(`${API}/api/v1/patients/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setPatients(Array.isArray(d) ? d : []))
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const activeCount = patients.filter(p => p.is_active).length;
  const newThisWeek = patients.filter(p => {
    const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── Header — no box, just confident type ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Manage your patients</p>
          <h1 style={{
            fontSize: 44, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "-0.03em", lineHeight: 1,
          }}>
            {loading ? "—" : <CountUp to={patients.length} />}
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "11px 20px",
            borderRadius: 10, fontSize: 13.5, fontWeight: 500, border: "none", cursor: "pointer",
            background: "var(--accent-gradient)", color: "var(--text-inverse)",
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 15 }} />
          Add Patient
        </motion.button>
      </motion.div>

      {/* ── Inline stats — no boxes, just numbers + dividers ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          display: "flex", gap: 28, marginBottom: 32, paddingBottom: 24,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {[
          { label: "active", value: activeCount, color: "var(--success)" },
          { label: "new this week", value: newThisWeek, color: "var(--accent-primary)" },
          { label: "inactive", value: patients.length - activeCount, color: "var(--text-muted)" },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.color, letterSpacing: "-0.01em" }}>
              {loading ? "—" : <CountUp to={s.value} />}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Search — minimal, underline style ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 2px", marginBottom: 8,
          borderBottom: `1.5px solid ${searchFocused ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          transition: "border-color 0.2s ease",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 16, color: "var(--text-muted)" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          placeholder="Search by name or phone..."
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", fontSize: 15, color: "var(--text-primary)", fontFamily: "inherit",
          }}
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <i className="ti ti-x" style={{ fontSize: 14 }} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── List — hairline dividers, no outer box ── */}
      <div>
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <motion.div animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 26, height: 26, borderRadius: "50%", margin: "0 auto",
                border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)"
              }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <i className="ti ti-users" style={{ fontSize: 36, color: "var(--text-muted)", display: "block", marginBottom: 10, opacity: 0.5 }} />
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {search ? "No patients match your search" : "No patients yet"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => <PatientRow key={p.id} p={p} index={i} />)}
          </AnimatePresence>
        )}
      </div>

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newPatient) => setPatients(prev => [newPatient, ...prev])}
      />
    </div>
  );
}