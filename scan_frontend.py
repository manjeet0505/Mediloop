"""
scan_frontend.py
------------------
Read-only script. Scans the Next.js frontend for hardcoded / demo / mock
data patterns so you can find every trace of fake data before going live.

It does NOT modify anything, only prints a report.

Usage:
    python scan_frontend.py
    python scan_frontend.py --path D:\\mediloop\\frontend
"""

import argparse
import os
import re

SCAN_EXTENSIONS = {".tsx", ".ts", ".jsx", ".js"}
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", "coverage"}

# ── Pattern groups ────────────────────────────────────────────────

# 1. ALL-CAPS const arrays/objects assigned a literal array or object.
#    e.g. const VITALS = [ ... ]   const STATS: Stat[] = [ ... ]
CONST_ARRAY_RE = re.compile(
    r"^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]{2,})\s*(?::\s*[^=]+)?=\s*[\[{]",
    re.MULTILINE,
)

# 2. Common "fake data" keywords anywhere in the file
KEYWORD_RE = re.compile(
    r"\b(mock|dummy|placeholder|fake|sample[_ ]?data|lorem|test[_ ]?data|hardcoded|TODO|FIXME|temp[_ ]?data)\b",
    re.IGNORECASE,
)

# 3. Suspicious literal-looking fake values often used as filler
SUSPICIOUS_VALUE_RE = re.compile(
    r"(John Doe|Jane Doe|test@test\.com|example\.com|123-456-7890|\+91\s?9{5,}|\+91\s?1{5,}|Lorem ipsum|foo@bar)",
    re.IGNORECASE,
)

# 4. Whether the file actually calls a real data source
REAL_DATA_CALL_RE = re.compile(
    r"\b(fetch\(|axios\.|api\.(get|post|put|patch|delete)|useSWR|useQuery|" 
    r"process\.env\.NEXT_PUBLIC_API|await\s+fetch)",
)

# UI-config names that are legitimate and should NOT be flagged as fake data
LIKELY_UI_CONFIG_NAMES = {
    "TABS", "NAV_ITEMS", "ROUTES", "MENU_ITEMS", "COLUMNS", "COLORS",
    "COLOR_PALETTE", "BREAKPOINTS", "ICONS", "STEPS", "PARSE_STAGES",
    "THEMES", "VARIANTS", "SIZES", "STATUS_COLORS", "DAY_LABELS",
}


def find_files(root):
    matches = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if os.path.splitext(f)[1] in SCAN_EXTENSIONS:
                matches.append(os.path.join(dirpath, f))
    return matches


def scan_file(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
    except Exception as e:
        return None

    const_arrays = CONST_ARRAY_RE.findall(content)
    # split into "likely fake data" vs "likely legit UI config"
    likely_fake_consts = [c for c in const_arrays if c not in LIKELY_UI_CONFIG_NAMES]
    likely_config_consts = [c for c in const_arrays if c in LIKELY_UI_CONFIG_NAMES]

    keyword_hits = sorted(set(m.lower() for m in KEYWORD_RE.findall(content)))
    suspicious_values = sorted(set(SUSPICIOUS_VALUE_RE.findall(content)))
    has_real_call = bool(REAL_DATA_CALL_RE.search(content))

    # empty-stub handlers: onClick={() => {}} or similar no-op
    empty_stub_count = len(re.findall(r"=\s*\(\)\s*=>\s*\{\s*\}", content))

    if not (likely_fake_consts or keyword_hits or suspicious_values or empty_stub_count):
        return None  # nothing interesting in this file

    return {
        "path": path,
        "fake_consts": likely_fake_consts,
        "config_consts": likely_config_consts,
        "keywords": keyword_hits,
        "suspicious_values": suspicious_values,
        "empty_stubs": empty_stub_count,
        "has_real_call": has_real_call,
    }


def classify(result):
    """Rough severity classification to help prioritize."""
    if result["fake_consts"] and not result["has_real_call"]:
        return "HIGH — hardcoded data array, no real API call found in file"
    if result["fake_consts"] and result["has_real_call"]:
        return "MEDIUM — hardcoded array present, but file also calls real API (may be dead/unused const)"
    if result["suspicious_values"]:
        return "MEDIUM — suspicious placeholder-looking values found"
    if result["keywords"]:
        return "LOW — mock/dummy/TODO keyword mentioned (check context)"
    if result["empty_stubs"]:
        return "LOW — empty no-op handler(s) found"
    return "INFO"


def main():
    parser = argparse.ArgumentParser(description="Scan Next.js frontend for hardcoded/demo data.")
    parser.add_argument("--path", default=".", help="Frontend root to scan (default: current directory)")
    args = parser.parse_args()

    root = os.path.abspath(args.path)
    print(f"Scanning: {root}\n")
    print("=" * 90)
    print("FRONTEND DEMO/MOCK DATA SCAN")
    print("=" * 90)

    files = find_files(root)
    if not files:
        print(f"No .tsx/.ts/.jsx/.js files found under {root}")
        print("Tip: point --path at your frontend folder, e.g. --path D:\\mediloop\\frontend")
        return

    results = []
    for f in files:
        r = scan_file(f)
        if r:
            results.append(r)

    if not results:
        print("\nNo hardcoded arrays, mock keywords, or suspicious values found. Clean scan!")
        return

    # Sort: HIGH severity first
    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "INFO": 3}
    for r in results:
        r["severity"] = classify(r)
    results.sort(key=lambda r: severity_order.get(r["severity"].split(" —")[0], 9))

    for r in results:
        rel = os.path.relpath(r["path"], root)
        print(f"\n[{r['severity'].split(' — ')[0]}] {rel}")
        print(f"    {r['severity']}")
        if r["fake_consts"]:
            print(f"    Hardcoded data consts : {', '.join(r['fake_consts'])}")
        if r["config_consts"]:
            print(f"    (UI-config consts, probably fine): {', '.join(r['config_consts'])}")
        if r["suspicious_values"]:
            print(f"    Suspicious values      : {', '.join(r['suspicious_values'])}")
        if r["keywords"]:
            print(f"    Keywords found         : {', '.join(r['keywords'])}")
        if r["empty_stubs"]:
            print(f"    Empty no-op handlers   : {r['empty_stubs']}")
        print(f"    Calls real API in file : {'yes' if r['has_real_call'] else 'no'}")

    print("\n" + "=" * 90)
    print(f"SUMMARY: {len(results)} file(s) flagged out of {len(files)} scanned")
    high = sum(1 for r in results if r["severity"].startswith("HIGH"))
    medium = sum(1 for r in results if r["severity"].startswith("MEDIUM"))
    low = sum(1 for r in results if r["severity"].startswith("LOW"))
    print(f"  HIGH: {high}   MEDIUM: {medium}   LOW: {low}")
    print("=" * 90)
    print("\nNote: this is a heuristic scan (read-only, no files changed).")
    print("Paste the full output back for a manual, file-by-file real-vs-fake verdict.")


if __name__ == "__main__":
    main()