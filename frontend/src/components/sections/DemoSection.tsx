"use client";
import { motion } from "framer-motion";
import { PrescriptionDemo } from "@/components/demo/PrescriptionDemo";
import { StockDemo } from "@/components/demo/StockDemo";
import { Terminal } from "@/components/demo/Terminal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function DemoSection() {
  return (
    <section id="demo" className="mb-28">
      <SectionHeader
        tag="Live Demo"
        title="Try It Right Now"
        desc="Real API calls to your FastAPI backend. No mocking. No fake data."
        tagColor="var(--accent-primary)"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <PrescriptionDemo />
        <StockDemo />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="text-xs font-mono mb-3 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Agent Activity Feed — Simulated
        </div>
        <Terminal />
      </motion.div>
    </section>
  );
}