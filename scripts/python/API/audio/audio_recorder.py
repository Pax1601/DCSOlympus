import threading
import opuslib # TODO: important, setup dll recognition
import wave
import logging
from typing import Callable

from audio.audio_packet import AudioPacket
import tempfile
import os

class AudioRecorder:
    def __init__(self, api):
        self.packets: list[AudioPacket] = []
        self.silence_timer = None
        self.recording_callback = None
        self.api = api
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API")
        
    def register_recording_callback(self, callback: Callable[[str, str], None]):
        """Set the callback function for handling recorded audio packets.
        
        Args:
            callback: Function that takes (wav_filename: str, unit_id: str)
        """
        self.recording_callback = callback

    def add_packet(self, packet: AudioPacket):
        self.packets.append(packet)
        
        # Start a countdown timer to stop recording after 2 seconds of silence
        self.start_silence_timer()
        
    def stop_recording(self):
        if self.silence_timer:
            self.silence_timer.cancel()
            self.silence_timer = None
            
        # Extract the client GUID from the first packet if available
        unit_ID = self.packets[0].get_unit_id() if self.packets else None
        
        # Process the recorded packets
        if self.packets:
            self.logger.info(f"Stopping recording, total packets: {len(self.packets)}")
            
            try:
                # Reorder the packets according to their packet ID
                self.packets.sort(key=lambda p: p.get_packet_id())
                
                # Decode to audio data using the opus codec
                opus_decoder = opuslib.Decoder(16000, 1)
                audio_data = bytearray()
                for packet in self.packets:
                    decoded_data = opus_decoder.decode(packet.get_audio_data(), frame_size=6400)
                    audio_data.extend(decoded_data)
                    
                self.logger.debug(f"Decoded audio data size: {len(audio_data)} bytes")
                
                # Save the audio into a temporary wav file with a random name in the temp folder
                temp_dir = tempfile.gettempdir()
                file_name = os.path.join(temp_dir, next(tempfile._get_candidate_names()) + ".wav")
                self.logger.debug(f"Creating WAV file: {file_name}")
                
                # Ensure the temp directory exists
                os.makedirs(temp_dir, exist_ok=True)
                
                with wave.open(file_name, "wb") as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(16000)
                    wav_file.writeframes(audio_data)
                
                # Verify file was created successfully
                if os.path.exists(file_name):
                    file_size = os.path.getsize(file_name)
                    self.logger.info(f"WAV file created successfully: {file_name}, size: {file_size} bytes")
                    
                    # Small delay to ensure file is fully written and accessible
                    import time
                    time.sleep(0.1)
                    
                    if self.recording_callback:
                        self.recording_callback(file_name, unit_ID)
                else:
                    self.logger.error(f"Failed to create WAV file: {file_name}")
                    
            except Exception as e:
                self.logger.error(f"Error in stop_recording: {e}")
                import traceback
                self.logger.error(f"Traceback: {traceback.format_exc()}")
                
            # Clear the packets after saving
            # Note: The callback is responsible for cleaning up the temp file
            self.packets.clear()
        else:
            self.logger.debug("No packets recorded.")
        
    def start_silence_timer(self):
        if self.silence_timer:
            self.silence_timer.cancel()
        
        # Set a timer for 2 seconds
        self.silence_timer = threading.Timer(2.0, self.stop_recording)
        self.silence_timer.start()

    