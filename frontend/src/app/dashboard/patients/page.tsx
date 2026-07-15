"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";
import AddPatientModal from "@/components/patients/AddPatientModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetch(`${API}/api/v1/patients/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Patients
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {loading ? "Loading..." : `${patients.length} total patients`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10, fontSize: 13,
            fontWeight: 500, border: "none", cursor: "pointer",
            background: "var(--accent-gradient)", color: "var(--text-inverse)"
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 15 }} />
          Add Patient
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 10, marginBottom: 20,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 15, color: "var(--text-muted)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", fontSize: 13, color: "var(--text-primary)",
            fontFamily: "inherit",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <i className="ti ti-x" style={{ fontSize: 13 }} />
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12, overflow: "hidden"
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <motion.div animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 28, height: 28, borderRadius: "50%", margin: "0 auto 12px",
                border: "2px solid var(--border-subtle)",
                borderTop: "2px solid var(--accent-primary)"
              }} />
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading patients...</p>
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
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Patient", "Phone", "Age", "Language", "Status", "Joined", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "11px 20px", textAlign: "left",
                      fontSize: 10, color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      fontFamily: "monospace", fontWeight: 400
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    onClick={() => window.location.href = `/dashboard/patients/${p.id}`}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 600, color: "var(--accent-primary)"
                        }}>
                          {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                          {p.full_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {p.phone}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {p.age ?? "—"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 20,
                        fontFamily: "monospace", textTransform: "uppercase",
                        background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                        color: "var(--accent-primary)"
                      }}>
                        {p.language}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 20,
                        fontFamily: "monospace", textTransform: "uppercase",
                        background: p.is_active
                          ? "color-mix(in srgb, var(--success) 12%, transparent)"
                          : "color-mix(in srgb, var(--danger) 12%, transparent)",
                        color: p.is_active ? "var(--success)" : "var(--danger)"
                      }}>
                        {p.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--text-muted)" }} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </>
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