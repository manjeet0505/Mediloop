"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import AmbientBackground from "@/components/patient/AmbientBackground";
import AgentConsole from "@/components/patient/AgentConsole";

const NAV_ITEMS = [
  { label: "Overview", href: "/patient/dashboard" },
  { label: "Medicines", href: "/patient/medicines" },
  { label: "Prescriptions", href: "/patient/prescriptions" },
  { label: "Vitals", href: "/patient/profile" },
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
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
          background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "inherit",
        }}>
        {initials}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 220, borderRadius: 12,
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              zIndex: 50, overflow: "hidden",
            }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                {user?.full_name ?? "Patient"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{user?.email}</div>
            </div>
            <div style={{ padding: 6 }}>
              {[
                { label: "Profile", href: "/patient/profile" },
                { label: "Settings", href: "/patient/profile" },
              ].map((item, i) => (
                <a key={i} href={item.href} style={{
                  display: "block", padding: "8px 10px", borderRadius: 7,
                  fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
                }}>
                  {item.label}
                </a>
              ))}
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
              <button onClick={() => authService.logout()} style={{
                display: "block", width: "100%", padding: "8px 10px", borderRadius: 7,
                border: "none", background: "transparent", fontSize: 13,
                color: "var(--danger)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              }}>
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
    if (!authService.isLoggedIn()) { router.push("/login"); return; }
    setUser(authService.getUser());
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      <AmbientBackground accent="var(--accent-primary)" glowY={22} />
      {/* Top nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: "1px solid var(--border-subtle)",
        background: "color-mix(in srgb, var(--bg-page) 90%, transparent)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 32px", height: 52,
          display: "flex", alignItems: "center", gap: 40,
        }}>
          {/* Logo */}
          <a href="/patient/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "var(--text-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 11, color: "var(--bg-page)",
            }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>MedLoop</span>
          </a>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 0, flex: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <a key={item.href} href={item.href} style={{
                  padding: "0 14px", height: 52, display: "flex", alignItems: "center",
                  fontSize: 13, textDecoration: "none",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: active ? "1px solid var(--text-primary)" : "1px solid transparent",
                  transition: "color 0.15s",
                  marginBottom: "-1px",
                }}>
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{
              position: "relative", background: "transparent",
              border: "1px solid var(--border-subtle)", borderRadius: 7,
              padding: "5px 8px", cursor: "pointer", color: "var(--text-muted)",
            }}>
              <i className="ti ti-bell" style={{ fontSize: 14 }} />
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 5, height: 5, borderRadius: "50%", background: "var(--danger)",
              }} />
            </button>
            <div style={{ width: 1, height: 18, background: "var(--border-subtle)" }} />
            <ProfileMenu user={user} />
          </div>
        </div>

        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 32px 10px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <div style={{ paddingTop: 8 }}>
            <AgentConsole />
          </div>
        </div>
      </header>

      {/* Page */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <style jsx global>{`
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}