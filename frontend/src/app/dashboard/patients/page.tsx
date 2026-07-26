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

function StatChip({ icon, label, value, color, index }: {
  icon: string; label: string; value: number; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.5, ease: EASE }}
      whileHover={{ y: -3, boxShadow: `0 14px 30px -10px color-mix(in srgb, ${color} 30%, transparent)` }}
      style={{
        flex: 1, minWidth: 150,
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: 14, padding: "16px 18px", cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
        </div>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        <CountUp to={value} />
      </div>
    </motion.div>
  );
}

function PatientCard({ p, index }: { p: any; index: number }) {
  const statusColor = p.is_active ? "var(--success)" : "var(--text-muted)";
  const joinedDaysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const isNew = joinedDaysAgo <= 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.4, ease: EASE }}
      whileHover={{ x: 3, backgroundColor: "var(--bg-hover)" }}
      onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px 14px 12px",
        borderLeft: `2.5px solid ${statusColor}`,
        cursor: "pointer", borderRadius: 8, marginBottom: 2,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 25%, transparent), color-mix(in srgb, ${statusColor} 20%, transparent))`,
        border: `1.5px solid color-mix(in srgb, ${statusColor} 35%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
      }}>
        {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.full_name}</span>
          {isNew && (
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
              background: "color-mix(in srgb, var(--accent-primary) 14%, transparent)",
              color: "var(--accent-primary)", letterSpacing: "0.03em",
            }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "monospace" }}>
          {p.phone}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ textAlign: "center", minWidth: 34 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.age ?? "—"}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>age</div>
        </div>
        <span style={{
          fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 600,
          background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
          color: "var(--accent-primary)", textTransform: "uppercase",
        }}>
          {p.language}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 78, textAlign: "right" }}>
          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
        <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }} />
      </div>
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
  const hindiSpeakers = patients.filter(p => p.language === "hi").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 20, marginBottom: 24, flexWrap: "wrap",
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 18, padding: "24px 28px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", top: -70, right: 40, width: 220, height: 220,
          borderRadius: "50%", background: "var(--accent-gradient)", filter: "blur(80px)", opacity: 0.07,
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Manage your patients</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {loading ? "Patients" : `${patients.length} Patients`}
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 0 24px color-mix(in srgb, var(--accent-primary) 40%, transparent)" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
            borderRadius: 10, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
            background: "var(--accent-gradient)", color: "var(--text-inverse)", position: "relative",
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 15 }} />
          Add Patient
        </motion.button>
      </motion.div>

      {/* ── STAT CHIPS ── */}
      {!loading && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatChip index={0} icon="ti-users" label="Total" value={patients.length} color="#6366f1" />
          <StatChip index={1} icon="ti-circle-check" label="Active" value={activeCount} color="#10b981" />
          <StatChip index={2} icon="ti-sparkles" label="New this week" value={newThisWeek} color="#f59e0b" />
          <StatChip index={3} icon="ti-language" label="Hindi speakers" value={hindiSpeakers} color="#06b6d4" />
        </div>
      )}

      {/* ── SEARCH ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          boxShadow: searchFocused
            ? "0 0 0 2px color-mix(in srgb, var(--accent-primary) 40%, transparent)"
            : "0 0 0 0px transparent",
        }}
        transition={{ duration: 0.4, delay: 0.35 }}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
          borderRadius: 10, marginBottom: 20, background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)", transition: "box-shadow 0.2s",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 15, color: "var(--text-muted)" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          placeholder="Search by name or phone..."
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <i className="ti ti-x" style={{ fontSize: 13 }} />
          </button>
        )}
      </motion.div>

      {/* ── LIST ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 14, overflow: "hidden", padding: 8,
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <motion.div animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 28, height: 28, borderRadius: "50%", margin: "0 auto",
                border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)"
              }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <i className="ti ti-users" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
              {search ? "No patients match your search" : "No patients yet"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {search ? "Try a different name or phone number" : "Add your first patient to get started"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => <PatientCard key={p.id} p={p} index={i} />)}
          </AnimatePresence>
        )}
      </motion.div>

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newPatient) => setPatients(prev => [newPatient, ...prev])}
      />
    </div>
  );
}