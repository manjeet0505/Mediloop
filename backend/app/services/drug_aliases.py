"""
Medicine-name normalisation for MedLoop.

Indian prescriptions mix brand names ("Betaloc 100mg", "Glycomet GP"), generics and
free-text noise (strengths, tablet/capsule words). The interaction knowledge base is keyed
on lowercase generic names, so every medicine string is resolved to generic(s) first.

Only well-established brand mappings are listed. Anything that cannot be resolved is
reported back as "not in knowledge base" instead of being guessed at.
"""
import json
import re
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "drug_interactions.json"

# Lowercase brand / synonym -> generic name(s). Hyphens are normalised to spaces
# before lookup, so "Telma-H" is looked up as "telma h".
BRAND_ALIASES: dict[str, list[str]] = {
    # diabetes
    "glycomet": ["metformin"], "glucophage": ["metformin"],
    "glycomet gp": ["metformin", "glimepiride"],
    "amaryl": ["glimepiride"], "januvia": ["sitagliptin"],
    "jardiance": ["empagliflozin"], "forxiga": ["dapagliflozin"], "actos": ["pioglitazone"],
    "lantus": ["insulin"], "levemir": ["insulin"], "mixtard": ["insulin"],
    "novorapid": ["insulin"], "humalog": ["insulin"], "huminsulin": ["insulin"],
    # blood pressure / cardiac
    "norvasc": ["amlodipine"], "amlong": ["amlodipine"], "stamlo": ["amlodipine"],
    "cozaar": ["losartan"], "losar": ["losartan"],
    "telma": ["telmisartan"], "micardis": ["telmisartan"],
    "telma h": ["telmisartan", "hydrochlorothiazide"],
    "cardace": ["ramipril"], "envas": ["enalapril"],
    "tenormin": ["atenolol"], "aten": ["atenolol"],
    "betaloc": ["metoprolol"], "metolar": ["metoprolol"],
    "lasix": ["furosemide"], "frusemide": ["furosemide"], "aldactone": ["spironolactone"],
    "aquazide": ["hydrochlorothiazide"], "hctz": ["hydrochlorothiazide"],
    "lanoxin": ["digoxin"], "cordarone": ["amiodarone"],
    "dilzem": ["diltiazem"], "isoptin": ["verapamil"],
    "sorbitrate": ["isosorbide dinitrate"],
    "monotrate": ["isosorbide mononitrate"], "ismo": ["isosorbide mononitrate"],
    "viagra": ["sildenafil"],
    # antithrombotic / lipids
    "ecosprin": ["aspirin"], "ecosprin av": ["aspirin", "atorvastatin"],
    "disprin": ["aspirin"], "acetylsalicylic acid": ["aspirin"],
    "plavix": ["clopidogrel"], "clopilet": ["clopidogrel"], "coumadin": ["warfarin"],
    "lipitor": ["atorvastatin"], "atorva": ["atorvastatin"], "storvas": ["atorvastatin"],
    "crestor": ["rosuvastatin"], "rosuvas": ["rosuvastatin"], "zocor": ["simvastatin"],
    # pain / steroids
    "brufen": ["ibuprofen"], "combiflam": ["ibuprofen", "paracetamol"],
    "voveran": ["diclofenac"],
    "dolo": ["paracetamol"], "crocin": ["paracetamol"], "calpol": ["paracetamol"],
    "acetaminophen": ["paracetamol"],
    "wysolone": ["prednisolone"],
    # GI / thyroid
    "pan": ["pantoprazole"], "pantocid": ["pantoprazole"],
    "pan d": ["pantoprazole", "domperidone"],
    "omez": ["omeprazole"], "tagamet": ["cimetidine"],
    "eltroxin": ["levothyroxine"], "thyronorm": ["levothyroxine"],
    # anti-infectives
    "ciplox": ["ciprofloxacin"], "cifran": ["ciprofloxacin"],
    "azithral": ["azithromycin"], "zithromax": ["azithromycin"], "flagyl": ["metronidazole"],
    # CNS
    "alprax": ["alprazolam"], "restyl": ["alprazolam"],
    "prozac": ["fluoxetine"], "fludac": ["fluoxetine"], "zoloft": ["sertraline"],
    "dilantin": ["phenytoin"], "eptoin": ["phenytoin"], "tegretol": ["carbamazepine"],
    "zyrtec": ["cetirizine"], "okacet": ["cetirizine"],
    # supplements / antacids
    "kcl": ["potassium"], "potassium chloride": ["potassium"], "slow k": ["potassium"],
    "shelcal": ["calcium"], "calcium carbonate": ["calcium"], "calcium citrate": ["calcium"],
    "ferrous sulfate": ["iron"], "ferrous sulphate": ["iron"],
    "ferrous fumarate": ["iron"], "ferrous ascorbate": ["iron"],
    "gelusil": ["antacid"], "digene": ["antacid"],
    "aluminium hydroxide": ["antacid"], "magnesium hydroxide": ["antacid"],
}

_DOSAGE_RE = re.compile(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|ml|iu|units?|%)\b")
_NUMBER_RE = re.compile(r"\b\d+(?:\.\d+)?\b")
_FORM_WORDS = {
    "tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule", "capsules",
    "syp", "syrup", "inj", "injection", "drops", "sr", "xr", "er", "cr", "od",
    "ointment", "cream", "gel", "oral",
}


@lru_cache(maxsize=1)
def known_generics() -> frozenset[str]:
    """Every generic name that appears in the interaction knowledge base."""
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    names: set[str] = set()
    for item in data["interactions"]:
        names.add(item["a"].strip().lower())
        names.add(item["b"].strip().lower())
    return frozenset(names)


def _clean(text: str) -> str:
    s = text.lower()
    s = _DOSAGE_RE.sub(" ", s)
    s = _NUMBER_RE.sub(" ", s)
    s = s.replace("-", " ").replace("/", "+").replace("&", "+").replace(",", "+")
    return re.sub(r"[^a-z+ ]", " ", s)


def _lookup(phrase: str) -> list[str] | None:
    if phrase in BRAND_ALIASES:
        return BRAND_ALIASES[phrase]
    if phrase in known_generics():
        return [phrase]
    return None


def _resolve_part(part: str) -> list[str]:
    tokens = [t for t in part.split() if t not in _FORM_WORDS]
    if not tokens:
        return []
    # 1) longest leading phrase first ("atorvastatin calcium" -> "atorvastatin")
    for end in range(len(tokens), 0, -1):
        hit = _lookup(" ".join(tokens[:end]))
        if hit:
            return hit
    # 2) any single token ("human insulin" -> "insulin")
    for token in tokens:
        hit = _lookup(token)
        if hit:
            return hit
    # 3) unrecognised: keep it so it can be reported rather than silently dropped
    return [" ".join(tokens)]


def resolve_medicine(raw: str) -> dict:
    """
    "Betaloc 100mg"        -> {"input": ..., "generics": ["metoprolol"]}
    "Glycomet GP 2"        -> {"input": ..., "generics": ["metformin", "glimepiride"]}
    "Dorzolamidum 10 mg"   -> {"input": ..., "generics": ["dorzolamidum"]}   (unrecognised)
    """
    generics: list[str] = []
    for part in _clean(raw or "").split("+"):
        for g in _resolve_part(part):
            if g not in generics:
                generics.append(g)
    return {"input": raw, "generics": generics}