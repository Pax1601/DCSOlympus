def enum_to_coalition(coalition_id: int) -> str:
    if coalition_id == 0:
        return "neutral"
    elif coalition_id == 1:
        return "red"
    elif coalition_id == 2:
        return "blue"
    return ""


def coalition_to_enum(coalition: str) -> int:
    if coalition == "neutral":
        return 0
    elif coalition == "red":
        return 1
    elif coalition == "blue":
        return 2
    return 0
1