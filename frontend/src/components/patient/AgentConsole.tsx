"use client";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Agent 1 · Prescription Parser — idle, last run 3h ago",
  "Agent 2 · Reminder Engine — next dose scheduled in 40m",
  "Agent 3 · Stock Monitor — scanning inventory levels...",
  "Agent 4 · Health Tracker — vitals within normal range",
  "Agent 5 · Follow-up Coordinator — appointment confirmed",
];

export default function AgentConsole() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    setTyped("");
    const full = MESSAGES[msgIndex];
    const typeId = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeId);
        setTimeout(() => setMsgIndex((p) => (p + 1) % MESSAGES.length), 2200);
      }
    }, 22);
    return () => clearInterval(typeId);
  }, [msgIndex]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 11.5, color: "#4a4a4a",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: "#10b981", boxShadow: "0 0 6px #10b981",
        flexShrink: 0,
      }} />
      <span>{typed}<span style={{ opacity: 0.5 }}>▍</span></span>
    </div>
  );
}