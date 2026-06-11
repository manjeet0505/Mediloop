"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_LINKS = ["Agents", "Demo", "Stack", "Market"];

export function Navbar() {
  const { online, checking } = useServerHealth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: scrolled ? "var(--bg-surface)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <motion.a href="/" className="flex items-center gap-3" whileHover={{ scale: 1.03 }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: "var(--accent-gradient)" }}>
              M
            </div>
            <motion.div className="absolute inset-0 rounded-xl -z-10"
              style={{ background: "var(--accent-gradient)", filter: "blur(10px)", opacity: 0.5 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              MedLoop AI
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              v1.0.0 · Beta
            </div>
          </div>
        </motion.a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <motion.a key={i} href={`#${link.toLowerCase()}`}
              className="text-sm font-medium transition-colors relative group"
              style={{ color: "var(--text-muted)" }}
              whileHover={{ color: "var(--accent-primary)" }}>
              {link}
              <div className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                style={{ background: "var(--accent-gradient)" }} />
            </motion.a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <motion.div className="w-2 h-2 rounded-full"
              style={{ background: checking ? "var(--warning)" : online ? "var(--success)" : "var(--danger)" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-mono hidden sm:block" style={{ color: "var(--text-muted)" }}>
              {checking ? "checking" : online ? "API online" : "API offline"}
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Swagger */}
          <MagneticButton href="http://localhost:8000/docs" target="_blank"
            className="hidden md:block px-4 py-2 rounded-xl text-xs font-mono cursor-pointer transition-all"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              color: "var(--accent-primary)"
            }}>
            Swagger →
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
}