"use client";
import { motion } from "framer-motion";

interface Props {
  tag: string;
  title: string;
  desc: string;
  tagColor?: string;
}

export function SectionHeader({ tag, title, desc, tagColor = "var(--accent-primary)" }: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }} transition={{ type: "spring", stiffness: 80 }}
      className="mb-12">
      <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: tagColor }}>{tag}</div>
     <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight" style={{ color: "var(--text-primary)" }}>{title}</h2>
      <p className="text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
    </motion.div>
  );
}