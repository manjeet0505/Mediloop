"""
One-time (and re-runnable) loader for the drug interaction knowledge base.

Run from the backend folder:
    python load_drug_kb.py

Safe to run again after editing app/data/drug_interactions.json - point IDs are
deterministic, so existing entries are updated in place instead of duplicated.
"""
from dotenv import load_dotenv
load_dotenv(override=True)

import asyncio
import json
import sys

from app.services.drug_aliases import DATA_PATH
from app.services.rag_service import (
    KB_COLLECTION,
    check_interactions,
    kb_count,
    load_knowledge_base,
    make_pair_key,
)

VALID_SEVERITIES = {"major", "moderate", "minor"}


def validate(items: list[dict]) -> list[str]:
    errors, seen = [], set()
    for i, item in enumerate(items):
        label = f"entry {i + 1} ({item.get('a')} + {item.get('b')})"
        for field in ("a", "b", "severity", "note"):
            if not str(item.get(field, "")).strip():
                errors.append(f"{label}: missing '{field}'")
        if item.get("a", "").strip().lower() == item.get("b", "").strip().lower():
            errors.append(f"{label}: both drugs are the same")
        if item.get("severity") not in VALID_SEVERITIES:
            errors.append(f"{label}: severity must be one of {sorted(VALID_SEVERITIES)}")
        key = make_pair_key(item.get("a", ""), item.get("b", ""))
        if key in seen:
            errors.append(f"{label}: duplicate pair")
        seen.add(key)
    return errors


async def demo() -> None:
    meds = ["Betaloc 100mg", "Cimetidine 50mg", "Amlodipine 5mg", "Dorzolamidum 10 mg"]
    print(f"\nDemo check for: {meds}")
    result = await check_interactions(meds)
    for m in result["medicines"]:
        print(f"  {m['input']!r} -> {m['generics']}")
    print(f"  pairs checked: {result['checked_pairs']}")
    for i in result["interactions"]:
        print(f"  [{i['severity'].upper()}] {i['drug_a']} + {i['drug_b']}: {i['note']}")
    if result["not_in_knowledge_base"]:
        print(f"  no data for: {result['not_in_knowledge_base']} (absence of a flag is not proof of safety)")


def main() -> None:
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    items = data["interactions"]

    errors = validate(items)
    if errors:
        print("Dataset validation failed:")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print(f"Dataset OK: {len(items)} interaction pairs")

    loaded = load_knowledge_base(items)
    print(f"Loaded {loaded} pairs into Qdrant collection '{KB_COLLECTION}'")
    print(f"Collection now holds {kb_count()} points")

    asyncio.run(demo())


if __name__ == "__main__":
    main()