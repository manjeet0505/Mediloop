export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const AGENTS = [
  {
    id: "01",
    name: "Prescription Intelligence",
    short: "OCR + AI Parse",
    desc: "Tesseract OCR extracts text from handwritten prescriptions. GPT-4o structures it into a JSON care plan with safety gate validation.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.3)",
    endpoint: "/api/v1/prescription/parse",
    tools: ["Tesseract OCR", "GPT-4o-mini", "FastAPI", "Safety Gate"],
  },
  {
    id: "02",
    name: "Adherence & Reminder",
    short: "Smart Escalation",
    desc: "APScheduler fires WhatsApp reminders in Hindi/English. 3-tier escalation: 3 misses → family, 7 misses → doctor alert.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.3)",
    endpoint: "/api/v1/reminder/schedule",
    tools: ["APScheduler", "WhatsApp API", "Upstash Redis", "LangGraph"],
  },
  {
    id: "03",
    name: "Stock Monitor",
    short: "7-Day Prediction",
    desc: "Calculates exact depletion date from actual consumption. Sends one-tap reorder approval via WhatsApp with Pharmeasy/1mg links.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    endpoint: "/api/v1/stock/check",
    tools: ["Pharmeasy API", "1mg API", "FastAPI", "Neon DB"],
  },
  {
    id: "04",
    name: "Health Monitor",
    short: "RAG + Vitals",
    desc: "Qdrant RAG queries clinical guidelines for anomaly detection. Generates weekly PDF health summaries sent to patient and doctor.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    endpoint: "/api/v1/health/vitals",
    tools: ["Qdrant", "RAG Pipeline", "ReportLab", "ABHA API"],
  },
  {
    id: "05",
    name: "Follow-up Coordinator",
    short: "Auto Booking",
    desc: "Books clinic appointments 3 days before due date. Generates pre-visit doctor brief with adherence %, vitals trend, concerns.",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.3)",
    endpoint: "/api/v1/followup/book",
    tools: ["Google Calendar", "GPT-4o", "LangGraph", "MCP"],
  },
];

export const TECH_STACK = [
  { cat: "AI Core", color: "#6366f1", items: ["GPT-4o-mini", "LangGraph", "LangChain", "LangSmith"] },
  { cat: "Backend", color: "#06b6d4", items: ["FastAPI", "Python 3.12", "APScheduler", "Pydantic"] },
  { cat: "Database", color: "#10b981", items: ["Neon PostgreSQL", "Upstash Redis", "Qdrant Vector DB"] },
  { cat: "Integrations", color: "#f59e0b", items: ["WhatsApp Business API", "Pharmeasy", "1mg", "Google Calendar", "ABHA API"] },
  { cat: "Frontend", color: "#8b5cf6", items: ["Next.js 14", "Tailwind CSS", "Framer Motion", "TypeScript"] },
  { cat: "DevOps", color: "#ec4899", items: ["Vercel", "Render", "GitHub Actions", "LangSmith Tracing"] },
];

export const MARKET_STATS = [
  { v: "₹65,000 Cr", l: "India Healthcare AI Market", c: "#6366f1" },
  { v: "$528B", l: "Annual Non-Adherence Cost", c: "#8b5cf6" },
  { v: "1:1,457", l: "Doctor-Patient Ratio India", c: "#06b6d4" },
  { v: "ZERO", l: "Agentic Competitors in India", c: "#10b981" },
];