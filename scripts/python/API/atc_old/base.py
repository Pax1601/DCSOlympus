from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import random
import Levenshtein
import re

word_corrections = {
    "base": ["base", "bass", "bace", "vase", "pace", "face", "east"],
    "ops": ["ops", "of", "off","offs", "up", "ups", "aps", "stops", "oops", "bud", ],
    "out": ["out", "owt", "awt", "outbound"],
    "in": ["in", "inn", "inbound"],
    "taxi": ["taxi", "tacky", "tack"],
    "down": ["down", "sour"]
}

base_keywords = ["base", "ops"]

trigger_words = [
    (["out"], "handle_out_report"),
    (["in","down"], "handle_in_and_down_report"),
    (["in","up"], "handle_in_and_up_report"),
    (["in"], "handle_in_and_up_report"),  # Default "in" to up/normal
    (["base","ops"], "handle_base_ops_report")
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
        self.logger.debug(f"Original text: '{recognised_text}'")  
        
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
        
        # Log the corrected text for debugging
        if corrected_text != recognised_text:
            self.logger.debug(f"Corrected text: '{corrected_text}'")
            recognised_text = corrected_text
        else:
            self.logger.debug(f"Text is correct already: '{corrected_text}'")
            corrected_text = recognised_text      
        
        
        # Check if this is a base message (needs any of the base keywords)
        if not any(keyword in corrected_text.lower() for keyword in base_keywords):
            return  # Not a base message

        text = None
        for words, handler_name in trigger_words:
            # Check if ALL words in the trigger are present
            if all(word in recognised_text.lower() for word in words):
                handler = getattr(self, handler_name)
                # Pass corrected_words for analysis if it's the base_ops_report handler
                if handler_name == "handle_base_ops_report":
                    text = handler(unit, corrected_words)
                else:
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
    
    def handle_base_ops_report(self, unit: ATCUnit, corrected_words=None):
        # Analyze the corrected words to see if there's meaningful content beyond base keywords
        if corrected_words is None:
            corrected_words = []
        
        # Remove empty words, base keywords, callsign, and very short words
        callsign_words = unit.callsign.lower().split() if hasattr(unit, 'callsign') and unit.callsign else []
        exclude_words = base_keywords + callsign_words
        
        meaningful_words = [word for word in corrected_words 
                           if word.strip() and word.lower() not in exclude_words and len(word) > 2]
        
        self.logger.info(f"Base ops message from unit {unit.ID}. Corrected words: {corrected_words}")
        self.logger.info(f"Meaningful words beyond keywords: {meaningful_words}")
        
        if len(meaningful_words) == 0:
            # They said just "base" or "ops" with nothing else meaningful
            responses = [
                ", base, go ahead.",
                ", base, pass your message."
            ]
            response = random.choice(responses)
            self.logger.info(f"No additional content detected, prompting for more info")
        else:
            # They said base/ops plus other words we didn't understand
            responses = [
                ", base, say again.",
                ", base, say again last.",
                ", base, didn't copy, say again."
            ]
            response = random.choice(responses)
            self.logger.info(f"Additional unclear content detected: {' '.join(meaningful_words)}")
        
        return f"{unit.callsign}{response}"


        