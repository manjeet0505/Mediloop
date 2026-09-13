# 🩺 MedLoop AI — Autonomous Patient Care Platform

> India's first fully autonomous, multi-agent patient care system — built on **Anthropic Claude SDK**, **LangGraph**, and **MCP**.

MedLoop AI closes the gap between *what a doctor prescribes* and *what a patient actually does*. A network of 5 coordinated AI agents reads prescriptions, sends adherence reminders, predicts medicine stock-outs, monitors vitals, and books follow-ups — end to end, with zero manual tracking.

<p align="left">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-71%25-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-26.9%25-3776AB?style=flat-square&logo=python&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/status-in--development-orange?style=flat-square">
</p>

---

## 🎯 The Problem

| # | Current State (Broken) | MedLoop AI Fix |
|---|---|---|
| 1 | Doctor writes on paper, patient forgets instructions | **Agent 1** reads the prescription via OCR + Claude → digital care plan |
| 2 | Patient misses doses, no tracking exists | **Agent 2** sends WhatsApp reminders, logs every dose, escalates on 3+ misses |
| 3 | Medicines run out silently | **Agent 3** predicts depletion 7 days early, auto-reorders with one-tap approval |
| 4 | Doctor has zero visibility between visits | **Agent 4** generates weekly health summaries, sent automatically |
| 5 | Patient skips follow-up, condition worsens | **Agent 5** auto-books the next appointment + sends a pre-visit brief |

**Why it matters:** medication non-adherence costs **$528B globally** every year and is the #1 cause of preventable deaths. India has 100M+ diabetics and 200M+ hypertension patients, against a doctor-to-patient ratio of 1:1,457 (WHO recommends 1:1,000) — and today, **no fully agentic system exists in the Indian market**.

---

## 🤖 The 5-Agent Architecture

Each agent has **one job, one tool set, one clear output** — orchestrated as a stateful directed graph in LangGraph.

### 1️⃣ Prescription Intelligence Agent
- **Input:** Prescription photo (WhatsApp / clinic upload)
- **Pipeline:** Tesseract OCR → Claude (extended thinking) parses medicine, dose, frequency, duration
- **Safety gate:** Flags unusual dosages for pharmacist review before activating any schedule
- **Output:** Structured JSON care plan

### 2️⃣ Adherence & Reminder Agent
- Personalised WhatsApp (+ Twilio SMS fallback) reminders in Hindi/English/regional languages
- Tracks `adherence_score`, `missed_count`, `escalation_level` in LangGraph state
- Escalation: 3 missed doses → family alert · 7 missed → doctor alert
- Patient confirms a dose taken with a single WhatsApp reply (`1`)

### 3️⃣ Stock Monitor & Reorder Agent
- Calculates real remaining medicine days from **actual** consumption, not prescribed schedule
- 7-day early stock-out warning with confidence interval
- Human-approval gate over WhatsApp → auto-orders via Pharmeasy / Tata 1mg → Razorpay checkout

### 4️⃣ Health Monitoring & Intelligence Agent
- RAG over a Qdrant clinical-guidelines vector store to interpret vitals/wearable data
- Detects trends (rising BP, glucose spikes, missed-dose correlations)
- Weekly PDF health summary to patient + doctor; instant alert on critical vitals
- Integrates with **ABHA** (Ayushman Bharat Digital Mission)

### 5️⃣ Follow-Up Coordinator Agent
- Books the next appointment automatically 3 days before it's due
- Generates a structured pre-visit brief for the doctor (adherence %, vitals trend, concerns)
- On a new prescription post-visit → re-triggers Agent 1, restarting the loop

---

## 🔁 LangGraph Orchestration

```python
class MedLoopState(TypedDict):
    patient_id: str
    prescription_raw: str            # Raw OCR text
    care_plan: list[MedicationItem]  # Agent 1 output
    adherence_log: list[DoseEvent]   # Agent 2 output
    stock_levels: dict[str, int]     # Agent 3 output
    health_metrics: list[VitalSign]  # Agent 4 output
    next_appointment: datetime       # Agent 5 output
    escalation_level: int            # 0=normal 1=family 2=doctor 3=emergency
    human_approvals: list[Approval]  # Human-in-the-loop gates
    language: str                    # hi / en / ta / te / bn
```

**Flow:** `prescription_reader → (human_review_gate?) → adherence_scheduler → stock_monitor ⇄ health_monitor → weekly_summary → followup_coordinator → loop`

Human-in-the-loop gates sit at two critical points: unsafe/ambiguous dosage review, and patient reorder approval.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| LLM Core | Anthropic Claude SDK (`claude-sonnet-4-6`) — extended thinking for prescription safety |
| Agent Orchestration | LangGraph — stateful graph, human-in-the-loop, parallel agent runs |
| Context Protocol | MCP — connects agents to clinic EHR, pharmacy APIs |
| Backend | FastAPI (Python) |
| Frontend | Next.js 14 + Tailwind CSS |
| Vector DB | Qdrant — drug embeddings + clinical guideline RAG |
| Relational DB | PostgreSQL — patients, doctors, prescriptions, billing |
| Time-series DB | TimescaleDB — vitals over time |
| Cache / Sessions | Redis |
| Background Jobs | Celery + Redis |
| Object Storage | S3 / Cloudflare R2 |
| Observability | LangSmith |
| Deployment | Vercel (frontend) + Render/Fly.io (backend) |

### External Integrations
Anthropic Claude SDK · WhatsApp Business API · Twilio SMS · Pharmeasy API · Tata 1mg API · Razorpay · ABHA (Ayushman Bharat) · Google Calendar API · Tesseract OCR · LangSmith

---

## 📁 Repository Structure

```
Mediloop/
├── backend/     # FastAPI + LangGraph agents, Qdrant, Postgres
└── frontend/    # Next.js 14 clinic dashboard + patient interface
```

---

## 🗺️ Build Roadmap

| Week | Phase | Deliverable |
|---|---|---|
| 1 | Foundation | FastAPI skeleton, Postgres schema, Redis, Claude SDK + LangGraph setup |
| 2 | Agent 1 | OCR pipeline, prescription parser, safety flags |
| 3 | Agent 2 | WhatsApp reminders, multilingual templates, dose logging |
| 4 | Agent 3 | Stock predictor, Pharmeasy integration, approval gate |
| 5 | Agent 4 | Qdrant RAG, vitals ingestion, PDF summaries |
| 6 | Agent 5 | Calendar booking, pre-visit brief, post-visit loop |
| 7 | Orchestration | Full LangGraph state machine, HITL gates |
| 8 | Frontend | Clinic dashboard, patient WhatsApp interface, doctor view |
| 9 | Testing | Security hardening, e2e agent testing, LangSmith tracing |
| 10 | Pilot | Onboard first clinics, collect feedback |

**Current focus:** Core loop — Agents 1 + 2 + 3 (prescription → reminder → reorder).

---

## 💰 Business Model

| Tier | Target | Price | Includes |
|---|---|---|---|
| Starter | Solo doctor / small clinic | ₹3,000/mo | Agents 1+2+3 |
| Pro | Multi-doctor clinic | ₹8,000/mo | All 5 agents |
| Enterprise | Hospital / diagnostic chain | ₹25,000/mo | Full platform + white-label + EHR via MCP |
| Pharmacy Commission | Pharmeasy / 1mg | 3–5% per order | Passive revenue on every reorder |

---

## 🚀 Getting Started

```bash
# clone
git clone https://github.com/manjeet0505/Mediloop.git
cd Mediloop

# backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# frontend
cd ../frontend
npm install
npm run dev
```

Add your environment variables (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `QDRANT_URL`, `WHATSAPP_TOKEN`, etc.) to `.env` in both `backend/` and `frontend/`.

---

## 👨‍💻 Author

**Manjeet Kumar Mishra**
B.Tech CS, Maharshi Dayanand University — University Rank 1
[GitHub](https://github.com/manjeet0505)

---

<p align="center"><i>Built to solve a real problem for 300M+ chronic disease patients in India — with zero agentic competition today.</i></p>
