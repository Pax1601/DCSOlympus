import re


COMMON_PHRASE_ALIASES = {
    variation: canonical
    for canonical, variations in {
        "grid": ["read", "red"],
    }.items()
    for variation in variations
}

NATO_VARIATIONS = {
    "alpha": ["alfa"],
    "bravo": ["brava"],
    "charlie": ["charly", "charley"],
    "echo": ["ecko", "eco"],
    "foxtrot": ["fox trot"],
    "golf": ["gulf"],
    "juliett": ["juliet", "juliette"],
    "kilo": ["killo"],
    "lima": ["leema"],
    "oscar": ["oskar"],
    "papa": ["pappa", "poppa"],
    "quebec": ["cue beck", "queue beck", "we're back", "quebek", "back for", "for back", "back"],
    "sierra": ["siera"],
    "tango": ["tengo"],
    "whiskey": ["whisky"],
    "xray": ["x ray", "xrey"],
    "yankee": ["yanke"],
    "zulu": ["zulo"],
}

NATO_PHRASE_ALIASES = {
    variation: canonical
    for canonical, variations in NATO_VARIATIONS.items()
    for variation in variations
    if " " in variation
}

NATO_TOKEN_ALIASES = {
    variation: canonical
    for canonical, variations in NATO_VARIATIONS.items()
    for variation in variations
    if " " not in variation
}

DIGIT_TOKEN_ALIASES = {
    "wun": "1",
    "fower": "4",
    "fife": "5",
    "niner": "9",
}


def _replace_whole_phrases(text: str, replacements: dict[str, str]) -> str:
    normalized_text = text
    for phrase, replacement in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        normalized_text = re.sub(rf"\b{re.escape(phrase)}\b", replacement, normalized_text)
    return normalized_text


def normalize_common_phrases(text: str) -> str:
    return _replace_whole_phrases(text.lower(), COMMON_PHRASE_ALIASES)


def normalize_grid_text(text: str) -> str:
    normalized_text = normalize_common_phrases(text)
    return _replace_whole_phrases(normalized_text, NATO_PHRASE_ALIASES)


def normalize_grid_token(token: str) -> str:
    if token in NATO_TOKEN_ALIASES:
        return NATO_TOKEN_ALIASES[token]
    if token in DIGIT_TOKEN_ALIASES:
        return DIGIT_TOKEN_ALIASES[token]
    return token
