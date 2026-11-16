"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import ClinicAmbientBackground from "@/components/ClinicAmbientBackground";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

function ProfileDropdown({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = user?.full_name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() ?? "MK";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
          background: "var(--accent-gradient)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "var(--text-inverse)",
        }}
      >
        {initials}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 220, borderRadius: 12, zIndex: 50, overflow: "hidden",
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              boxShadow: "0 16px 40px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                {user?.full_name ?? "Clinic Admin"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{user?.email}</div>
              {user?.clinic_name && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{user.clinic_name}</div>
              )}
            </div>
            <div style={{ padding: 6 }}>
              {[
                { label: "Settings", icon: "ti-settings", href: "/dashboard/settings" },
              ].map((item, i) => (
                <a key={i} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 10px", borderRadius: 8,
                  fontSize: 13, color: "var(--text-secondary)", textDecoration: "none",
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 14 }} />
                  {item.label}
                </a>
              ))}
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
              <button onClick={() => authService.logout()} style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "9px 10px", borderRadius: 8,
                border: "none", background: "transparent", fontSize: 13,
                color: "var(--danger)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              }}>
                <i className="ti ti-logout" style={{ fontSize: 14 }} />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const ensureLoaded = () => {
    if (loaded) return;
    const token = authService.getToken();
    if (!token) return;
    fetch(`${API}/api/v1/patients/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPatients(Array.isArray(d) ? d : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  };

  const results = query.trim()
    ? patients.filter(p =>
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.phone.includes(query)
      ).slice(0, 6)
    : [];

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        onClick={() => { setOpen(true); ensureLoaded(); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 8, minWidth: 200,
          background: "var(--bg-overlay)",
          border: `1px solid ${open ? "var(--accent-primary)" : "var(--border-subtle)"}`,
          fontSize: 12, color: "var(--text-muted)", cursor: "text",
          transition: "border-color 0.15s",
        }}
      >
        <i className="ti ti-search" style={{ fontSize: 14, flexShrink: 0 }} />
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 12, color: "var(--text-primary)", fontFamily: "inherit",
            }}
          />
        ) : (
          <span>Search...</span>
        )}
        <span style={{
          fontSize: 10, padding: "1px 5px", borderRadius: 4,
          background: "var(--bg-hover)", border: "1px solid var(--border-subtle)",
          fontFamily: "monospace", color: "var(--text-muted)", flexShrink: 0,
        }}>⌘K</span>
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
              background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
              borderRadius: 12, overflow: "hidden", zIndex: 60,
              boxShadow: "0 16px 40px -12px rgba(0,0,0,0.4)",
            }}
          >
            {results.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                No patients found
              </div>
            ) : (
              results.map(p => (
                <a key={p.id} href={`/dashboard/patients/${p.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", textDecoration: "none",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 600, color: "var(--accent-primary)", flexShrink: 0,
                  }}>
                    {p.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, color: "var(--text-primary)" }}>{p.full_name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{p.phone}</div>
                  </div>
                </a>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        <ClinicAmbientBackground />
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
        display: "flex", flexDirection: "column", minHeight: "100vh",
        position: "relative", zIndex: 1
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
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>MedLoop</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {NAV.find(n => n.href === pathname)?.label ?? "Dashboard"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TopSearch />

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

            <div style={{ width: 1, height: 20, background: "var(--border-subtle)" }} />

            <ProfileDropdown user={user} />
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