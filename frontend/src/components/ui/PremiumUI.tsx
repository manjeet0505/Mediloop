"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;
export const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

export function CountUp({ to, duration = 1100, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  const prevTo = useRef<number | null>(null);
  useEffect(() => {
    if (prevTo.current === to) return;
    prevTo.current = to;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setVal(ease * to);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{decimals ? val.toFixed(decimals) : Math.round(val)}</>;
}

/** Ambient glow that follows the cursor across the whole page */
export function MouseGlow() {
  const mx = useMotionValue(-300);
  const my = useMotionValue(-300);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <motion.div
      style={{
        position: "fixed", left: sx, top: sy, x: "-50%", y: "-50%",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 10%, transparent) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 1, filter: "blur(20px)",
      }}
    />
  );
}

/** Wrapper that subtly tilts its children in 3D toward the cursor */
export function TiltCard({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 300, damping: 24 });
  const sry = useSpring(ry, { stiffness: 300, damping: 24 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 4);
    rx.set(-py * 4);
  };
  const handleLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800, ...style }}
    >
      {children}
    </motion.div>
  );
}

/** Button that magnetically shifts toward the cursor */
export function MagneticButton({ children, onClick, style, variant = "primary" }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; variant?: "primary" | "ghost";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 16 });
  const sy = useSpring(y, { stiffness: 200, damping: 16 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  const base: React.CSSProperties = variant === "primary"
    ? {
        border: "none", background: "var(--accent-gradient)", color: "var(--text-inverse)",
        boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--accent-primary) 50%, transparent)",
      }
    : {
        border: "1px solid var(--border-default)", background: "var(--bg-overlay)", color: "var(--text-secondary)",
      };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      style={{
        x: sx, y: sy,
        display: "flex", alignItems: "center", gap: 7, padding: "11px 20px",
        borderRadius: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
        ...base, ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

export function RotatingRingAvatar({ name, accent = false, size = 42 }: { name: string; accent?: boolean; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: accent
            ? "conic-gradient(from 0deg, var(--accent-primary), transparent 60%, var(--accent-primary))"
            : "conic-gradient(from 0deg, var(--border-default), transparent 70%, var(--border-default))",
          padding: 1.5,
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--bg-page)" }} />
      </motion.div>
      <div style={{
        position: "absolute", inset: 2, borderRadius: "50%",
        background: "var(--bg-overlay)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.32, fontWeight: 600, color: "var(--text-secondary)",
      }}>
        {initials}
      </div>
    </div>
  );
}

export function GradientHeroNumber({ value, loading, size = 56 }: { value: number | string; loading: boolean; size?: number }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{
        fontSize: size, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
        backgroundImage: "linear-gradient(135deg, var(--text-primary), color-mix(in srgb, var(--accent-primary) 60%, var(--text-primary)))",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
      }}
    >
      {loading ? "—" : typeof value === "number" ? <CountUp to={value} /> : value}
    </motion.h1>
  );
}

/** Underline input — animated gradient bar draws in on focus */
export function UnderlineSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px" }}>
        <i className="ti ti-search" style={{ fontSize: 16, color: "var(--text-muted)" }} />
        <input
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", fontSize: 15, color: "var(--text-primary)", fontFamily: "inherit",
          }}
        />
        {value && (
          <button onClick={() => onChange("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        )}
      </div>
      <div style={{ height: 1.5, background: "var(--border-subtle)", position: "relative" }}>
        <motion.div
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ position: "absolute", inset: 0, background: "var(--accent-gradient)", transformOrigin: "left", borderRadius: 2 }}
        />
      </div>
    </div>
  );
}