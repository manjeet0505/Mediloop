"""
Rule-based clinical threshold evaluation for vitals.
Ranges based on WHO / ICMR standard guidelines.
No LLM involved — deterministic, safe for health data.
"""

def evaluate_vital(vital_type: str, value_1: float, value_2: float | None = None) -> str:
    """
    Returns one of: "normal" | "watch" | "critical"
    value_1 = systolic (bp) / primary reading (others)
    value_2 = diastolic (bp only), else None
    """

    if vital_type == "bp":
        systolic = value_1
        diastolic = value_2 or 0

        if systolic >= 180 or diastolic >= 120:
            return "critical"
        if systolic >= 140 or diastolic >= 90:
            return "critical"
        if 120 <= systolic < 140 or 80 <= diastolic < 90:
            return "watch"
        return "normal"

    elif vital_type == "blood_sugar":
        sugar = value_1

        if sugar < 70:
            return "critical"   # hypoglycemia
        if sugar >= 200:
            return "critical"
        if 140 <= sugar < 200:
            return "watch"
        return "normal"

    elif vital_type == "spo2":
        spo2 = value_1

        if spo2 < 90:
            return "critical"
        if 90 <= spo2 < 95:
            return "watch"
        return "normal"

    elif vital_type == "heart_rate":
        hr = value_1

        if hr < 50 or hr > 120:
            return "critical"
        if 100 <= hr <= 120:
            return "watch"
        return "normal"

    elif vital_type == "weight":
        # single reading can't determine status — trend-based only
        return "normal"

    else:
        raise ValueError(f"Unknown vital_type: {vital_type}")