"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { MagneticButton } from "@/components/ui/MagneticButton";

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
        background: scrolled ? "rgba(2,4,8,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(99,102,241,0.1)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <motion.a href="/" className="flex items-center gap-3" whileHover={{ scale: 1.03 }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              M
            </div>
            <motion.div className="absolute inset-0 rounded-xl -z-10"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", filter: "blur(10px)", opacity: 0.5 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">MedLoop AI</div>
            <div className="text-xs text-slate-600 font-mono leading-none">v1.0.0 · Beta</div>
          </div>
        </motion.a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <motion.a key={i} href={`#${link.toLowerCase()}`}
              className="text-sm text-slate-500 font-medium transition-colors relative group"
              whileHover={{ color: "#a5b4fc" }}>
              {link}
              <motion.div className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
            </motion.a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <motion.div className="w-2 h-2 rounded-full"
              style={{ background: checking ? "#f59e0b" : online ? "#10b981" : "#ef4444" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-slate-500 hidden sm:block">
              {checking ? "checking" : online ? "API online" : "API offline"}
            </span>
          </div>

          {/* Swagger link */}
          <MagneticButton href="http://localhost:8000/docs" target="_blank"
            className="hidden md:block px-4 py-2 rounded-xl text-xs font-mono text-indigo-300 cursor-pointer transition-all hover:text-indigo-200"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            Swagger →
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
}