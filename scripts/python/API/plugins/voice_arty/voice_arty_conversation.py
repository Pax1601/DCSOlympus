import re
from dataclasses import dataclass, field

from mgrs_utils import WORD_TO_DIGIT, format_grid_for_readback


@dataclass
class FireMissionState:
    phase: str = "first"
    fire_type: str | None = None
    target_method: str | None = None
    phonetic_examples: list[str] = field(
        default_factory=lambda: [
            "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliett",
            "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango",
            "uniform", "victor", "whiskey", "xray", "yankee", "zulu",
        ]
    )

    def reset(self) -> None:
        self.phase = "first"
        self.fire_type = None
        self.target_method = None

class VoiceArtyConversation:
    trigger_keywords = (
        "effect",
        "adjust",
        "grid",
        "polar",
        "direction",
        "distance",
        "altitude",
        "reset",
    )

    def __init__(self, callsign: str = "hammer"):
        self.callsign = callsign
        self.state = FireMissionState()

    def reset(self) -> None:
        self.state.reset()

    def get_transcription_prompt(self) -> str:
        callsign = self.callsign

        if self.state.phase == "first" and self.state.fire_type is None:
            return (
                "Message format will be one of the following: "
                f"'{callsign} fire for effect, over' or '{callsign} adjust fire, over' or '{callsign} reset, over'."
            )
        
        if self.state.phase == "second" and self.state.fire_type is not None:
            phonetic_examples = ", ".join(self.state.phonetic_examples)
            return (
                "Message format will be one of the following: "
                f"Grid alpha zulu 1 3 2 3 5 7 8 3, altitude 1 3 0, over. "
                f"Where alpha zulu can be any NATO phonetic letter, such as contained in {phonetic_examples}."
            )

        return (
            "Artillery radio transcription context. "
            "Current stage: first transmission. "
            f"Expected format examples: '{callsign} fire for effect, over' or '{callsign} adjust fire, over'."
            "Key terms: fire for effect, adjust fire, reset."
        )

    def should_handle(self, normalized_message: str) -> bool:
        return any(keyword in normalized_message for keyword in self.trigger_keywords) or self.callsign in normalized_message

    def _extract_altitude_readback(self, normalized_message: str) -> str:
        tokens = re.findall(r"[a-z0-9]+", normalized_message.lower())
        altitude_keywords = {"altitude"}
        stop_words = {
            "over","out",
        }

        for index, token in enumerate(tokens):
            if token not in altitude_keywords:
                continue

            digits: list[str] = []
            for candidate in tokens[index + 1:]:
                if candidate in stop_words:
                    break
                if candidate in WORD_TO_DIGIT:
                    digits.append(WORD_TO_DIGIT[candidate])
                    continue
                if candidate.isdigit():
                    digits.extend(list(candidate))
                    continue
                break

            if digits:
                return " ".join(digits)

        return ""
    
    def _extract_grid(self, normalized_message: str) -> str:
        return format_grid_for_readback(normalized_message)

    def process_message(self, normalized_message: str, unit_label: str) -> str | None:
        if not self.should_handle(normalized_message):
            return None

        if "reset" in normalized_message:
            self.state.reset()
            return f"{unit_label}, {self.callsign}, copy reset, say again first message."

        if "adjust" in normalized_message and self.state.phase == "first":
            self.state.fire_type = "adjust fire"
            self.state.phase = "second"
            return f"{unit_label}, {self.callsign}, adjust fire, out."
        
        if "effect" in normalized_message and self.state.phase == "first":
            self.state.fire_type = "fire for effect"
            self.state.phase = "second"
            return f"{unit_label}, {self.callsign}, fire for effect, out."

        if "grid" in normalized_message and self.state.phase == "second":
            # Extract grid from message and read back in NATO phonetic format
            grid_readback = self._extract_grid(normalized_message)
            altitude_readback = self._extract_altitude_readback(normalized_message)
            print(f"{grid_readback}")
            print(f"{altitude_readback}")   
            if grid_readback:
                if altitude_readback:
                    return f"Grid, {grid_readback}, altitude {altitude_readback}, out."
                return f"Grid, {grid_readback}, out."
            return f"Say again grid for {self.callsign}."
        
        return f"Say again for {self.callsign}."