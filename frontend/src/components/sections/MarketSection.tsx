"use client";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MARKET_STATS } from "@/lib/constants";

export function MarketSection() {
  return (
    <section id="market" className="mb-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl p-10 md:p-16 relative overflow-hidden"
        style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
         backgroundImage: `radial-gradient(circle at 15% 50%,var(--orb-primary) 0%,transparent 50%),radial-gradient(circle at 85% 50%,var(--orb-secondary) 0%,transparent 50%)`
        }} />
        <motion.div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: `radial-gradient(circle,var(--orb-secondary) 0%,transparent 70%)` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative z-10">
          <SectionHeader
            tag="Why This Exists"
            title="The Problem Is Massive"
            desc="India's healthcare system is broken. MedLoop AI fixes the adherence gap."
            tagColor="var(--accent-secondary)"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {MARKET_STATS.map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black mb-2 leading-none" style={{ color: m.c }}>
                  {m.v}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{m.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}