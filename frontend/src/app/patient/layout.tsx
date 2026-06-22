"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Home",          href: "/patient/dashboard",      icon: "ti-home" },
  { label: "Medicines",     href: "/patient/medicines",      icon: "ti-pill" },
  { label: "Prescriptions", href: "/patient/prescriptions",  icon: "ti-file-text" },
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
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)",
        }}
      >
        {initials}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 240, borderRadius: 12, overflow: "hidden",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                {user?.full_name ?? "Patient"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                {user?.email}
              </div>
              <span style={{
                fontSize: 10.5, padding: "2px 8px", borderRadius: 6,
                background: "var(--bg-overlay)", color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: "0.03em",
              }}>
                Patient
              </span>
            </div>
            <div style={{ padding: 6 }}>
              <a href="/patient/profile" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8,
                fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
              }}>
                <i className="ti ti-user-circle" style={{ fontSize: 16 }} />
                Profile
              </a>
              <a href="/patient/profile" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8,
                fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
              }}>
                <i className="ti ti-settings" style={{ fontSize: 16 }} />
                Settings
              </a>
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "6px 0" }} />
              <button onClick={() => authService.logout()} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "transparent", fontSize: 13, color: "var(--danger)",
                fontFamily: "inherit", textAlign: "left",
              }}>
                <i className="ti ti-logout" style={{ fontSize: 16 }} />
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
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 100%)"
        }} />
      </div>

      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "0 32px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "color-mix(in srgb, var(--bg-page) 88%, transparent)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <a href="/patient/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12.5, color: "var(--text-inverse)"
            }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>MedLoop</span>
          </a>

          <nav style={{ display: "flex", gap: 2 }} className="patient-desktop-nav">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <a key={item.href} href={item.href} style={{
                  position: "relative",
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", textDecoration: "none",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
                  {item.label}
                  {active && (
                    <motion.div layoutId="patient-nav-underline" style={{
                      position: "absolute", bottom: -1, left: 8, right: 8, height: 2,
                      background: "var(--accent-primary)", borderRadius: 1,
                    }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            style={{
              position: "relative", background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 9, padding: "7px 10px", cursor: "pointer",
              color: "var(--text-secondary)"
            }}>
            <i className="ti ti-bell" style={{ fontSize: 15 }} />
            <span style={{
              position: "absolute", top: 5, right: 5, width: 6, height: 6,
              borderRadius: "50%", background: "var(--danger)"
            }} />
          </motion.button>
          <div style={{ width: 1, height: 22, background: "var(--border-subtle)" }} />
          <ProfileMenu user={user} />
        </div>
      </header>

      <main style={{
        flex: 1, position: "relative", zIndex: 10,
        padding: "28px 32px 100px",
        maxWidth: 1320, margin: "0 auto", width: "100%",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

     <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "color-mix(in srgb, var(--bg-surface) 96%, transparent)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "8px 0 16px",
        zIndex: 30,
        display: "flex", justifyContent: "space-around", alignItems: "center",
      }} className="patient-mobile-nav">
        {[...NAV_ITEMS, { label: "Profile", href: "/patient/profile", icon: "ti-user" }].map((item) => {
          const active = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              textDecoration: "none", padding: "4px 14px",
            }}>
              <i className={`ti ${item.icon}`} style={{
                fontSize: 19, color: active ? "var(--accent-primary)" : "var(--text-muted)",
              }} />
              <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 400, color: active ? "var(--accent-primary)" : "var(--text-muted)" }}>
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