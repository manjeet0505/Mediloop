"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Home",          href: "/patient/dashboard",      icon: "ti-home" },
  { label: "Medicines",     href: "/patient/medicines",      icon: "ti-pill" },
  { label: "Prescriptions", href: "/patient/prescriptions",  icon: "ti-file-text" },
  { label: "Profile",       href: "/patient/profile",        icon: "ti-user" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authService.isLoggedIn()) {
      router.push("/patient/login");
      return;
    }
    setUser(authService.getUser());
  }, []);

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Top header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "color-mix(in srgb, var(--bg-page) 90%, transparent)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13, color: "var(--text-inverse)"
          }}>M</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              MedLoop
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
              Patient Portal
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{
              position: "relative", background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10, padding: "7px 10px", cursor: "pointer",
              color: "var(--text-secondary)"
            }}
          >
            <i className="ti ti-bell" style={{ fontSize: 16 }} />
            <span style={{
              position: "absolute", top: 5, right: 5,
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--danger)"
            }} />
          </motion.button>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{
        flex: 1,
        padding: "20px 20px 90px",
        overflowY: "auto",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom navigation ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "color-mix(in srgb, var(--bg-surface) 95%, transparent)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "8px 0 16px",
        zIndex: 30,
        display: "flex", justifyContent: "space-around", alignItems: "center",
      }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <motion.a
              key={item.href}
              href={item.href}
              whileTap={{ scale: 0.9 }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                textDecoration: "none", padding: "4px 16px",
                borderRadius: 12, position: "relative",
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: "absolute", inset: 0,
                    background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                    borderRadius: 12,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <i className={`ti ${item.icon}`} style={{
                fontSize: 20,
                color: active ? "var(--accent-primary)" : "var(--text-muted)",
                transition: "color 0.2s",
                position: "relative", zIndex: 1,
              }} />
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? "var(--accent-primary)" : "var(--text-muted)",
                position: "relative", zIndex: 1,
              }}>
                {item.label}
              </span>
            </motion.a>
          );
        })}
      </nav>
    </div>
  );
}