import asyncio, json, os
from dotenv import load_dotenv
load_dotenv(override=True)

from app.services import rag_service
from app.services.interaction_service import evaluate_new_medicines


def find_major_pair():
    with open("app/data/drug_interactions.json", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else next(
        v for v in data.values() if isinstance(v, list) and v and isinstance(v[0], dict) and "severity" in v[0]
    )
    m = next(i for i in items if i["severity"] == "major")
    return m["a"], m["b"]


async def main():
    print("1) Test Patient: new Cimetidine vs existing Betaloc + Amlodipine (expect moderate/minor, no major)")
    r = await evaluate_new_medicines(["Cimetidine 50mg"], ["Betaloc 100mg", "Amlodipine 5mg"])
    print("   ok:", r["ok"], "| has_major:", r["has_major"]); print("   ", r["note"].replace("\n", "\n    "))

    a, b = find_major_pair()
    print(f"\n2) Major pair from your KB: new '{a}' vs existing '{b}' (expect has_major True)")
    r = await evaluate_new_medicines([a], [b])
    print("   ok:", r["ok"], "| has_major:", r["has_major"]); print("   ", r["note"].replace("\n", "\n    "))

    print("\n3) Refill of same medicine (expect no interactions, note empty)")
    r = await evaluate_new_medicines(["Betaloc 100mg"], ["Betaloc 50mg"])
    print("   ok:", r["ok"], "| note:", repr(r["note"]))

    print("\n4) Unknown drug only (expect no flag, note empty)")
    r = await evaluate_new_medicines(["Dorzolamidum 10 mg"], [])
    print("   ok:", r["ok"], "| has_major:", r["has_major"], "| note:", repr(r["note"]))

    print("\n5) Qdrant failure (wrong key) - expect ok False + 'unavailable' note, NO crash")
    os.environ["QDRANT_API_KEY"] = "wrong-key"
    rag_service.get_qdrant.cache_clear()
    r = await evaluate_new_medicines(["Cimetidine 50mg"], ["Betaloc 100mg"])
    print("   ok:", r["ok"], "| note:", r["note"])

asyncio.run(main())