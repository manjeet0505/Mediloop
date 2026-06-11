"use client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { DemoSection } from "@/components/sections/DemoSection";
import { AgentsSection } from "@/components/sections/AgentsSection";
import { MarketSection } from "@/components/sections/MarketSection";
import { StackSection } from "@/components/sections/StackSection";
import { Particles } from "@/components/ui/Particles";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Particles />
      <Navbar />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <Hero />
        <DemoSection />
        <AgentsSection />
        <MarketSection />
        <StackSection />
        <Footer />
      </div>
    </div>
  );
}