"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { EASE, CountUp, MouseGlow, UnderlineSearch, TiltCard } from "@/components/ui/PremiumUI";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Sparkline({ trend, color }: { trend: number[]; color: string }) {
  if (!trend || trend.length < 2) return null;
  const max = Math.max(...trend, 1);
  const min = Math.min(...trend);
  const range = max - min || 1;
  const w = 100, h = 28;
  const pts = trend.map((v, i) => ({
    x: (i / (trend.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const points = pts.map(p => `${p.x},${p.y}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg width={w} height={h + 6} viewBox={`0 0 ${w} ${h + 6}`} style={{ display: "block", overflow: "visible" }}>
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <motion.circle
        cx={last.x} cy={last.y} r="2.5" fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.6, 1] }}
        transition={{ delay: 1.1, duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

const sectionVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE } },
};

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

  const StockCard = ({ s }: { s: any }) => {
    const color = statusColor(s.days_left);
    const pct = s.total > 0 ? Math.round((s.remaining / s.total) * 100) : 0;
    const isCritical = s.days_left <= 3;

    return (
      <motion.div
        layout
        variants={cardVariants}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
        transition={{ layout: { duration: 0.35, ease: EASE } }}
      >
        <TiltCard style={{ height: "100%" }}>
          <motion.div
            whileHover={{ y: -3, borderColor: "var(--border-default)" }}
            transition={{ duration: 0.2 }}
            style={{
              position: "relative",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14, padding: 18, overflow: "hidden",
              cursor: "default", height: "100%",
            }}
          >
            {isCritical && (
              <motion.div
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", top: -20, right: -20, width: 90, height: 90,
                  borderRadius: "50%", background: color, filter: "blur(30px)", opacity: 0.1,
                  pointerEvents: "none",
                }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, position: "relative" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.medicine_name}</span>
                  {s.dosage && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.dosage}</span>}
                </div>
                <a href={`/dashboard/patients/${s.patient_id}`}
                  style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", display: "inline-block" }}>
                  {s.patient_name} →
                </a>
              </div>
              <span style={{
                fontSize: 10, color, fontFamily: "monospace", fontWeight: 600,
              }}>
                {statusLabel(s.days_left)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
              <div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.remaining} of {s.total} doses</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color }}>
                  {s.days_left}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}> days left</span>
                </span>
              </div>
              {s.trend && <Sparkline trend={s.trend} color={color} />}
            </div>

            <div style={{ height: 4, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden", marginBottom: 12, position: "relative" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{ height: "100%", background: color, borderRadius: 2 }} />
            </div>

            {s.days_left <= 7 && (
              <a href={`https://pharmeasy.in/search/all?name=${s.medicine_name}`} target="_blank"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "7px 0", fontSize: 12, fontWeight: 500,
                  textDecoration: "none", color: "var(--text-secondary)",
                  borderTop: "1px solid var(--border-subtle)", marginTop: 2, paddingTop: 10,
                }}>
                <i className="ti ti-shopping-cart" style={{ fontSize: 13 }} />
                Reorder
              </a>
            )}
          </motion.div>
        </TiltCard>
      </motion.div>
    );
  };

  const Section = ({ title, items, dotColor, pulse }: { title: string; items: any[]; dotColor: string; pulse?: boolean }) => {
    if (items.length === 0) return null;
    const DotTag = pulse ? motion.span : "span";
    return (
      <motion.div initial="hidden" animate="show" variants={sectionVariants} style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <DotTag
            {...(pulse ? { animate: { opacity: [1, 0.4, 1] }, transition: { duration: 1.5, repeat: Infinity } } : {})}
            style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        </div>
        <motion.div layout variants={sectionVariants}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {items.map((s) => <StockCard key={`${s.patient_id}-${s.medicine_name}`} s={s} />)}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <MouseGlow />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ marginBottom: 24, position: "relative", zIndex: 2 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>Stock</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {loading ? "Loading..." : `${filtered.length} medicines across all patients`}
        </p>
      </motion.div>

      {/* ── Inline stats ── */}
      {!loading && (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
          style={{
            display: "flex", gap: 32, marginBottom: 28, paddingBottom: 24,
            borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap", position: "relative", zIndex: 2,
          }}>
          {[
            { label: "total tracked", value: filtered.length, color: "var(--text-primary)" },
            { label: "critical", value: critical.length, color: "var(--danger)" },
            { label: "low stock", value: low.length, color: "var(--warning)" },
            { label: "healthy", value: ok.length, color: "var(--success)" },
          ].map((s, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>
                <CountUp to={s.value} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Search ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
        style={{ maxWidth: 340, marginBottom: 32, position: "relative", zIndex: 2 }}>
        <UnderlineSearch value={search} onChange={setSearch} placeholder="Search patient or medicine..." />
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: 60 }}>
          <i className="ti ti-box" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No stock data yet</p>
        </motion.div>
      ) : (
        <div style={{ position: "relative", zIndex: 2 }}>
          <Section title="Critical (≤3 days)" items={critical} dotColor="var(--danger)" pulse />
          <Section title="Low (4–7 days)" items={low} dotColor="var(--warning)" />
          <Section title="Healthy stock" items={ok} dotColor="var(--success)" />
        </div>
      )}
    </div>
  );
}