import threading
import opuslib # TODO: important, setup dll recognition
import wave
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
        
    def register_recording_callback(self, callback: Callable[[AudioPacket], None]):
        """Set the callback function for handling recorded audio packets."""
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
            print(f"Stopping recording, total packets: {len(self.packets)}")
            
            # Reorder the packets according to their packet ID
            self.packets.sort(key=lambda p: p.get_packet_id())
            
            # Decode to audio data using the opus codec
            opus_decoder = opuslib.Decoder(16000, 1)
            audio_data = bytearray()
            for packet in self.packets:
                decoded_data = opus_decoder.decode(packet.get_audio_data(), frame_size=6400)
                audio_data.extend(decoded_data)
                
            # Save the audio into a temporary wav file with a random name in the tempo folder
            temp_dir = tempfile.gettempdir()
            file_name = os.path.join(temp_dir, next(tempfile._get_candidate_names()) + ".wav")
            with wave.open(file_name, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(16000)
                wav_file.writeframes(audio_data)
                
            if self.recording_callback:
                self.recording_callback(file_name, unit_ID)
                
            # Clear the packets after saving and delete the temporary file
            os.remove(file_name)
            self.packets.clear()
        else:
            print("No packets recorded.")
        
    def start_silence_timer(self):
        if self.silence_timer:
            self.silence_timer.cancel()
        
        # Set a timer for 2 seconds
        self.silence_timer = threading.Timer(2.0, self.stop_recording)
        self.silence_timer.start()

    