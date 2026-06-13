"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: "ti-layout-dashboard" },
  { label: "Patients", href: "/dashboard/patients", icon: "ti-users" },
  { label: "Reminders", href: "/dashboard/reminders", icon: "ti-bell" },
  { label: "Stock", href: "/dashboard/stock", icon: "ti-package" },
  { label: "Prescriptions", href: "/dashboard/prescriptions", icon: "ti-file-text" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "ti-chart-bar" },
];

const BOTTOM_NAV = [
  { label: "Settings", href: "/dashboard/settings", icon: "ti-settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertCount] = useState(3);

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.push("/login");
      return;
    }
    setUser(authService.getUser());
  }, []);

  if (!user) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg-page)"
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid var(--border-subtle)",
          borderTop: "2px solid var(--accent-primary)"
        }}
      />
    </div>
  );

  const initials = user.full_name
    ?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "ML";

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "var(--bg-page)", color: "var(--text-primary)"
    }}>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, bottom: 0,
          zIndex: 30, overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10, flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: "var(--text-inverse)"
            }}>M</div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    MedLoop AI
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {user.clinic_name ?? "Clinic"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 4, flexShrink: 0
            }}
          >
            <i className={`ti ${sidebarOpen ? "ti-layout-sidebar-left-collapse" : "ti-layout-sidebar-left-expand"}`}
              style={{ fontSize: 16 }} />
          </motion.button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {sidebarOpen && (
            <div style={{
              fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.12em", padding: "4px 10px 8px",
              fontFamily: "monospace"
            }}>
              Main
            </div>
          )}
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <motion.a
                key={item.href}
                href={item.href}
                whileHover={{ x: 2 }}
                style={{
                  display: "flex", alignItems: "center",
                  gap: 10, padding: sidebarOpen ? "9px 12px" : "9px 16px",
                  borderRadius: 8, marginBottom: 2, textDecoration: "none",
                  background: active ? "color-mix(in srgb, var(--accent-primary) 12%, transparent)" : "transparent",
                  border: active ? `1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)` : "1px solid transparent",
                  color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  transition: "all 0.15s", position: "relative",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.label === "Patients" && alertCount > 0 && (
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        style={{
                          marginLeft: "auto", fontSize: 9, padding: "2px 6px",
                          borderRadius: 10, fontFamily: "monospace",
                          background: "color-mix(in srgb, var(--danger) 15%, transparent)",
                          color: "var(--danger)",
                        }}
                      >
                        {alertCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </motion.a>
            );
          })}

          <div style={{ margin: "12px 0 4px", height: 1, background: "var(--border-subtle)" }} />

          {sidebarOpen && (
            <div style={{
              fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.12em", padding: "8px 10px 8px",
              fontFamily: "monospace"
            }}>
              System
            </div>
          )}
          {BOTTOM_NAV.map((item) => (
            <motion.a key={item.href} href={item.href} whileHover={{ x: 2 }}
              style={{
                display: "flex", alignItems: "center",
                gap: 10, padding: sidebarOpen ? "9px 12px" : "9px 16px",
                borderRadius: 8, marginBottom: 2, textDecoration: "none",
                color: "var(--text-muted)", fontSize: 13,
                justifyContent: sidebarOpen ? "flex-start" : "center",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.a>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: "12px 8px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: sidebarOpen ? "8px 10px" : "8px",
            borderRadius: 8,
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
            justifyContent: sidebarOpen ? "flex-start" : "center",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "var(--text-inverse)"
            }}>
              {initials}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {user.role}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => authService.logout()}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 4, flexShrink: 0
                  }}
                  title="Logout"
                >
                  <i className="ti ti-logout" style={{ fontSize: 15 }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content area ── */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? 240 : 64,
        transition: "margin-left 0.3s",
        display: "flex", flexDirection: "column", minHeight: "100vh"
      }}>

        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 56,
          background: "color-mix(in srgb, var(--bg-page) 85%, transparent)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Breadcrumb */}
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>MedLoop</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {NAV.find(n => n.href === pathname)?.label ?? "Dashboard"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 14px", borderRadius: 8,
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              fontSize: 12, color: "var(--text-muted)", cursor: "pointer"
            }}>
              <i className="ti ti-search" style={{ fontSize: 14 }} />
              <span>Search...</span>
              <span style={{
                fontSize: 10, padding: "1px 5px", borderRadius: 4,
                background: "var(--bg-hover)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "monospace", color: "var(--text-muted)"
              }}>⌘K</span>
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                position: "relative", background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                color: "var(--text-secondary)"
              }}
            >
              <i className="ti ti-bell" style={{ fontSize: 16 }} />
              {alertCount > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--danger)"
                }} />
              )}
            </motion.button>

            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}