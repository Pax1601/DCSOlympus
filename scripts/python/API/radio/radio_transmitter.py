"""
Radio Transmitter Module

WebSocket-based radio transmitter for sending audio messages.
Simplified version that only handles transmission, no receiving.
"""

import asyncio
import random
import websockets
import logging
import threading
from typing import Optional
import json

from audio.audio_packet import AudioPacket, MessageType
from utils.utils import coalition_to_enum

import wave
import opuslib
import time

class RadioTransmitter:
    """
    WebSocket radio transmitter that connects to a specified address and port
    to send audio messages. Does not receive or process incoming messages.
    """
    
    def __init__(self, address: str, port: int | None):
        """
        Initialize the RadioTransmitter.
        
        Args:
            address (str): WebSocket server address
            port (int | None): WebSocket server port (None for wss://)
        """
        self.address = address
        self.port = port
        if port is None:
            self.websocket_url = f"wss://{address}"
        else:
            self.websocket_url = f"ws://{address}:{port}"
        
        self.coalition = "blue"
        
        # The guid is a random 22 char string, used to identify the radio
        self._guid = ''.join(random.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(22))
        
        # Connection and control
        self._websocket: Optional[websockets.WebSocketServerProtocol] = None
        self._running = False
        self._should_stop = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        
        # Transmission mutex to ensure only one message plays at a time
        self._transmission_lock = threading.Lock()
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API.RadioTransmitter")
    
    async def _connect_and_maintain(self) -> None:
        """Connect to WebSocket and maintain connection."""
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
                    
                    # Keep the connection alive
                    while not self._should_stop:
                        try:
                            # Just wait, we don't process incoming messages
                            await asyncio.sleep(1.0)
                        except asyncio.CancelledError:
                            break
                        
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
                self.logger.error(f"Unexpected error in WebSocket connection: {e}")
                break
        
        self._running = False
        self._websocket = None
        self.logger.info("Radio transmitter stopped")
    
    def _run_event_loop(self) -> None:
        """Run the asyncio event loop in a separate thread."""
        try:
            # Create new event loop for this thread
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            
            # Run the connection
            self._loop.run_until_complete(self._connect_and_maintain())
            
        except Exception as e:
            self.logger.error(f"Error in event loop: {e}")
        finally:
            # Clean up
            if self._loop and not self._loop.is_closed():
                self._loop.close()
            self._loop = None
    
    def _send_message(self, file_name: str, frequency: float | None, modulation: int | None, encryption: int | None, intercom_ID: int | None, unit_ID: int | None) -> bool:
        """
        Internal method to send a WAV file as OPUS frames over the websocket.
        
        Args:
            file_name: Path to the input WAV file (linear16, mono, 16kHz)
            frequency: Transmission frequency
            modulation: Modulation type
            encryption: Encryption type
            intercom_ID: Intercom ID (if transmitting on intercom)
            unit_ID: Unit ID to impersonate
            
        Returns:
            bool: True if transmission succeeded, False otherwise
        """
        # Acquire the transmission lock to ensure only one message plays at a time
        acquired = self._transmission_lock.acquire(blocking=True, timeout=30.0)
        if not acquired:
            self.logger.error("Failed to acquire transmission lock within timeout")
            return False
        
        try:
            if intercom_ID is not None:
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
                        
                        # If provided, set intercom ID or unit ID
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
        finally:
            # Always release the lock
            self._transmission_lock.release()
    
    def start(self) -> None:
        """Start the radio transmitter in a separate thread."""
        if self._running or self._thread is not None:
            self.logger.warning("RadioTransmitter is already running")
            return
        
        self._should_stop = False
        self._thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self._thread.start()
        
        self.logger.info(f"RadioTransmitter started, connecting to {self.websocket_url}")
    
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
        return self._send_message(file_name, None, None, None, intercom_ID, None)

    def stop(self) -> None:
        """Stop the radio transmitter gracefully."""
        if not self._running and self._thread is None:
            self.logger.info("RadioTransmitter is not running")
            return
        
        self.logger.info("Stopping RadioTransmitter...")
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
        self.logger.info("RadioTransmitter stopped")
    
    def is_running(self) -> bool:
        """Check if the radio transmitter is currently running."""
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
