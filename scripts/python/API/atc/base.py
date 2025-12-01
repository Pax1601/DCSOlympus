from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import random
import Levenshtein
import re

word_corrections = {
    "base": ["base", "bass", "bace", "vase", "pace", "face", "east"],
    "ops": ["ops", "of", "ups", "aps", "stops", "oops", "bud"],
    "out": ["out", "owt", "awt", "outbound"],
    "in": ["in", "inn", "inbound"],
    "taxi": ["taxi", "tacky", "tack"],
    "down": ["down", "sour"]
}

base_keywords = ["base", "ops"]

trigger_words = [
    (["in","down"], "handle_in_and_down_report"),
    (["in","up"], "handle_in_and_up_report"),
    (["in"], "handle_in_and_up_report"),  # Default "in" to up/normal
    (["out"], "handle_out_report")
]

random_in_and_up_responses = [
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger dat.",
    f", base, roger that.",
    f", base, roger, ok cool I'll get the kettle on.",
    f", base, welcome back.",
    f", base, roger, good to have you back safe."
]

random_in_and_down_responses = [
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger, copy you down.",
    f", base, roger understand down, will relay.",
    f", base, roger dat.",
    f", base, roger that, we'll get it patched up.",
    f", base, roger, ok cool I'll get the kettle on whilst the crew fixes it.",
    f", base, welcome back, copy you down.",
    f", base, roger, good to have you back safe, shame about the aircraft."
]

random_out_responses = [
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger.",
    f", base, roger dat.",
    f", base, roger that.",
    f", base, roger, good flight.",
    f", base, roger, safe flight.",
    f", base, roger, have a good flight."
]

class BaseOPSATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "bm_daniel"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.ground = None
        self.radar = None
        
        if self.frequency is None:
            raise ValueError("Base OPS ATC frequency not specified in config")

    def set_ground(self, ground: ATCAgency):
        self.ground = ground

    def set_radar(self, radar: ATCAgency):
        self.radar = radar

    def update(self):
        units = self.api.get_units()

    def handle_message(self, recognised_text: str, unit: ATCUnit):
        print(f"[BASE OPS] Original text: '{recognised_text}'")  
        
        # Replace misheard words with correct ones using fuzzy matching
        # Split on spaces, hyphens, punctuation, and other noise characters
        text_words = re.split(r'[\s\-\.,;:!?\(\)\[\]"\']+', recognised_text)
        corrected_words = []
        
        for word in text_words:
            best_match = word
            best_ratio = 0.8  # Minimum similarity threshold
            
            # Check against all word variations for potential corrections
            for correct_word, variations in word_corrections.items():
                for variation in variations:
                    ratio = Levenshtein.ratio(word.lower(), variation.lower())
                    if ratio > best_ratio:
                        best_match = correct_word  # Replace with the correct word
                        best_ratio = ratio
            
            corrected_words.append(best_match)
        
        # Reconstruct the text with corrections
        corrected_text = " ".join(corrected_words)
        
        # Print the corrected text for debugging
        if corrected_text != recognised_text:
            print(f"[BASE OPS] Corrected text: '{corrected_text}'")
            recognised_text = corrected_text
        else:
            print(f"[BASE OPS] Text is correct already: '{corrected_text}'")
            corrected_text = recognised_text      
        
        
        # Check if this is a base message (needs any of the base keywords)
        if not any(keyword in corrected_text.lower() for keyword in base_keywords):
            return  # Not a base message

        text = None
        for words, handler_name in trigger_words:
            # Check if ALL words in the trigger are present
            if all(word in recognised_text.lower() for word in words):
                handler = getattr(self, handler_name)
                text = handler(unit)     
                break  # Use the first match (most specific first)  

        if text:
            self._send_message_to_unit(unit, text)

    def handle_in_and_up_report(self, unit: ATCUnit):
        # Respond to radio check request    
        self.logger.info(f"Responding to IN and UP report from unit {unit.ID}")
        in_message = random.choice(random_in_and_up_responses)
        return f"{unit.callsign}{in_message}"
    
    def handle_in_and_down_report(self, unit: ATCUnit):
        # Respond to radio check request    
        self.logger.info(f"Responding to IN and DOWN report from unit {unit.ID}")
        in_message = random.choice(random_in_and_down_responses)
        return f"{unit.callsign}{in_message}"
    
    def handle_out_report(self, unit: ATCUnit):
        # Respond to radio check request    
        self.logger.info(f"Responding to OUT report from unit {unit.ID}")
        out_message = random.choice(random_out_responses)
        return f"{unit.callsign}{out_message}"


        