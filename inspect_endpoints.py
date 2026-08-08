#!/usr/bin/env python3
"""
MedLoop AI - Endpoint Inspector (ground-truth dump)

Run from project root:
    python inspect_endpoints.py

Prints the FULL source of the backend route files that matter most
right now (patient-facing + stock, since those are the known
uncertain areas), with line numbers. Paste the output back to Claude
and it will tell you exactly which endpoints are real vs mock, and
build the priority plan.

No files are modified.
"""

from pathlib import Path

TARGETS = [
    "backend/app/routes/patient.py",
    "backend/app/routes/patients.py",
    "backend/app/routes/stock.py",
    "backend/app/routes/prescription.py",
    "backend/app/routes/reminder.py",
]

def main():
    root = Path(".").resolve()
    for rel in TARGETS:
        f = root / rel
        print("\n" + "#" * 80)
        print(f"# FILE: {rel}")
        print("#" * 80)
        if not f.exists():
            print("  (not found at this path)")
            continue
        try:
            lines = f.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception as e:
            print(f"  (could not read: {e})")
            continue
        for i, line in enumerate(lines, 1):
            print(f"{i:4}| {line}")

if __name__ == "__main__":
    main()