"""
Audio Listener Module

WebSocket-based audio listener for real-time audio communication.
"""

import asyncio
import random
import websockets
import logging
import threading
from typing import Dict, Optional, Callable, Any
import json

from audio.audio_packet import AudioPacket, MessageType
from audio.audio_recorder import AudioRecorder
from utils.utils import coalition_to_enum

import wave
import opuslib
import time

class RadioListener:
    """
    WebSocket audio listener that connects to a specified address and port
    to receive audio messages with graceful shutdown handling.
    """
    
    def __init__(self, api, address: str = "localhost", port: int = 5000):
        """
        Initialize the RadioListener.
        
        Args:
            address (str): WebSocket server address
            port (int): WebSocket server port
            message_callback: Optional callback function for handling received messages
        """
        self.api = api
        
        self.address = address
        self.port = port
        self.websocket_url = f"ws://{address}:{port}"
        self.message_callback = None
        self.clients_callback = None
        
        self.frequency = 0
        self.modulation = 0
        self.encryption = 0
        self.coalition = "blue"
        self.intercom_ID = None
                
        self.audio_recorders: Dict[str, AudioRecorder] = {}
        
        # The guid is a random 22 char string, used to identify the radio
        self._guid = ''.join(random.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(22))
        
        # Connection and control
        self._websocket: Optional[websockets.WebSocketServerProtocol] = None
        self._running = False
        self._should_stop = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        
        # Clients data
        self.clients_data: dict = {}
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API")
                
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
                        recorder.register_recording_callback(self._recording_callback)
                        
                    self.audio_recorders[audio_packet.get_transmission_guid()].add_packet(audio_packet)
            elif message_type == MessageType.CLIENTS_DATA.value:
                clients_data = json.loads(message[1:])
                self.clients_data = clients_data
                if self.clients_callback:
                    self.clients_callback(clients_data)

        except Exception as e:
            self.logger.error(f"Error handling message: {e}")
            
    def _recording_callback(self, wav_filename: str, unit_id: str) -> None:
        """
        Callback for when audio data is recorded.
        
        Args:
            wav_filename: Path to the recorded WAV file
            unit_id: The unit ID that recorded the audio
        """
        self.logger.info(f"Recording callback triggered with file: {wav_filename}, unit_id: {unit_id}")
        
        if self.message_callback:
            try:
                # Use API's centralized transcription service
                recognized_text = self.api.transcribe_audio(wav_filename)
                
                self.logger.info(f"Transcribed text: '{recognized_text}'")
                if recognized_text:
                    self.message_callback(recognized_text, unit_id)
                else:
                    self.logger.debug("No speech detected in audio")
                    
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
                # Clean up the temporary file after processing
                try:
                    import os
                    if os.path.exists(wav_filename):
                        os.remove(wav_filename)
                        self.logger.debug(f"Cleaned up temporary file: {wav_filename}")
                except Exception as cleanup_error:
                    self.logger.warning(f"Failed to clean up temporary file {wav_filename}: {cleanup_error}")
        else:
            self.logger.warning("No message callback registered to handle recorded audio")
            # Still clean up the file even if no callback is registered
            try:
                import os
                if os.path.exists(wav_filename):
                    os.remove(wav_filename)
            except Exception:
                pass
    
    async def _listen(self) -> None:
        """Main WebSocket listening loop."""
        retry_count = 0
        max_retries = 5
        retry_delay = 2.0
        
        while not self._should_stop and retry_count < max_retries:
            try:
                self.logger.info(f"Connecting to WebSocket at {self.websocket_url}")
                
                async with websockets.connect(
                    self.websocket_url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=10
                ) as websocket:
                    self._websocket = websocket
                    self._running = True
                    retry_count = 0  # Reset retry count on successful connection
                    
                    self.logger.info("WebSocket connection established")
                    
                    # Send the sync radio settings message
                    await self._sync_radio_settings()
                    
                    # Listen for messages
                    async for message in websocket:
                        if self._should_stop:
                            break
                        await self._handle_message(message)
                        
            except websockets.exceptions.ConnectionClosed:
                self.logger.warning("WebSocket connection closed")
                if not self._should_stop:
                    retry_count += 1
                    if retry_count < max_retries:
                        self.logger.info(f"Retrying connection in {retry_delay} seconds... (attempt {retry_count}/{max_retries})")
                        await asyncio.sleep(retry_delay)
                        retry_delay = min(retry_delay * 1.5, 30.0)  # Exponential backoff, max 30 seconds
                    else:
                        self.logger.error("Max retries reached, giving up")
                        break
            except websockets.exceptions.InvalidURI:
                self.logger.error(f"Invalid WebSocket URI: {self.websocket_url}")
                break
            except OSError as e:
                self.logger.error(f"Connection error: {e}")
                if not self._should_stop:
                    retry_count += 1
                    if retry_count < max_retries:
                        self.logger.info(f"Retrying connection in {retry_delay} seconds... (attempt {retry_count}/{max_retries})")
                        await asyncio.sleep(retry_delay)
                        retry_delay = min(retry_delay * 1.5, 30.0)
                    else:
                        self.logger.error("Max retries reached, giving up")
                        break
            except Exception as e:
                self.logger.error(f"Unexpected error in WebSocket listener: {e}")
                break
        
        self._running = False
        self._websocket = None
        self.logger.info("Audio listener stopped")
    
    def _run_event_loop(self) -> None:
        """Run the asyncio event loop in a separate thread."""
        try:
            # Create new event loop for this thread
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            
            # Run the listener
            self._loop.run_until_complete(self._listen())
            
        except Exception as e:
            self.logger.error(f"Error in event loop: {e}")
        finally:
            # Clean up
            if self._loop and not self._loop.is_closed():
                self._loop.close()
            self._loop = None

    async def _sync_radio_settings(self):
        """Send the radio settings of each radio to the SRS backend"""
        message = {
            "type": "Settings update",
            "guid": self._guid,
            "coalition": coalition_to_enum(self.coalition),
            "settings": [
                {
                    "frequency": self.frequency,
                    "modulation": self.modulation,
                    "ptt": False,
                }
            ]
        }
        
        if self.intercom_ID is not None:
            message["unitID"] = self.intercom_ID

        if self._websocket:
            message_bytes = json.dumps(message).encode('utf-8')
            data = bytes([MessageType.AUDIO.SETTINGS.value]) + message_bytes
            await self._websocket.send(data)
                    
    def _send_message(self, file_name: str, frequency: float | None, modulation: int | None, encryption: int | None, intercom_ID: int | None, unit_ID: int | None) -> bool:
        if (intercom_ID is not None):
            frequency = 100
            modulation = 2
            encryption = 0
            
        if frequency is None or modulation is None or encryption is None:
            self.logger.error("Frequency, modulation, and encryption must be specified for transmission")
            return False
        
        try:
            # Open WAV file
            with wave.open(file_name, 'rb') as wf:
                if wf.getnchannels() != 1 or wf.getframerate() != 16000 or wf.getsampwidth() != 2:
                    self.logger.error("Input WAV must be mono, 16kHz, 16-bit (linear16)")
                    return False
                frame_size = int(16000 * 0.04)  # 40ms frames = 640 samples
                encoder = opuslib.Encoder(16000, 1, opuslib.APPLICATION_AUDIO)
                packet_id = 0
                while True:
                    pcm_bytes = wf.readframes(frame_size)
                    if not pcm_bytes or len(pcm_bytes) < frame_size * 2:
                        break
                    # Encode PCM to OPUS
                    try:
                        opus_data = encoder.encode(pcm_bytes, frame_size)
                    except Exception as e:
                        self.logger.error(f"Opus encoding failed: {e}")
                        return False
                    # Create AudioPacket
                    packet = AudioPacket()
                    
                    # If provided, set intercom ID as unit ID
                    if intercom_ID is not None:
                        packet.set_unit_id(intercom_ID)
                    elif unit_ID is not None:
                        packet.set_unit_id(unit_ID)
                    
                    packet.set_packet_id(packet_id)
                    packet.set_audio_data(opus_data)
                    packet.set_frequencies([{
                        'frequency': frequency,
                        'modulation': modulation,
                        'encryption': encryption
                        }])
                    packet.set_transmission_guid(self._guid)
                    packet.set_client_guid(self._guid)
                    # Serialize and send over websocket
                    if self._websocket and self._loop and not self._loop.is_closed():
                        data = packet.to_byte_array()
                        fut = asyncio.run_coroutine_threadsafe(self._websocket.send(data), self._loop)
                        try:
                            fut.result(timeout=2.0)
                        except Exception as send_err:
                            self.logger.error(f"Failed to send packet {packet_id}: {send_err}")
                            return False
                    else:
                        self.logger.error("WebSocket not connected")
                        return False
                    packet_id += 1
                    time.sleep(0.04)  # Simulate real-time transmission
            self.logger.info(f"Transmitted {packet_id} packets from {file_name}")
            return True
        except Exception as e:
            self.logger.error(f"Transmit failed: {e}")
            return False

            
    def register_message_callback(self, callback: Callable[[str, str], None]) -> None:
        """Set the callback function for handling received messages.
        Args:
            callback (Callable[[str, str], None]): Function to call with recognized text and unit ID"""
        self.message_callback = callback
        
    def register_clients_callback(self, callback: Callable[[dict], None]) -> None:
        """Set the callback function for handling clients data."""
        self.clients_callback = callback
        
    def start(self, frequency: int, modulation: int, encryption: int) -> None:
        """Start the audio listener in a separate thread.
        
        Args:
            frequency (int): Transmission frequency in Hz
            modulation (int): Modulation type (0 for AM, 1 for FM, etc.)
            encryption (int): Encryption type (0 for none, 1 for simple, etc., TODO)
        """
        if self._running or self._thread is not None:
            self.logger.warning("RadioListener is already running")
            return
        
        self._should_stop = False
        self._thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self._thread.start()
        
        self.logger.info(f"RadioListener started, connecting to {self.websocket_url}")
        self.frequency = frequency
        self.modulation = modulation
        self.encryption = encryption
        
        
    def start_on_intercom(self, intercom_ID: int) -> None:
        """Start the audio listener in a separate thread.
        Args:
            intercom_ID (int): Intercom ID to listen to
        """
        if self._running or self._thread is not None:
            self.logger.warning("RadioListener is already running")
            return
        
        self._should_stop = False
        self._thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self._thread.start()
        
        self.logger.info(f"RadioListener started, connecting to {self.websocket_url}")
        self.intercom_ID = intercom_ID
        
    def transmit_on_frequency(self, file_name: str, frequency: float, modulation: int, encryption: int, **kwargs) -> bool:
        """
        Transmit a WAV file as OPUS frames over the websocket.
        Args:
            file_name (str): Path to the input WAV file (linear16, mono, 16kHz)
            frequency (float): Transmission frequency
            modulation (int): Modulation type
            encryption (int): Encryption type

        Kwargs:
            unit_ID (int, optional): The unit ID of the source unit to impersonate

        Returns:
            bool: True if transmission succeeded, False otherwise
        """
        return self._send_message(file_name, frequency, modulation, encryption, None, kwargs.get("unit_ID"))
    
    def transmit_on_intercom(self, file_name: str, intercom_ID: int) -> bool:
        """
        Transmit a WAV file as OPUS frames over the websocket on a specific intercom ID.
        Args:
            file_name (str): Path to the input WAV file (linear16, mono, 16kHz)
            intercom_ID (int): Unit ID to transmit to
        Returns:
            bool: True if transmission succeeded, False otherwise
        """
        return self._send_message(file_name, None, None, None, intercom_ID)

    def stop(self) -> None:
        """Stop the audio listener gracefully."""
        if not self._running and self._thread is None:
            self.logger.info("RadioListener is not running")
            return
        
        self.logger.info("Stopping RadioListener...")
        self._should_stop = True
        
        # Close WebSocket connection if active
        if self._websocket and self._loop:
            # Schedule the close in the event loop
            if not self._loop.is_closed():
                asyncio.run_coroutine_threadsafe(self._websocket.close(), self._loop)
        
        # Wait for thread to finish
        if self._thread:
            self._thread.join(timeout=5.0)
            if self._thread.is_alive():
                self.logger.warning("Thread did not stop gracefully within timeout")
            self._thread = None
        
        self._running = False
        self.logger.info("RadioListener stopped")
    
    def is_running(self) -> bool:
        """Check if the audio listener is currently running."""
        return self._running
    
    def is_connected(self) -> bool:
        """Check if WebSocket is currently connected."""
        return self._websocket is not None and not self._websocket.closed
        
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with graceful shutdown."""
        self.stop()
        
    
