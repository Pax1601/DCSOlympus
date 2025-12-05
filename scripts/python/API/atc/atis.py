from api import API
from atc.agency import ATCAgency, ATCState, ATCUnit, Unicom
import threading
import time


class ATISATC(ATCAgency):
    def __init__(self, airport_name: str, api: API, config: dict, frequency: float, voice: str = "bm_daniel"):
        super().__init__(airport_name, api, config, frequency, voice)
        self.ground = None
        self.radar = None
        self.atis_running = False
        self.atis_thread = None
        self.broadcast_interval = 2  # seconds between broadcasts
        
        if self.frequency is None:
            raise ValueError("ATIS ATC frequency not specified in config")
        
        # Generate audio using this agency's assigned voice
        self.audio_file = self.api.generate_audio_message(self.get_atis_message(), voice=self.voice)
        
        # Start the continuous ATIS broadcast
        self.start_atis_broadcast()

    def __del__(self):
        self.stop_atis_broadcast()

        # Clean up the temporary audio file
        import os
        if os.path.exists(self.audio_file):
            os.remove(self.audio_file)

    def set_ground(self, ground: ATCAgency):
        self.ground = ground

    def set_radar(self, radar: ATCAgency):
        self.radar = radar
        
    def get_atis_message(self) -> str:
        """Generate the ATIS message content"""
        return ("Wiesbaden information code bravo. Oh six hundred zulu. Runway 2 6, colour code blue. "
                "Surface wind 2 2 niner at 6 knots. Visibility better than 15 miles and 15,000. "
                "Temperature plus 2 0, dew point 1 1. Q N H, 1 0 1 2 millibars. 2 niner 8 6 inches. "
                "Transition level 5 0, crash category 8. Recoveries V F R. Wiess is fully serviceable. "
                "Exercise reforger scheduled until 1 8 hundred zulu, expect high performance fixed wing "
                "and rotary aircraft in vicinity of airbase and in the M O A's. Read back all hold short "
                "instructions and advise on initial contact you have information bravo. Out!")

    def start_atis_broadcast(self):
        """Start the continuous ATIS broadcast loop"""
        if not self.atis_running:
            self.atis_running = True
            self.atis_thread = threading.Thread(target=self._atis_broadcast_loop, daemon=True)
            self.atis_thread.start()
            self.logger.info(f"Started ATIS broadcast on {self._format_frequency_for_speech(self.frequency)} every {self.broadcast_interval} seconds")

    def stop_atis_broadcast(self):
        """Stop the continuous ATIS broadcast loop"""
        self.atis_running = False
        if self.atis_thread:
            self.atis_thread.join(timeout=5)
            self.logger.info("Stopped ATIS broadcast")

    def _atis_broadcast_loop(self):
        """Background thread that continuously broadcasts ATIS"""
        while self.atis_running:
            try:
                # Generate and broadcast ATIS message
                self.logger.info("Broadcasting ATIS message")
                
                # Transmit the audio
                success = self.listener.transmit_on_frequency(
                    file_name=self.audio_file,
                    frequency=self.listener.frequency,
                    modulation=self.listener.modulation,
                    encryption=self.listener.encryption
                )
                
                if success:
                    self.logger.info("ATIS broadcast transmitted successfully")
                else:
                    self.logger.error("Failed to transmit ATIS broadcast")
                                
            except Exception as e:
                self.logger.error(f"Error in ATIS broadcast: {e}")
            
            # Wait for the next broadcast
            time.sleep(self.broadcast_interval)

    def update(self):
        units = self.api.get_units()

    def handle_message(self, recognised_text: str, unit: ATCUnit):
        # When someone specifically requests ATIS, send it immediately
        atis_message = self.get_atis_message()
        self._send_message_to_unit(unit, atis_message)
        