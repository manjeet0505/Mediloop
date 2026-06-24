"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Home",          href: "/patient/dashboard",  icon: "ti-home" },
  { label: "Medicines",     href: "/patient/medicines",  icon: "ti-pill" },
  { label: "Prescriptions", href: "/patient/prescriptions", icon: "ti-file-text" },
];

function ProfileMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = user?.full_name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "P";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12.5, fontWeight: 600, color: "#fff",
        }}
      >
        {initials}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 240, borderRadius: 14, overflow: "hidden",
              background: "rgba(15,15,30,0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                {user?.full_name ?? "Patient"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                {user?.email}
              </div>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 6,
                background: "rgba(99,102,241,0.2)", color: "#818cf8",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                Patient
              </span>
            </div>
            <div style={{ padding: 6 }}>
              {[
                { label: "Profile", icon: "ti-user-circle", href: "/patient/profile" },
                { label: "Settings", icon: "ti-settings", href: "/patient/profile" },
              ].map((item, i) => (
                <a key={i} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8,
                  fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none",
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
                  {item.label}
                </a>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
              <button onClick={() => authService.logout()} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "transparent", fontSize: 13, color: "#f87171",
                fontFamily: "inherit", textAlign: "left",
              }}>
                <i className="ti ti-logout" style={{ fontSize: 15 }} />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  return (
    <div style={{
      minHeight: "100vh",
      background: "transparent",
      color: "#e2e8f0",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Animated background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        {/* Deep base */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #07080f 0%, #0d0f1e 40%, #080d1a 70%, #050508 100%)",
        }} />

        {/* Orb 1 — indigo */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "-5%", left: "10%",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />

        {/* Orb 2 — violet */}
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{
            position: "absolute", top: "30%", right: "5%",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />

        {/* Orb 3 — cyan */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          style={{
            position: "absolute", bottom: "5%", left: "25%",
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />

        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(7,8,15,0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <a href="/patient/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12.5, color: "#fff",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>MedLoop</span>
          </a>

          <nav style={{ display: "flex", gap: 2 }} className="patient-desktop-nav">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <a key={item.href} href={item.href} style={{
                  position: "relative",
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", textDecoration: "none",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  borderRadius: 8,
                  transition: "color 0.2s",
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
                  {item.label}
                  {active && (
                    <motion.div layoutId="patient-nav-underline" style={{
                      position: "absolute", bottom: -1, left: 8, right: 8, height: 2,
                      background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      borderRadius: 1,
                    }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            style={{
              position: "relative",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, padding: "7px 10px", cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
            }}>
            <i className="ti ti-bell" style={{ fontSize: 15 }} />
            <span style={{
              position: "absolute", top: 5, right: 5,
              width: 6, height: 6, borderRadius: "50%",
              background: "#ef4444",
            }} />
          </motion.button>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)" }} />
          <ProfileMenu user={user} />
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{
        flex: 1, position: "relative", zIndex: 10,
        padding: "28px 32px 100px",
        maxWidth: 1320, margin: "0 auto", width: "100%",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile nav ── */}
      <nav className="patient-mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(7,8,15,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 0 16px",
        zIndex: 30,
        display: "flex", justifyContent: "space-around", alignItems: "center",
      }}>
        {[...NAV_ITEMS, { label: "Profile", href: "/patient/profile", icon: "ti-user" }].map((item) => {
          const active = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              textDecoration: "none", padding: "4px 14px",
            }}>
              <i className={`ti ${item.icon}`} style={{
                fontSize: 19,
                color: active ? "#818cf8" : "rgba(255,255,255,0.35)",
              }} />
              <span style={{
                fontSize: 9.5, fontWeight: active ? 600 : 400,
                color: active ? "#818cf8" : "rgba(255,255,255,0.35)",
              }}>
                {item.label}
              </span>
            </a>
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