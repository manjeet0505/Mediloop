"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = authService.getToken();
      if (!token) { window.location.href = "/login"; return; }
      fetch(`${API}/api/v1/patients/stock/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setStock(Array.isArray(d) ? d : []))
        .catch(() => setStock([]))
        .finally(() => setLoading(false));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = stock.filter(s =>
    s.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    s.medicine_name.toLowerCase().includes(search.toLowerCase())
  );

  const critical = filtered.filter(s => s.days_left <= 3);
  const low = filtered.filter(s => s.days_left > 3 && s.days_left <= 7);
  const ok = filtered.filter(s => s.days_left > 7);

  const statusColor = (days: number) =>
    days <= 3 ? "var(--danger)" : days <= 7 ? "var(--warning)" : "var(--success)";
  const statusLabel = (days: number) =>
    days <= 3 ? "CRITICAL" : days <= 7 ? "LOW" : "OK";

  const StockCard = ({ s, i }: { s: any; i: number }) => {
    const color = statusColor(s.days_left);
    const pct = s.total > 0 ? Math.round((s.remaining / s.total) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        style={{
          background: "var(--bg-surface)",
          border: `1px solid color-mix(in srgb, ${color} 20%, var(--border-subtle))`,
          borderRadius: 14, padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.medicine_name}</span>
              {s.dosage && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.dosage}</span>}
            </div>
            <a href={`/dashboard/patients/${s.patient_id}`} style={{
              fontSize: 12, color: "var(--accent-primary)", textDecoration: "none",
            }}>
              {s.patient_name} →
            </a>
          </div>
          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 20,
            fontFamily: "monospace", fontWeight: 600,
            background: `color-mix(in srgb, ${color} 12%, transparent)`, color,
          }}>
            {statusLabel(s.days_left)}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {s.remaining} of {s.total} doses
          </span>
          <span style={{ fontSize: 11, color, fontFamily: "monospace" }}>{s.days_left}d left</span>
        </div>
        <div style={{ height: 5, background: "var(--border-subtle)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: color, borderRadius: 3 }} />
        </div>

        {s.days_left <= 7 && (
          <motion.a href={`https://pharmeasy.in/search/all?name=${s.medicine_name}`} target="_blank"
            whileHover={{ scale: 1.02 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              textDecoration: "none", background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
            }}>
            <i className="ti ti-shopping-cart" style={{ fontSize: 13 }} />
            Reorder
          </motion.a>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Stock</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {loading ? "Loading..." : `${filtered.length} medicines across all patients`}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
          borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          minWidth: 240,
        }}>
          <i className="ti ti-search" style={{ fontSize: 14, color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or medicine..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit" }} />
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <i className="ti ti-box" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No stock data yet</p>
        </div>
      ) : (
        <>
          {critical.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--danger)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Critical (≤3 days)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {critical.map((s, i) => <StockCard key={i} s={s} i={i} />)}
              </div>
            </div>
          )}
          {low.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--warning)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Low (4–7 days)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {low.map((s, i) => <StockCard key={i} s={s} i={i} />)}
              </div>
            </div>
          )}
          {ok.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Healthy stock</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {ok.map((s, i) => <StockCard key={i} s={s} i={i} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}