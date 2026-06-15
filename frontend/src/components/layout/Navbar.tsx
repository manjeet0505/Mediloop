"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useServerHealth } from "@/hooks/useApi";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { authService } from "@/lib/auth";

const NAV_LINKS = [
  { label: "Agents", href: "#agents" },
  { label: "Demo", href: "#demo" },
  { label: "Stack", href: "#stack" },
  { label: "Market", href: "#market" },
];

export function Navbar() {
  const { online, checking } = useServerHealth();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setLoggedIn(authService.isLoggedIn());
    setUser(authService.getUser());
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
      style={{
        background: scrolled ? "color-mix(in srgb, var(--bg-page) 90%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.a href="/" className="flex items-center gap-3" whileHover={{ scale: 1.03 }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: "var(--accent-gradient)", color: "var(--text-inverse)" }}>
              M
            </div>
            <motion.div className="absolute inset-0 rounded-xl -z-10"
              style={{ background: "var(--accent-gradient)", filter: "blur(10px)", opacity: 0.5 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>MedLoop AI</div>
            <div className="text-xs font-mono leading-none" style={{ color: "var(--text-muted)" }}>v1.0.0 · Beta</div>
          </div>
        </motion.a>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <motion.a key={i} href={link.href}
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
              whileHover={{ color: "var(--accent-primary)" } as any}>
              {link.label}
            </motion.a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
            <motion.div className="w-2 h-2 rounded-full"
              style={{ background: checking ? "var(--warning)" : online ? "var(--success)" : "var(--danger)" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {checking ? "checking" : online ? "API online" : "API offline"}
            </span>
          </div>

          <ThemeToggle />

          {loggedIn ? (
            <div className="flex items-center gap-2">
              <MagneticButton href="/dashboard"
                className="hidden md:block px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--accent-gradient)", color: "var(--text-inverse)" }}>
                Dashboard →
              </MagneticButton>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => authService.logout()}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono cursor-pointer"
                style={{ border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)" }}>
                <i className="ti ti-logout" style={{ fontSize: 13 }} />
                Logout
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MagneticButton href="/login"
                className="hidden md:block px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ border: "1px solid var(--border-default)", background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
                Login
              </MagneticButton>
              <MagneticButton href="/signup"
                className="hidden md:block px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--accent-gradient)", color: "var(--text-inverse)" }}>
                Get Started →
              </MagneticButton>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
