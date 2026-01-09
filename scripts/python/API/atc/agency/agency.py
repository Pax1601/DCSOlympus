from sentence_transformers import SentenceTransformer
from api import API
import logging

from unit.unit import Unit

class Agency:
    # Class-level storage for models and embeddings per agency type
    _models = {}
    _embeddings = {}
    
    def __init__(self, name: str, config: dict, api: API, logger: logging.Logger):
        self.name = name
        self.api = api
        self.logger = logger
        
        # Create a listener for SRS communications on the given frequency
        self.listener = self.api.create_radio_listener() # Convert MHz to Hz
        self.listener.start(frequency=config.get("frequency") * 1e6)        
        self.listener.register_message_callback(self.handle_message)
        self.logger.info(f"Agency {name} initialized on frequency {config.get('frequency')} MHz")
        
        # Initialize the listener with the prompt and enable calling callsign prepending
        self.listener.set_prompt(self.get_radio_prompt())
        self.listener.set_prepend_calling_callsign(True)
        
        # Initialize sentence transformer if this agency uses it
        self._initialize_sentence_transformer()

    # Handle incoming messages from units
    def handle_message(self, recognized_text: str, unit_id: str):
        self.logger.info(f"Agency {self.name} received message from {unit_id}: {recognized_text}")

        # Remove all special characters and make lowercase.
        import re
        recognized_text = re.sub(r'[^a-zA-Z0-9\s]', '', recognized_text).lower()

        type = self.name.lower().split(" ")[-1]  # Get the type (e.g., "base", "tower", etc.)

        if type not in recognized_text:
            return  # Ignore messages that don't mention the agency type
        
        # Find the unit by its ID
        units = self.api.get_units()
        if unit_id in units:
            unit = units[unit_id]
            self.logger.info(f"Message from unit {unit.callsign}")

            # Try to remove the callsign to simplify intent recognition
            recognized_text = recognized_text.replace(unit.callsign.lower(), "").strip()

            # Try to remove the agency name (without the agency type) to simplify intent recognition
            # If the agency type is included in the message, strip all partes of the message before it, but keep it
            if type in recognized_text:
                recognized_text = recognized_text.split(type, 1)[1].strip()
            
            # If the unit is an ATCUnit, call its handle_message method. Keep here to avoid circular imports.
            from atc.atc_unit import ATCUnit
            if isinstance(unit, ATCUnit):
                unit.handle_message(self, recognized_text)

    # Transmit a message via the agency's listener
    def transmit_message(self, message: str):
        self.logger.info(f"Agency {self.name} transmitting message: {message}")

        # Generate the audio message
        wav_file = self.api.generate_audio_message(message)

        # Transmit the audio message on the agency's frequency
        self.listener.transmit_on_frequency(wav_file, self.listener.frequency, self.listener.modulation, self.listener.encryption)
        
        # Clean up the temporary audio file
        import os
        if os.path.exists(wav_file):
            os.remove(wav_file)
            self.logger.debug(f"Cleaned up audio file: {wav_file}")

    def _initialize_sentence_transformer(self):
        """
        Initialize the sentence transformer model and embeddings for this agency.
        Only initializes once per agency class type.
        """
        # Get the class name to use as key for storing models/embeddings
        class_name = self.__class__.__name__
        
        # Check if this agency type uses sentence transformers
        sentences = self.get_sentences()
        if not sentences:
            return
        
        # Initialize the model only once per agency class
        if class_name not in Agency._models:
            Agency._models[class_name] = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Convert the sentences dict to a list
            sentences_list = []
            for sentence_group in sentences.values():
                if isinstance(sentence_group, list):
                    sentences_list.extend(sentence_group)
                else:
                    sentences_list.append(sentence_group)
            
            # Encode the sentences
            Agency._embeddings[class_name] = Agency._models[class_name].encode(sentences_list)
            self.logger.info(f"Initialized sentence transformer for {class_name} with {len(sentences_list)} sentences")
    
    # Recognize the probable intent of a message using sentence transformers
    def get_probable_intent(self, message: str):
        model = self.get_sentence_transformer_model()
        if model is None:
            self.logger.error("No sentence transformer model available for intent recognition")
            return None
        
        # Implement intent recognition logic here using the model
        self.logger.info(f"Recognizing intent for message: {message}")
        similarities = model.similarity(self.get_embeddings(), model.encode([message]))

        # Get the list of sentences
        sentences_list = []
        for sentence_group in self.get_sentences().values():
            sentences_list.extend(sentence_group)

        # Check if any similarity exceeds a certain threshold
        threshold = 0.5

        # Print all the similarities for debugging
        for i, similarity in enumerate(similarities):
            self.logger.debug(f"Similarity for sentence '{sentences_list[i]}': {similarity}")

        # Retrieve intent based on highest similarity above threshold
        intent = None
        for i, similarity in enumerate(similarities):
            if similarity >= threshold:
                # Find the intent associated to this sentence 
                sentence = sentences_list[i]
                intent  = None
                for intent, sentences in self.get_sentences().items():
                    if sentence in sentences:
                        intent = intent
                        break
                
                self.logger.info(f"Recognized intent with similarity {similarity}: {intent}")
                threshold = similarity  # Update threshold to the highest found
        
        if intent is not None:
            return intent
            
        # Fallback: simple keyword matching
        # Split the message into words
        words = message.lower().split()
        for intent in self.get_sentences().keys():
            # Split the intent into words
            intent_words = intent.lower().split()
            if all(word in words for word in intent_words):
                self.logger.info(f"Recognized intent by keyword matching: {intent}")
                return intent
            
        self.logger.info("No intent recognized above the threshold or by keyword matching")       
        return None
    
    # Get the precomputed embeddings for this agency.
    def get_embeddings(self):
        class_name = self.__class__.__name__
        return Agency._embeddings.get(class_name, None)
    
    # Get the sentence transformer model for this agency.
    def get_sentence_transformer_model(self) -> SentenceTransformer | None:
        class_name = self.__class__.__name__
        return Agency._models.get(class_name, None)
    
    ## Abstract methods to be implemented by subclasses #################################################################
    # Get radio prompt specific to the agency. This should be overridden by subclasses.
    def get_radio_prompt(self) -> str:
        self.logger.warning("get_radio_prompt not implemented in base Agency class")
        return ""
    
    # Check if a unit is under this agency's control. This should be overridden by subclasses.
    # For example if a unit calls ground from the air, this should return False.
    def is_valid_agency(self, unit: Unit) -> bool:
        self.logger.warning("is_valid_agency not implemented in base Agency class")
        return False
    
    # Get predefined sentences for intent recognition. This should be overridden by subclasses.
    def get_sentences(self) -> dict[str, list[str]]:
        return {}
    
        