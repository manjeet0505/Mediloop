"use client";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const THEMES = [
  {
    id: "dark-neural",
    label: "Neural",
    icon: "⬡",
    bg: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    preview: ["#020408", "#6366f1", "#8b5cf6"],
  },
  {
    id: "light-clinic",
    label: "Clinic",
    icon: "✦",
    bg: "linear-gradient(135deg,#2563eb,#0891b2)",
    preview: ["#f8fafc", "#2563eb", "#0891b2"],
  },
  {
    id: "midnight-blue",
    label: "Midnight",
    icon: "◈",
    bg: "linear-gradient(135deg,#38bdf8,#4ade80)",
    preview: ["#070e1a", "#38bdf8", "#4ade80"],
  },
  {
    id: "warm-amber",
    label: "Amber",
    icon: "◎",
    bg: "linear-gradient(135deg,#b45309,#d97706)",
    preview: ["#faf7f0", "#b45309", "#15803d"],
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div className="relative">
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all"
        style={{
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        {/* Color dots preview */}
        <div className="flex gap-1">
          {current.preview.map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full"
              style={{ background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
          ))}
        </div>
        <span style={{ color: "var(--text-secondary)" }}>{current.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ color: "var(--text-muted)" }}>
          ▾
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 top-full mt-2 z-50 rounded-2xl p-2 min-w-[200px]"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-glow), 0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div className="text-xs font-mono px-2 py-1.5 mb-1"
                style={{ color: "var(--text-muted)" }}>
                SELECT THEME
              </div>
              {THEMES.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: theme === t.id ? "var(--bg-hover)" : "transparent",
                    border: theme === t.id ? "1px solid var(--border-default)" : "1px solid transparent",
                  }}
                >
                  {/* Gradient swatch */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0"
                    style={{ background: t.bg }}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {t.label}
                    </div>
                    {/* Color preview row */}
                    <div className="flex gap-1 mt-1">
                      {t.preview.map((c, j) => (
                        <div key={j} className="w-3 h-1.5 rounded-full"
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  {theme === t.id && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-xs" style={{ color: "var(--accent-primary)" }}>
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}