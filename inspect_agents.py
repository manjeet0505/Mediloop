#!/usr/bin/env python3
"""
MedLoop AI - Agent + Frontend Wiring Inspector

Run from project root:
    python inspect_agents.py

Dumps:
  1. The actual agent implementation files (stock_agent, reminder_agent,
     dose_service, prescription_agent) so we can see if they're real
     (DB/API calls) or in-memory/mock.
  2. Every scheduler / background job file (looks for APScheduler, Celery,
     cron, "while True", asyncio loops) so we find the real reminder ticker.
  3. Every place frontend/src/lib/api.ts and hooks/useApi.ts call
     /stock or /reminder endpoints, so we know which backend path
     (real vs mock) the UI is actually wired to.

No files are modified.
"""

from pathlib import Path
import re

AGENT_FILES = [
    "backend/app/agents/stock_agent.py",
    "backend/app/agents/reminder_agent.py",
    "backend/app/agents/prescription_agent.py",
    "backend/app/services/dose_service.py",
]

SCHEDULER_HINTS = re.compile(
    r"APScheduler|BackgroundScheduler|celery|@repeat|schedule\.every|"
    r"asyncio\.sleep|while True|cron|send_due_reminders", re.IGNORECASE
)

def dump_files():
    root = Path(".").resolve()
    for rel in AGENT_FILES:
        f = root / rel
        print("\n" + "#" * 80)
        print(f"# FILE: {rel}")
        print("#" * 80)
        if not f.exists():
            print("  (not found at this path)")
            continue
        for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            print(f"{i:4}| {line}")

def find_schedulers():
    root = Path(".").resolve()
    print("\n" + "=" * 80)
    print("FILES THAT LOOK LIKE THEY RUN A BACKGROUND SCHEDULER/TICKER")
    print("=" * 80)
    hit = False
    for f in root.rglob("*.py"):
        if any(x in f.parts for x in ("node_modules", ".git", "venv", "__pycache__")):
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if SCHEDULER_HINTS.search(text):
            hit = True
            rel = f.relative_to(root)
            print(f"\n--- {rel} ---")
            for i, line in enumerate(text.splitlines(), 1):
                if SCHEDULER_HINTS.search(line):
                    print(f"  L{i}: {line.strip()[:120]}")
    if not hit:
        print("(none found)")

def grep_frontend_calls():
    root = Path(".").resolve()
    print("\n" + "=" * 80)
    print("FRONTEND CALLS TO /stock OR /reminder ENDPOINTS")
    print("=" * 80)
    targets = [root / "frontend/src/lib/api.ts", root / "frontend/src/hooks/useApi.ts"]
    for f in targets:
        print(f"\n--- {f} ---")
        if not f.exists():
            print("  (not found)")
            continue
        for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            if re.search(r"/stock|/reminder|/api/v1/(patient|patients)", line):
                print(f"  L{i}: {line.strip()[:140]}")

def main():
    dump_files()
    find_schedulers()
    grep_frontend_calls()

if __name__ == "__main__":
    main()