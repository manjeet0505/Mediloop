"use client";
import { AgentCard } from "@/components/ui/AgentCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AGENTS } from "@/lib/constants";

export function AgentsSection() {
  return (
    <section id="agents" className="mb-28">
      <SectionHeader
        tag="Agent Network"
        title="5 Autonomous Agents"
        desc="Each agent has one job, one tool set, one clear output. Hover to see tools."
        tagColor="var(--accent-secondary)"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </section>
  );
}