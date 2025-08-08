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
from google.cloud import speech
from google.cloud.speech import SpeechContext

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
        self.speech_contexts = []
                
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
        self.logger = logging.getLogger(f"RadioListener-{address}:{port}")
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
                
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
            recorder: The AudioRecorder instance
            audio_data: The recorded audio data
        """
        if self.message_callback:
            with open(wav_filename, 'rb') as audio_file:
                audio_content = audio_file.read()

            client = speech.SpeechClient()
            config = speech.RecognitionConfig(
                language_code="en",
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                speech_contexts=[self.speech_contexts]
            )
            audio = speech.RecognitionAudio(content=audio_content)

            # Synchronous speech recognition request
            response = client.recognize(config=config, audio=audio)

            # Extract recognized text
            recognized_text = " ".join([result.alternatives[0].transcript for result in response.results])
            
            self.message_callback(recognized_text, unit_id)
        else:
            self.logger.warning("No message callback registered to handle recorded audio")
    
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

        if self._websocket:
            message_bytes = json.dumps(message).encode('utf-8')
            data = bytes([MessageType.AUDIO.SETTINGS.value]) + message_bytes
            await self._websocket.send(data)
            
    async def _send_message(self, message: Any) -> bool:
        """
        Send a message through the WebSocket connection.
        
        Args:
            message: Message to send (will be JSON-encoded if not a string)
            
        Returns:
            bool: True if message was sent successfully, False otherwise
        """
        if not self.is_connected():
            self.logger.warning("Cannot send message: WebSocket not connected")
            return False
        
        try:
            # Convert message to string if needed
            if isinstance(message, str):
                data = message
            else:
                data = json.dumps(message)
            
            await self._websocket.send(data)
            self.logger.debug(f"Sent message: {data}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error sending message: {e}")
            return False
            
    def register_message_callback(self, callback: Callable[[str, str], None]) -> None:
        """Set the callback function for handling received messages.
        Args:
            callback (Callable[[str, str], None]): Function to call with recognized text and unit ID"""
        self.message_callback = callback
        
    def register_clients_callback(self, callback: Callable[[dict], None]) -> None:
        """Set the callback function for handling clients data."""
        self.clients_callback = callback
        
    def set_speech_contexts(self, contexts: list[SpeechContext]) -> None:
        """
        Set the speech contexts for speech recognition.
        
        Args:
            contexts (list[SpeechContext]): List of SpeechContext objects
        """
        self.speech_contexts = contexts

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
        
    def transmit_on_frequency(self, file_name: str, frequency: float, modulation: int, encryption: int) -> bool:
        """
        Transmit a WAV file as OPUS frames over the websocket.
        Args:
            file_name (str): Path to the input WAV file (linear16, mono, 16kHz)
            frequency (float): Transmission frequency
            modulation (int): Modulation type
            encryption (int): Encryption type
        Returns:
            bool: True if transmission succeeded, False otherwise
        """

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

