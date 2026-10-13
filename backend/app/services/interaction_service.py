"""
Checks newly parsed medicines against what the patient is ALREADY taking.

Deterministic: uses the KB notes verbatim (no LLM rewriting of safety text).
Never raises - if Qdrant is down the caller gets ok=False and a note saying the
check did not run, because "not checked" is not the same as "safe".
"""
import asyncio
import logging

from app.services.drug_aliases import resolve_medicine
from app.services.rag_service import check_interactions

logger = logging.getLogger("interaction_service")

CHECK_TIMEOUT_SECONDS = 15
MAX_NOTE_LINES = 8
SEVERITY_LABEL = {"major": "MAJOR", "moderate": "Moderate", "minor": "Minor"}
UNAVAILABLE_NOTE = "Interaction check unavailable right now - please verify interactions manually."


def _generics(name: str) -> set[str]:
    return {g.lower() for g in resolve_medicine(name)["generics"]}


async def evaluate_new_medicines(new_names: list[str], existing_names: list[str]) -> dict:
    new_names = [n for n in new_names if n and n.strip()]
    empty = {"ok": True, "has_major": False, "note": "", "interactions": [], "not_in_knowledge_base": []}
    if not new_names:
        return empty

    # A refill of a medicine the patient already has is not "existing" - the new row replaces it.
    new_lower = {n.strip().lower() for n in new_names}
    seen, existing_only = set(), []
    for n in existing_names:
        key = (n or "").strip().lower()
        if key and key not in new_lower and key not in seen:
            seen.add(key)
            existing_only.append(n)

    combined = new_names + existing_only
    if len(combined) < 2:
        return empty  # one medicine cannot interact with anything

    new_generics = set().union(*(_generics(n) for n in new_names))

    try:
        result = await asyncio.wait_for(check_interactions(combined), timeout=CHECK_TIMEOUT_SECONDS)
    except Exception as e:  # Qdrant down, bad key, timeout, etc.
        logger.warning("Interaction check failed: %s", e)
        return {**empty, "ok": False, "note": UNAVAILABLE_NOTE}

    # Only interactions that involve at least one NEW medicine matter for this prescription.
    relevant = [
        i for i in result["interactions"]
        if i["drug_a"].lower() in new_generics or i["drug_b"].lower() in new_generics
    ]
    not_in_kb = result.get("not_in_knowledge_base", [])

    lines = [
        f"{SEVERITY_LABEL.get(i['severity'], i['severity'])}: {i['drug_a']} + {i['drug_b']} - {i['note']}"
        for i in relevant[:MAX_NOTE_LINES]
    ]
    if len(relevant) > MAX_NOTE_LINES:
        lines.append(f"+{len(relevant) - MAX_NOTE_LINES} more interaction(s) not shown")
    if lines and not_in_kb:
        lines.append(f"No interaction data for: {', '.join(not_in_kb)} (absence of a flag is not proof of safety).")

    return {
        "ok": True,
        "has_major": any(i["severity"] == "major" for i in relevant),
        "note": "\n".join(lines),
        "interactions": relevant,
        "not_in_knowledge_base": not_in_kb,
    }