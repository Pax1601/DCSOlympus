import asyncio

from radio.radio_transmitter import RadioTransmitter
from audio.audio_recorder import AudioRecorder

import logging
from typing import Dict, Callable
import json
import os

from api import API
from audio.audio_packet import AudioPacket, MessageType
from audio.audio_recorder import AudioRecorder

test_counter = 1

class RadioListener(RadioTransmitter):
    def __init__(self, api: API, address: str, port: int | None):
        """
        Initialize the RadioListener.
        
        Args:
            address (str): WebSocket server address
            port (int): WebSocket server port
            endpoint (str): WebSocket server endpoint
        """
        self.api = api
        super().__init__(address, port)
        
        self.message_callback = None
        self.clients_callback = None
        
        self.frequency = 0
        self.modulation = 0
        self.encryption = 0
        self.intercom_ID = None
        
        self.prompt = ""
        self.prepend_calling_callsign = False
                
        self.audio_recorders: Dict[str, AudioRecorder] = {}
        
        # Clients data
        self.clients_data: dict = {}
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API.RadioReceiver")
        
    async def _handle_message(self, message: bytes) -> None:
        """
        Handle received WebSocket message.
        
        Args:
            message: Raw message from WebSocket
        """
        try:
            # Extract the first byte to determine message type  
            message_type = message[0]
            
            if message_type == MessageType.AUDIO.value:
                audio_packet = AudioPacket()
                audio_packet.from_byte_array(message[1:])
                
                if audio_packet.get_transmission_guid() != self._guid:                    
                    if audio_packet.get_transmission_guid() not in self.audio_recorders:
                        recorder = AudioRecorder(self.api)
                        self.audio_recorders[audio_packet.get_transmission_guid()] = recorder
                        recorder.register_recording_callback(lambda wav_filename, unit_id: asyncio.create_task(self._recording_callback(wav_filename, unit_id)))
                        
                    self.audio_recorders[audio_packet.get_transmission_guid()].add_packet(audio_packet)
            elif message_type == MessageType.CLIENTS_DATA.value:
                clients_data = json.loads(message[1:])
                self.clients_data = clients_data
                if self.clients_callback:
                    self.clients_callback(clients_data)

        except Exception as e:
            self.logger.error(f"Error handling message: {e}")
            
    def _sync_radio_settings(self, frequency = None, modulation = None, intercom_ID = None, ptt = False):
        if frequency is None:
            frequency = self.frequency
        if modulation is None:
            modulation = self.modulation
        if intercom_ID is None:
            intercom_ID = self.intercom_ID
            
        # TODO for the time being intercom listening is not working!
            
        return super()._sync_radio_settings(frequency, modulation, intercom_ID, ptt)
            
    async def _recording_callback(self, wav_filename: str, unit_id: str) -> None:
        """
        Callback for when audio data is recorded.
        
        Args:
            wav_filename: Path to the recorded WAV file
            unit_id: The unit ID that recorded the audio
        """
        global test_counter
        self.logger.info(f"Recording callback triggered with file: {wav_filename}, unit_id: {unit_id}")

        # If a unit id with this id does not exit, add it as a test unit
        units = self.api.get_units()
        if unit_id not in units:
            from unit.unit import Unit
            test_unit = Unit(int(unit_id), self.api)
            test_unit.callsign = f"Olympus_API_RadioListener_{test_counter}"
            test_counter += 1
            test_unit.human = True
            test_unit.alive = True
            test_unit.airborne = False
            self.api.add_test_unit(test_unit)
            self.logger.info(f"Added test unit with ID {unit_id} for recording callback")
        
        keep_message = False
        if self.message_callback:
            try:
                prompt = self.prompt
                # Find the unit's callsign to prepend if needed
                if self.prepend_calling_callsign:
                    units = self.api.get_units()
                    if unit_id in units:
                        callsign = units[unit_id].callsign
                        if callsign:
                            prompt = f"The following message is from callsign {callsign}. {prompt}"
                            self.logger.debug(f"Prepended callsign to prompt: {prompt}")
                
                # Use API's centralized transcription service
                recognized_text = await self.api.transcribe_audio_in_executor(wav_filename, prompt)
                
                self.logger.info(f"Transcribed text: '{recognized_text}'")
                keep_message = self.message_callback(recognized_text, unit_id) or False
                    
            except RuntimeError as e:
                self.logger.error(f"Whisper model not available: {e}")
            except FileNotFoundError as e:
                self.logger.error(f"Audio file not found: {wav_filename} - {e}")
            except PermissionError as e:
                self.logger.error(f"Permission denied accessing audio file: {wav_filename} - {e}")
            except Exception as e:
                self.logger.error(f"Error during audio transcription: {e}")
                self.logger.error(f"File path: {wav_filename}")
                import traceback
                self.logger.error(f"Traceback: {traceback.format_exc()}")
            finally:
                # Clean up the temporary file after processing, but only if something was transcribed.
                # If transcription failed, we might want to keep the file for debugging purposes. 
                # Move the file to a "failed_transcriptions" folder instead of deleting it, to avoid losing potentially important debugging information.
                if recognized_text and not keep_message:
                    try:
                        if os.path.exists(wav_filename):
                            os.remove(wav_filename)
                    except Exception as e:
                        self.logger.error(f"Failed to delete temporary audio file {wav_filename}: {e}", exc_info=True)
                else:
                    store_dir = "failed_transcriptions" if not keep_message else "kept_transcriptions"
                    os.makedirs(store_dir, exist_ok=True)
                    store_path = os.path.join(store_dir, os.path.basename(wav_filename))
                    try:
                        os.rename(wav_filename, store_path)
                        self.logger.info(f"Moved transcription audio to {store_path} for debugging")
                    except Exception as e:
                        self.logger.error(f"Failed to move transcription audio file {wav_filename}: {e}", exc_info=True)
        else:
            self.logger.warning("No message callback registered to handle recorded audio")
            # Still clean up the file even if no callback is registered
            try:
                if os.path.exists(wav_filename):
                    os.remove(wav_filename)
            except Exception:
                pass
    
    def register_message_callback(self, callback: Callable[[str, str], None]) -> None:
        """Set the callback function for handling received messages.
        Args:
            callback (Callable[[str, str], None]): Function to call with recognized text and unit ID"""
        self.message_callback = callback
        
    def register_clients_callback(self, callback: Callable[[dict], None]) -> None:
        """Set the callback function for handling clients data."""
        self.clients_callback = callback
        
    def set_prompt(self, prompt: str) -> None:
        """Set the prompt to use for transcription.
        
        Args:
            prompt (str): The prompt string
        """
        self.prompt = prompt
        
    def set_coalition(self, coalition: str) -> None:
        """Set the coalition for this radio listener (e.g. 'blue' or 'red').
        
        Args:
            coalition (str): The coalition name
        """
        self.coalition = coalition
      
    def set_prepend_calling_callsign(self, prepend: bool) -> None:
        """Set whether to prepend the calling unit's callsign to the transcription prompt.
        
        Args:
            prepend (bool): True to prepend callsign, False otherwise
        """
        self.prepend_calling_callsign = prepend

    def transmit_on_frequency(self, file_name, frequency=None, modulation=None, encryption=None, **kwargs):
        return super().transmit_on_frequency(file_name, frequency or self.frequency, modulation or self.modulation, encryption or self.encryption, **kwargs)
        
    def start(self, frequency: float | None = None, modulation: int | None = None, encryption: int | None = None, intercom_ID: int | None = None):
        """Start the listener. This requires an active asyncio loop. If used in a plugin this will be handled by the manager. Otherwise, first run api.run() to create a loop.
        
        Args:
            frequency(float | None): frequency in Hertz
            modulation(int | None): 0 = AM, 1 = FM
            encryption(int | None): Currently not used
            intercom_ID(int | None): Unit ID of the unit to listen to the intercom of. Currently not used.
        """
        
        self.frequency = frequency
        self.modulation = modulation
        self.encryption = encryption
        self.intercom_ID = intercom_ID
        
        # Log the status
        if self.frequency is None or self.modulation is None or self.encryption is None:
            if self.intercom_ID is None:
                self.logger.error("Could not start listener, missing arguments")
                return
            else:
                self.logger.info("Starting radio listener on intercom. Intercom ID %d", self.intercom_ID)
        else:
            self.logger.info("Starting radio listener. Frequency: %.2fMHz Modulation: %d Encryption %d", self.frequency * 1e6, self.modulation, self.encryption)
            if self.intercom_ID is not None:
                self.logger.warning("Radio listener initialized with both a frequency and intercom ID. Intercom will be ignored.")
        return super().start()