#!/usr/bin/env python3
"""
MedLoop AI - Progress Auditor
Run this from inside your project root (or pass --path):

    python scan_progress.py
    python scan_progress.py --path D:\\mediloop

It scans backend + frontend separately and reports, per file:
  - REAL   -> looks like it talks to DB / real API
  - MOCK   -> hardcoded arrays, dummy returns, stubbed calls
  - FLAG   -> TODO/FIXME/empty handlers/unclear
No file contents are modified. Read-only scan.
"""

import argparse
import os
import re
import sys
from pathlib import Path

EXCLUDE_DIRS = {
    "node_modules", ".git", "venv", ".venv", "__pycache__",
    "dist", "build", ".next", ".turbo", "env", ".idea", ".vscode"
}

BACKEND_EXT = {".py"}
FRONTEND_EXT = {".ts", ".tsx", ".js", ".jsx"}

MOCK_PATTERNS = [
    r"\bmock\b", r"\bdummy\b", r"\bfake\b", r"\bhardcod", r"\bstub\b",
    r"\bTODO\b", r"\bFIXME\b", r"\bplaceholder\b", r"\bsimulate",
    r"return\s*\{\s*['\"]",         # returning a literal dict/object directly
]

REAL_BACKEND_PATTERNS = [
    r"\bawait\s+db\.", r"\bsession\.execute", r"\bdb\.query",
    r"\.filter\(", r"\bselect\(", r"SQLAlchemy", r"\basyncpg\b",
    r"\bcursor\.execute", r"httpx\.(get|post)", r"requests\.(get|post)",
]

REAL_FRONTEND_PATTERNS = [
    r"\bfetch\(", r"\baxios\.(get|post|put|delete)", r"\buseSWR\(",
    r"\buseQuery\(", r"api\.(get|post|put|delete)\(",
]

EMPTY_HANDLER = re.compile(r"onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}")
HARDCODED_ARRAY = re.compile(r"const\s+([A-Z][A-Z0-9_]{2,})\s*(?::\s*\w+\[\])?\s*=\s*\[")
ROUTE_DEF = re.compile(r"@(?:router|app)\.(get|post|put|delete|patch)\(\s*[\"']([^\"']+)[\"']")

def iter_files(root: Path, exts):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix in exts:
                yield p

def classify(text, real_patterns):
    mock_hits = [p for p in MOCK_PATTERNS if re.search(p, text, re.IGNORECASE)]
    real_hits = [p for p in real_patterns if re.search(p, text)]
    if real_hits and not mock_hits:
        return "REAL"
    if mock_hits and not real_hits:
        return "MOCK"
    if mock_hits and real_hits:
        return "MIXED"
    return "UNCLEAR"

def scan_backend(root: Path):
    print("\n" + "=" * 70)
    print("BACKEND SCAN (.py files)")
    print("=" * 70)
    found_any = False
    for f in sorted(iter_files(root, BACKEND_EXT)):
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        routes = ROUTE_DEF.findall(text)
        if not routes and "mock" not in text.lower() and "TODO" not in text:
            continue
        found_any = True
        rel = f.relative_to(root)
        status = classify(text, REAL_BACKEND_PATTERNS)
        print(f"\n[{status}] {rel}")
        for method, path in routes:
            print(f"    route: {method.upper():6} {path}")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bmock\b|\bdummy\b|\bTODO\b|\bFIXME\b|\bhardcod", line, re.IGNORECASE):
                print(f"    L{i}: {line.strip()[:100]}")
    if not found_any:
        print("(no routes or mock/TODO markers found under this path)")

def scan_frontend(root: Path):
    print("\n" + "=" * 70)
    print("FRONTEND SCAN (.ts/.tsx/.js/.jsx files)")
    print("=" * 70)
    found_any = False
    for f in sorted(iter_files(root, FRONTEND_EXT)):
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        arrays = HARDCODED_ARRAY.findall(text)
        empty_handlers = EMPTY_HANDLER.findall(text)
        has_real_call = any(re.search(p, text) for p in REAL_FRONTEND_PATTERNS)
        if not arrays and not empty_handlers and not has_real_call and "mock" not in text.lower():
            continue
        found_any = True
        rel = f.relative_to(root)
        status = classify(text, REAL_FRONTEND_PATTERNS)
        print(f"\n[{status}] {rel}")
        if arrays:
            print(f"    hardcoded consts (check if still used as data source): {', '.join(arrays)}")
        if empty_handlers:
            print(f"    empty onClick handlers found: {len(empty_handlers)}")
        for i, line in enumerate(text.splitlines(), 1):
            if re.search(r"\bmock\b|\bdummy\b|\bTODO\b|\bFIXME\b", line, re.IGNORECASE):
                print(f"    L{i}: {line.strip()[:100]}")
    if not found_any:
        print("(no hardcoded arrays, empty handlers, or mock markers found under this path)")

def scan_env(root: Path):
    print("\n" + "=" * 70)
    print("ENV / CONFIG KEYS (names only, values hidden)")
    print("=" * 70)
    env_files = list(root.rglob(".env")) + list(root.rglob(".env.*"))
    env_files = [f for f in env_files if not any(x in f.parts for x in EXCLUDE_DIRS)]
    if not env_files:
        print("No .env files found.")
        return
    for f in env_files:
        print(f"\n{f.relative_to(root)}:")
        try:
            for line in f.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key = line.split("=", 1)[0].strip()
                    print(f"    {key}")
        except Exception as e:
            print(f"    (could not read: {e})")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".", help="Project root to scan (default: current dir)")
    args = ap.parse_args()
    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(1)

    print(f"Scanning: {root}")
    scan_backend(root)
    scan_frontend(root)
    scan_env(root)
    print("\n" + "=" * 70)
    print("Legend: REAL = looks wired to DB/API | MOCK = only mock/dummy patterns")
    print("MIXED = both present (half-wired) | UNCLEAR = flagged but ambiguous, check manually")
    print("=" * 70)

if __name__ == "__main__":
    main()