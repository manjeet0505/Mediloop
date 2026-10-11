"""
RAG layer for MedLoop (Qdrant Cloud + OpenAI embeddings).

Two collections:
  1. drug_interactions     - curated reference knowledge base (global, loaded by load_drug_kb.py)
  2. patient_prescriptions - each patient's parsed prescriptions, embedded for semantic recall.
                             ALWAYS queried with a patient_id filter - never across patients.

Design note: for the safety-critical question "do these prescribed drugs interact?",
matching is deterministic (payload filter on a normalised pair key). Embeddings power the
open-ended retrieval around it - finding the most relevant knowledge for a free-text
question and recalling a patient's own history - so a fuzzy embedding match is never the
only thing standing between a patient and a missed interaction.

Clients are created lazily (not at import time), so standalone scripts only need
load_dotenv() to run before the first call.
"""
import asyncio
import itertools
import os
import uuid
from datetime import datetime, timezone
from functools import lru_cache

from openai import OpenAI
from qdrant_client import QdrantClient, models

from app.services.drug_aliases import known_generics, resolve_medicine

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
KB_COLLECTION = "drug_interactions"
HISTORY_COLLECTION = "patient_prescriptions"
BATCH_SIZE = 64

SEVERITY_ORDER = {"major": 0, "moderate": 1, "minor": 2}


# ── Clients ─────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_qdrant() -> QdrantClient:
    url = os.getenv("QDRANT_URL")
    api_key = os.getenv("QDRANT_API_KEY")
    if not url or not api_key:
        raise RuntimeError("QDRANT_URL / QDRANT_API_KEY are not set in the environment")
    return QdrantClient(url=url, api_key=api_key, timeout=30)


@lru_cache(maxsize=1)
def get_openai() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ── Helpers ─────────────────────────────────────────────────────────

_ready_collections: set[str] = set()


def _ensure_collection(name: str, keyword_fields: list[str]) -> None:
    if name in _ready_collections:
        return
    client = get_qdrant()
    existing = {c.name for c in client.get_collections().collections}
    if name not in existing:
        client.create_collection(
            collection_name=name,
            vectors_config=models.VectorParams(size=EMBEDDING_DIM, distance=models.Distance.COSINE),
        )
    for field in keyword_fields:
        try:
            client.create_payload_index(
                collection_name=name,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass  # index already exists
    _ready_collections.add(name)


def make_pair_key(a: str, b: str) -> str:
    """Order-independent key: ('Metoprolol','amlodipine') -> 'amlodipine|metoprolol'."""
    return "|".join(sorted([a.strip().lower(), b.strip().lower()]))


def embed_texts(texts: list[str]) -> list[list[float]]:
    resp = get_openai().embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in resp.data]


def _kb_text(item: dict) -> str:
    return f"Drug interaction between {item['a']} and {item['b']} ({item['severity']} severity): {item['note']}"


# ── Knowledge base: load ────────────────────────────────────────────

def load_knowledge_base(interactions: list[dict]) -> int:
    """Embeds and upserts the interaction list. Idempotent - point IDs derive from the pair key."""
    _ensure_collection(KB_COLLECTION, ["pair_key"])
    client = get_qdrant()
    total = 0
    for start in range(0, len(interactions), BATCH_SIZE):
        batch = interactions[start:start + BATCH_SIZE]
        vectors = embed_texts([_kb_text(i) for i in batch])
        points = []
        for item, vector in zip(batch, vectors):
            key = make_pair_key(item["a"], item["b"])
            points.append(models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"medloop-kb:{key}")),
                vector=vector,
                payload={
                    "pair_key": key,
                    "drug_a": item["a"].strip().lower(),
                    "drug_b": item["b"].strip().lower(),
                    "severity": item["severity"],
                    "note": item["note"],
                },
            ))
        client.upsert(collection_name=KB_COLLECTION, points=points, wait=True)
        total += len(points)
    return total


def kb_count() -> int:
    return get_qdrant().count(collection_name=KB_COLLECTION, exact=True).count


# ── Knowledge base: query ───────────────────────────────────────────

def _check_interactions_sync(medicine_names: list[str]) -> dict:
    resolved = [resolve_medicine(name) for name in medicine_names]

    generics: list[str] = []
    for r in resolved:
        for g in r["generics"]:
            if g not in generics:
                generics.append(g)

    kb = known_generics()
    not_in_kb = [g for g in generics if g not in kb]

    keys = [make_pair_key(a, b) for a, b in itertools.combinations(generics, 2)]
    found: list[dict] = []
    if keys:
        points, _ = get_qdrant().scroll(
            collection_name=KB_COLLECTION,
            scroll_filter=models.Filter(must=[
                models.FieldCondition(key="pair_key", match=models.MatchAny(any=keys)),
            ]),
            limit=len(keys),
            with_payload=True,
            with_vectors=False,
        )
        for p in points:
            pl = p.payload
            found.append({
                "drug_a": pl["drug_a"], "drug_b": pl["drug_b"],
                "severity": pl["severity"], "note": pl["note"],
            })
    found.sort(key=lambda x: SEVERITY_ORDER.get(x["severity"], 3))

    return {
        "medicines": resolved,
        "checked_pairs": len(keys),
        "interactions": found,
        "has_major": any(i["severity"] == "major" for i in found),
        # Absence of a flag is NOT proof of safety for these - the KB has no data on them.
        "not_in_knowledge_base": not_in_kb,
    }


def _search_knowledge_sync(question: str, limit: int, min_score: float) -> list[dict]:
    vector = embed_texts([question])[0]
    res = get_qdrant().query_points(
        collection_name=KB_COLLECTION, query=vector, limit=limit, with_payload=True,
    )
    return [
        {
            "drug_a": p.payload["drug_a"], "drug_b": p.payload["drug_b"],
            "severity": p.payload["severity"], "note": p.payload["note"],
            "score": round(p.score, 3),
        }
        for p in res.points if p.score >= min_score
    ]


# ── Patient prescription history ────────────────────────────────────

def _index_prescription_sync(patient_id, prescription_id, doctor_name, medications, raw_text, created_at) -> None:
    _ensure_collection(HISTORY_COLLECTION, ["patient_id"])

    lines, generics = [], set()
    for m in medications or []:
        name = m.get("medicine_name") or m.get("name") or ""
        lines.append(" ".join(x for x in [name, m.get("dosage", ""), m.get("frequency", "")] if x).strip())
        generics.update(resolve_medicine(name)["generics"])

    text = f"Prescription by {doctor_name or 'unknown doctor'}: " + "; ".join(l for l in lines if l)
    if raw_text:
        text += f". Notes: {raw_text[:500]}"

    created = created_at or datetime.now(timezone.utc)
    vector = embed_texts([text])[0]
    get_qdrant().upsert(
        collection_name=HISTORY_COLLECTION,
        points=[models.PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"medloop-rx:{prescription_id}")),
            vector=vector,
            payload={
                "patient_id": patient_id,
                "prescription_id": prescription_id,
                "doctor_name": doctor_name,
                "medicines": sorted(generics),
                "summary": text,
                "created_at": created.isoformat(),
            },
        )],
        wait=True,
    )


def _search_patient_history_sync(patient_id: str, question: str, limit: int) -> list[dict]:
    _ensure_collection(HISTORY_COLLECTION, ["patient_id"])
    vector = embed_texts([question])[0]
    res = get_qdrant().query_points(
        collection_name=HISTORY_COLLECTION,
        query=vector,
        limit=limit,
        query_filter=models.Filter(must=[
            models.FieldCondition(key="patient_id", match=models.MatchValue(value=patient_id)),
        ]),
        with_payload=True,
    )
    return [
        {
            "prescription_id": p.payload["prescription_id"],
            "doctor_name": p.payload.get("doctor_name"),
            "medicines": p.payload.get("medicines", []),
            "summary": p.payload["summary"],
            "created_at": p.payload.get("created_at"),
            "score": round(p.score, 3),
        }
        for p in res.points
    ]


# ── Async API (what routes/agents call) ─────────────────────────────
# The Qdrant and OpenAI clients are synchronous, so calls run in a worker thread
# to keep the FastAPI event loop free.

async def check_interactions(medicine_names: list[str]) -> dict:
    return await asyncio.to_thread(_check_interactions_sync, medicine_names)


async def search_knowledge(question: str, limit: int = 5, min_score: float = 0.25) -> list[dict]:
    return await asyncio.to_thread(_search_knowledge_sync, question, limit, min_score)


async def index_prescription(
    patient_id: str,
    prescription_id: str,
    doctor_name: str | None,
    medications: list[dict],
    raw_text: str | None = None,
    created_at: datetime | None = None,
) -> None:
    await asyncio.to_thread(
        _index_prescription_sync, patient_id, prescription_id, doctor_name, medications, raw_text, created_at
    )


async def search_patient_history(patient_id: str, question: str, limit: int = 5) -> list[dict]:
    """patient_id is mandatory by design: history is never searched across patients."""
    return await asyncio.to_thread(_search_patient_history_sync, patient_id, question, limit)