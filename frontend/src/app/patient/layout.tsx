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
      router.push("/login?role=patient");
      return;
    }
    setUser(authService.getUser());
  }, []);

  if (!mounted) return null;

  const initials = user?.full_name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "P";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <motion.div
          style={{
            position: "absolute", top: "-10%", left: "20%", width: 600, height: 600,
            borderRadius: "50%", background: "radial-gradient(circle, var(--orb-primary) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          style={{
            position: "absolute", bottom: "0%", right: "10%", width: 500, height: 500,
            borderRadius: "50%", background: "radial-gradient(circle, var(--orb-secondary) 0%, transparent 70%)",
            filter: "blur(70px)"
          }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 100%)"
        }} />
      </div>

      {/* ── Top header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "color-mix(in srgb, var(--bg-page) 85%, transparent)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 14, color: "var(--text-inverse)"
            }}>M</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                MedLoop
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                Patient Portal
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: "flex", gap: 4 }} className="patient-desktop-nav">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <motion.a key={item.href} href={item.href}
                  whileHover={{ y: -1 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 14px", borderRadius: 10, textDecoration: "none",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "var(--accent-primary)" : "var(--text-muted)",
                    background: active ? "color-mix(in srgb, var(--accent-primary) 10%, transparent)" : "transparent",
                  }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
                  {item.label}
                </motion.a>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{
              position: "relative", background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10, padding: "8px 11px", cursor: "pointer",
              color: "var(--text-secondary)"
            }}
          >
            <i className="ti ti-bell" style={{ fontSize: 16 }} />
            <span style={{
              position: "absolute", top: 6, right: 6,
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--danger)"
            }} />
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "var(--accent-primary)", cursor: "pointer"
            }}
            onClick={() => authService.logout()}
            title="Logout"
          >
            {initials}
          </motion.div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{
        flex: 1, position: "relative", zIndex: 10,
        padding: "32px 32px 100px",
        maxWidth: 1400, margin: "0 auto", width: "100%",
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

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="patient-mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
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
            <motion.a key={item.href} href={item.href} whileTap={{ scale: 0.9 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                textDecoration: "none", padding: "4px 16px", borderRadius: 12, position: "relative",
              }}>
              <i className={`ti ${item.icon}`} style={{
                fontSize: 20, color: active ? "var(--accent-primary)" : "var(--text-muted)",
              }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
                {item.label}
              </span>
            </motion.a>
          );
        })}
      </nav>

      <style jsx global>{`
        .patient-mobile-nav { display: none; }
        @media (max-width: 768px) {
          .patient-desktop-nav { display: none !important; }
          .patient-mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}