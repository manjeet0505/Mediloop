"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val}</>;
}

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
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

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
        whileHover={{
          y: -4,
          borderColor: color,
          boxShadow: `0 12px 28px -8px color-mix(in srgb, ${color} 35%, transparent)`,
        }}
        transition={{ layout: { duration: 0.35, ease: EASE } }}
        style={{
          position: "relative",
          background: "var(--bg-surface)",
          border: `1px solid color-mix(in srgb, ${color} ${isCritical ? 35 : 20}%, var(--border-subtle))`,
          borderRadius: 14, padding: 18, overflow: "hidden",
          cursor: "default",
        }}
      >
        {isCritical && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: -20, right: -20, width: 90, height: 90,
              borderRadius: "50%", background: color, filter: "blur(30px)", opacity: 0.15,
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.medicine_name}</span>
              {s.dosage && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.dosage}</span>}
            </div>
            <motion.a href={`/dashboard/patients/${s.patient_id}`}
              whileHover={{ x: 2 }}
              style={{
                fontSize: 12, color: "var(--accent-primary)", textDecoration: "none", display: "inline-block",
              }}>
              {s.patient_name} →
            </motion.a>
          </div>
          <motion.span
            animate={isCritical ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 20,
              fontFamily: "monospace", fontWeight: 600,
              background: `color-mix(in srgb, ${color} 12%, transparent)`, color,
            }}
          >
            {statusLabel(s.days_left)}
          </motion.span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
          <div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {s.remaining} of {s.total} doses
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color }}>
              {s.days_left}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}> days left</span>
            </span>
          </div>
          {s.trend && <Sparkline trend={s.trend} color={color} />}
        </div>

        <div style={{ height: 5, background: "var(--border-subtle)", borderRadius: 3, overflow: "hidden", marginBottom: 12, position: "relative" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{ height: "100%", background: color, borderRadius: 3 }} />
        </div>

        {s.days_left <= 7 && (
          <motion.a href={`https://pharmeasy.in/search/all?name=${s.medicine_name}`} target="_blank"
            whileHover={{ scale: 1.02, background: "var(--bg-hover)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              textDecoration: "none", background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
              position: "relative", transition: "background 0.15s",
            }}>
            <i className="ti ti-shopping-cart" style={{ fontSize: 13 }} />
            Reorder
          </motion.a>
        )}
      </motion.div>
    );
  };

  const Section = ({ title, items, dotColor, pulse }: { title: string; items: any[]; dotColor: string; pulse?: boolean }) => {
    if (items.length === 0) return null;
    const DotTag = pulse ? motion.span : "span";
    return (
      <motion.div
        initial="hidden" animate="show" variants={sectionVariants}
        style={{ marginBottom: 28 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}
        >
          <DotTag
            {...(pulse ? { animate: { opacity: [1, 0.4, 1] }, transition: { duration: 1.5, repeat: Infinity } } : {})}
            style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        </motion.div>
        <motion.div
          layout
          variants={sectionVariants}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}
        >
          <AnimatePresence mode="popLayout">
            {items.map((s, i) => <StockCard key={`${s.patient_id}-${s.medicine_name}`} s={s} />)}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Stock</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace" }}>
          {loading ? "Loading..." : `${filtered.length} medicines across all patients`}
        </p>
      </motion.div>

      {!loading && (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 0, marginBottom: 28, background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)", borderRadius: 14, overflow: "hidden",
          }}>
          {[
            { label: "Total Tracked", value: filtered.length, color: "var(--text-primary)" },
            { label: "Critical", value: critical.length, color: "var(--danger)" },
            { label: "Low Stock", value: low.length, color: "var(--warning)" },
            { label: "Healthy", value: ok.length, color: "var(--success)" },
          ].map((s, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
              whileHover={{ background: "var(--bg-hover)" }}
              style={{
                padding: "18px 20px",
                borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)",
                transition: "background 0.2s",
              }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>
                <CountUp to={s.value} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          boxShadow: searchFocused
            ? "0 0 0 2px color-mix(in srgb, var(--accent-primary) 40%, transparent)"
            : "0 0 0 0px transparent",
        }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
          borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          minWidth: 240, marginBottom: 24, maxWidth: 340, transition: "box-shadow 0.2s",
        }}>
        <i className="ti ti-search" style={{ fontSize: 14, color: "var(--text-muted)" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          placeholder="Search patient or medicine..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "inherit" }} />
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: 60 }}>
          <i className="ti ti-box" style={{ fontSize: 40, color: "var(--text-muted)", display: "block", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No stock data yet</p>
        </motion.div>
      ) : (
        <>
          <Section title="Critical (≤3 days)" items={critical} dotColor="var(--danger)" pulse />
          <Section title="Low (4–7 days)" items={low} dotColor="var(--warning)" />
          <Section title="Healthy stock" items={ok} dotColor="var(--success)" />
        </>
      )}
    </div>
  );
}