"use client";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TECH_STACK } from "@/lib/constants";

export function StackSection() {
  return (
    <section id="stack" className="mb-28">
      <SectionHeader
        tag="Infrastructure"
        title="Production Stack"
        desc="Zero paid infrastructure. Every layer on free tier."
        tagColor="#06b6d4"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TECH_STACK.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring" }}
            whileHover={{ scale: 1.02, boxShadow: `0 20px 60px ${s.color}12` }}
            className="rounded-2xl p-6 relative overflow-hidden group"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 30% 30%,${s.color}08 0%,transparent 60%)` }}
            />
            <div className="text-xs font-mono uppercase tracking-widest mb-5 relative z-10"
              style={{ color: s.color }}>
              {s.cat}
            </div>
            <div className="flex flex-wrap gap-2 relative z-10">
              {s.items.map((item, j) => (
                <motion.span key={j}
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="text-sm px-3 py-1.5 rounded-xl font-medium cursor-default"
                  style={{ background: `${s.color}10`, color: s.color, border: `1px solid ${s.color}18` }}>
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}