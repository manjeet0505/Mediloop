// "use client";
// import { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
// import { authService } from "@/lib/auth";
// import AddPatientModal from "@/components/patients/AddPatientModal";

// const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// const SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

// function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
//   const [val, setVal] = useState(0);
//   const prevTo = useRef<number | null>(null);
//   useEffect(() => {
//     if (prevTo.current === to) return;
//     prevTo.current = to;
//     const start = Date.now();
//     const tick = () => {
//       const progress = Math.min((Date.now() - start) / duration, 1);
//       const ease = 1 - Math.pow(1 - progress, 4);
//       setVal(ease * to);
//       if (progress < 1) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
//   }, [to, duration]);
//   return <>{Math.round(val)}</>;
// }

// /** Ambient glow that follows the cursor across the whole page */
// function MouseGlow() {
//   const mx = useMotionValue(-300);
//   const my = useMotionValue(-300);
//   const sx = useSpring(mx, { stiffness: 60, damping: 20 });
//   const sy = useSpring(my, { stiffness: 60, damping: 20 });

//   useEffect(() => {
//     const handler = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
//     window.addEventListener("mousemove", handler);
//     return () => window.removeEventListener("mousemove", handler);
//   }, []);

//   return (
//     <motion.div
//       style={{
//         position: "fixed", left: sx, top: sy, x: "-50%", y: "-50%",
//         width: 520, height: 520, borderRadius: "50%",
//         background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 10%, transparent) 0%, transparent 70%)",
//         pointerEvents: "none", zIndex: 1, filter: "blur(20px)",
//       }}
//     />
//   );
// }

// /** Card that subtly tilts in 3D toward the cursor */
// function TiltRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
//   const ref = useRef<HTMLDivElement>(null);
//   const rx = useMotionValue(0);
//   const ry = useMotionValue(0);
//   const srx = useSpring(rx, { stiffness: 300, damping: 24 });
//   const sry = useSpring(ry, { stiffness: 300, damping: 24 });

//   const handleMove = (e: React.MouseEvent) => {
//     const el = ref.current;
//     if (!el) return;
//     const rect = el.getBoundingClientRect();
//     const px = (e.clientX - rect.left) / rect.width - 0.5;
//     const py = (e.clientY - rect.top) / rect.height - 0.5;
//     ry.set(px * 4);
//     rx.set(-py * 4);
//   };
//   const handleLeave = () => { rx.set(0); ry.set(0); };

//   return (
//     <motion.div
//       ref={ref}
//       onMouseMove={handleMove}
//       onMouseLeave={handleLeave}
//       onClick={onClick}
//       style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
//     >
//       {children}
//     </motion.div>
//   );
// }

// /** Button that magnetically shifts toward the cursor */
// function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
//   const ref = useRef<HTMLButtonElement>(null);
//   const x = useMotionValue(0);
//   const y = useMotionValue(0);
//   const sx = useSpring(x, { stiffness: 200, damping: 16 });
//   const sy = useSpring(y, { stiffness: 200, damping: 16 });

//   const handleMove = (e: React.MouseEvent) => {
//     const el = ref.current;
//     if (!el) return;
//     const rect = el.getBoundingClientRect();
//     x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
//     y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
//   };
//   const handleLeave = () => { x.set(0); y.set(0); };

//   return (
//     <motion.button
//       ref={ref}
//       onMouseMove={handleMove}
//       onMouseLeave={handleLeave}
//       onClick={onClick}
//       whileTap={{ scale: 0.94 }}
//       style={{
//         x: sx, y: sy,
//         display: "flex", alignItems: "center", gap: 7, padding: "12px 22px",
//         borderRadius: 12, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
//         background: "var(--accent-gradient)", color: "var(--text-inverse)",
//         boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--accent-primary) 50%, transparent)",
//       }}
//     >
//       {children}
//     </motion.button>
//   );
// }

// function RotatingRingAvatar({ name, isNew }: { name: string; isNew: boolean }) {
//   const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
//   return (
//     <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
//       <motion.div
//         animate={{ rotate: 360 }}
//         transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
//         style={{
//           position: "absolute", inset: 0, borderRadius: "50%",
//           background: isNew
//             ? "conic-gradient(from 0deg, var(--accent-primary), transparent 60%, var(--accent-primary))"
//             : "conic-gradient(from 0deg, var(--border-default), transparent 70%, var(--border-default))",
//           padding: 1.5,
//         }}
//       >
//         <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--bg-page)" }} />
//       </motion.div>
//       <div style={{
//         position: "absolute", inset: 2, borderRadius: "50%",
//         background: "var(--bg-overlay)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         fontSize: 14, fontWeight: 600, color: "var(--text-secondary)",
//       }}>
//         {initials}
//       </div>
//     </div>
//   );
// }

// function PatientRow({ p, index }: { p: any; index: number }) {
//   const joinedDaysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
//   const isNew = joinedDaysAgo <= 7;

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
//       animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//       exit={{ opacity: 0, filter: "blur(4px)" }}
//       transition={{ ...SPRING, delay: 0.04 * index }}
//       style={{ borderBottom: "1px solid var(--border-subtle)" }}
//     >
//       <TiltRow onClick={() => window.location.href = `/dashboard/patients/${p.id}`}>
//         <motion.div
//           whileHover={{ x: 6, backgroundColor: "var(--bg-hover)" }}
//           transition={{ duration: 0.2 }}
//           style={{
//             display: "flex", alignItems: "center", gap: 16,
//             padding: "16px 12px", cursor: "pointer", borderRadius: 10,
//           }}
//         >
//           <RotatingRingAvatar name={p.full_name} isNew={isNew} />

//           <div style={{ flex: 1, minWidth: 0 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-primary)" }}>{p.full_name}</span>
//               {isNew && (
//                 <motion.span
//                   animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
//                   style={{
//                     fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
//                     background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
//                     color: "var(--accent-primary)", letterSpacing: "0.03em",
//                   }}
//                 >NEW</motion.span>
//               )}
//             </div>
//             <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{p.phone}</div>
//           </div>

//           <span style={{ fontSize: 13, color: "var(--text-muted)", width: 40, textAlign: "right" }}>{p.age ?? "—"}</span>
//           <span style={{ fontSize: 11, color: "var(--text-muted)", width: 24, textAlign: "center", textTransform: "uppercase" }}>{p.language}</span>
//           <span style={{ fontSize: 13, color: "var(--text-muted)", width: 80, textAlign: "right" }}>
//             {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
//           </span>
//           <motion.i className="ti ti-chevron-right"
//             whileHover={{ x: 3 }}
//             style={{ fontSize: 15, color: "var(--text-muted)", flexShrink: 0, opacity: 0.5 }} />
//         </motion.div>
//       </TiltRow>
//     </motion.div>
//   );
// }

// function HeroNumber({ value, loading }: { value: number; loading: boolean }) {
//   return (
//     <motion.h1
//       initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
//       animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//       transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
//       style={{
//         fontSize: 56, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
//         backgroundImage: "linear-gradient(135deg, var(--text-primary), color-mix(in srgb, var(--accent-primary) 60%, var(--text-primary)))",
//         WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
//       }}
//     >
//       {loading ? "—" : <CountUp to={value} />}
//     </motion.h1>
//   );
// }

// export default function PatientsPage() {
//   const [patients, setPatients] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [searchFocused, setSearchFocused] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       const token = authService.getToken();
//       if (!token) { window.location.href = "/login"; return; }
//       fetch(`${API}/api/v1/patients/`, { headers: { Authorization: `Bearer ${token}` } })
//         .then(r => r.json())
//         .then(d => setPatients(Array.isArray(d) ? d : []))
//         .catch(() => setPatients([]))
//         .finally(() => setLoading(false));
//     }, 100);
//     return () => clearTimeout(timer);
//   }, []);

//   const filtered = patients.filter(p =>
//     p.full_name.toLowerCase().includes(search.toLowerCase()) ||
//     p.phone.includes(search)
//   );

//   const activeCount = patients.filter(p => p.is_active).length;
//   const newThisWeek = patients.filter(p => {
//     const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
//     return days <= 7;
//   }).length;

//   return (
//     <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
//       <MouseGlow />

//       {/* ── Header ── */}
//       <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 16, position: "relative", zIndex: 2 }}>
//         <div>
//           <motion.p
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
//             style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}
//           >
//             Manage your patients
//           </motion.p>
//           <HeroNumber value={patients.length} loading={loading} />
//         </div>
//         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, ...SPRING }}>
//           <MagneticButton onClick={() => setModalOpen(true)}>
//             <i className="ti ti-plus" style={{ fontSize: 15 }} />
//             Add Patient
//           </MagneticButton>
//         </motion.div>
//       </div>

//       {/* ── Inline stats ── */}
//       <motion.div
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
//         style={{
//           display: "flex", gap: 28, marginBottom: 32, paddingBottom: 24,
//           borderBottom: "1px solid var(--border-subtle)", position: "relative", zIndex: 2,
//         }}
//       >
//         {[
//           { label: "active", value: activeCount, color: "var(--success)" },
//           { label: "new this week", value: newThisWeek, color: "var(--accent-primary)" },
//           { label: "inactive", value: patients.length - activeCount, color: "var(--text-muted)" },
//         ].map((s, i) => (
//           <motion.div key={i}
//             initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.35 + i * 0.06, ...SPRING }}
//           >
//             <div style={{ fontSize: 21, fontWeight: 600, color: s.color, letterSpacing: "-0.01em" }}>
//               {loading ? "—" : <CountUp to={s.value} />}
//             </div>
//             <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
//           </motion.div>
//         ))}
//       </motion.div>

//       {/* ── Search ── */}
//       <motion.div
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}
//         style={{ position: "relative", marginBottom: 8, zIndex: 2 }}
//       >
//         <div style={{
//           display: "flex", alignItems: "center", gap: 10, padding: "10px 2px",
//         }}>
//           <i className="ti ti-search" style={{ fontSize: 16, color: "var(--text-muted)" }} />
//           <input
//             value={search} onChange={e => setSearch(e.target.value)}
//             onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
//             placeholder="Search by name or phone..."
//             style={{
//               flex: 1, background: "transparent", border: "none",
//               outline: "none", fontSize: 15, color: "var(--text-primary)", fontFamily: "inherit",
//             }}
//           />
//           <AnimatePresence>
//             {search && (
//               <motion.button
//                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
//                 onClick={() => setSearch("")}
//                 style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
//               >
//                 <i className="ti ti-x" style={{ fontSize: 14 }} />
//               </motion.button>
//             )}
//           </AnimatePresence>
//         </div>
//         <div style={{ height: 1.5, background: "var(--border-subtle)", position: "relative" }}>
//           <motion.div
//             animate={{ scaleX: searchFocused ? 1 : 0 }}
//             transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
//             style={{
//               position: "absolute", inset: 0, background: "var(--accent-gradient)",
//               transformOrigin: "left", borderRadius: 2,
//             }}
//           />
//         </div>
//       </motion.div>

//       {/* ── List ── */}
//       <div style={{ position: "relative", zIndex: 2 }}>
//         {loading ? (
//           <div style={{ padding: "60px 0", textAlign: "center" }}>
//             <motion.div animate={{ rotate: 360 }}
//               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//               style={{
//                 width: 26, height: 26, borderRadius: "50%", margin: "0 auto",
//                 border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-primary)"
//               }} />
//           </div>
//         ) : filtered.length === 0 ? (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "60px 0", textAlign: "center" }}>
//             <i className="ti ti-users" style={{ fontSize: 36, color: "var(--text-muted)", display: "block", marginBottom: 10, opacity: 0.5 }} />
//             <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
//               {search ? "No patients match your search" : "No patients yet"}
//             </p>
//           </motion.div>
//         ) : (
//           <AnimatePresence mode="popLayout">
//             {filtered.map((p, i) => <PatientRow key={p.id} p={p} index={i} />)}
//           </AnimatePresence>
//         )}
//       </div>

//       <AddPatientModal
//         isOpen={modalOpen}
//         onClose={() => setModalOpen(false)}
//         onSuccess={(newPatient) => setPatients(prev => [newPatient, ...prev])}
//       />
//     </div>
//   );
// }