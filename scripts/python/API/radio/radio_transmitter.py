"""
Radio Transmitter Module

WebSocket-based radio transmitter for sending audio messages.
Simplified version that only handles transmission, no receiving.
"""

import asyncio
import random
import websockets
import logging
import json
import os

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
        self._websocket: websockets.WebSocketServerProtocol | None = None
        self._running = False
        self._should_stop = False
        self._paused = False
        self._debug_packet_timing = False
        self.transmitting = False
                
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
                    ping_interval=30,
                    ping_timeout=60,
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
                self.logger.error(f"Unexpected error in WebSocket connection: {e}")
                break
        
        self._running = False
        self._websocket = None
        self.logger.info("Radio transmitter stopped")

    async def _handle_message(self, message):
        # Radio transmitter does not listen to messages
        pass

    async def _sync_radio_settings(self, frequency: float | None = None, modulation: float | None = None, intercom_ID: int | None = None, ptt: bool = False):
        """Send radio settings update to the SRS backend for this transmitter."""
        if frequency is None or modulation is None:
            # Nothing to do
            return
        
        message = {
            "type": "Settings update",
            "guid": self._guid,
            "coalition": coalition_to_enum(self.coalition),
            "settings": [
                {
                    "frequency": frequency,
                    "modulation": modulation,
                    "ptt": ptt,
                }
            ]
        }

        # TODO currently not working
        if intercom_ID is not None:
            message["unitID"] = intercom_ID

        if self._websocket:
            message_bytes = json.dumps(message).encode('utf-8')
            data = bytes([MessageType.AUDIO.SETTINGS.value]) + message_bytes
            await self._websocket.send(data)
    
    async def _send_message(self, file_name: str, frequency: float | None, modulation: int | None, encryption: int | None, intercom_ID: int | None, unit_ID: int | None, keep_file: bool = False) -> bool:
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
        self.transmitting = True
        sleep_amount = 40 #ms
        
        try:
            # Force some values in case we are transmitting on intercom. These are set in the SRS Client which I copied over
            if intercom_ID is not None:
                frequency = 100
                modulation = 2
                encryption = 0
                
            if frequency is None or modulation is None or encryption is None:
                self.logger.error("Frequency, modulation, and encryption must be specified for transmission")
                return False
            
            try:
                # If the websocket is not connected, loop and wait for it to connect before trying to send with a timeout
                websocket_connection_timeout = 30.0
                start_time = time.perf_counter()
                while self._websocket is None:
                    if time.perf_counter() - start_time > websocket_connection_timeout:
                        self.logger.error("WebSocket connection timeout while waiting to send message")
                        return False
                    await asyncio.sleep(0.5)          
                    
                await self._sync_radio_settings(frequency, modulation, intercom_ID, ptt=True)      
                
                # Open WAV file
                with wave.open(file_name, 'rb') as wf:
                    if wf.getnchannels() != 1 or wf.getframerate() != 16000 or wf.getsampwidth() != 2:
                        self.logger.error("Input WAV must be mono, 16kHz, 16-bit (linear16)")
                        return False
                    
                    frame_size = int(16000 * 0.04)  # 40ms frames = 640 samples
                    encoder = opuslib.Encoder(16000, 1, opuslib.APPLICATION_AUDIO)
                    packet_id = 0
                    last_packet_sent_at = None
                    
                    while True:
                        if self._should_stop:
                            self.logger.info("Transmission interrupted by stop request")
                            return False

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
                        if self._websocket:
                            data = packet.to_byte_array()
                            try:
                                await self._websocket.send(data)
                                now = time.perf_counter()
                                if last_packet_sent_at is not None:
                                    delta_ms = (now - last_packet_sent_at) * 1000.0
                                    sleep_amount += 0.05 * (40 - delta_ms)
                                    if self._debug_packet_timing:
                                        self.logger.info("Packet %d interval: %.2f ms. Sleep amount: %.2f ms", packet_id, delta_ms, sleep_amount)
                                last_packet_sent_at = now                                    
                            except Exception as e:
                                self.logger.error(f"Failed to send packet over WebSocket: {e}")
                                return False
                        else:
                            self.logger.error("WebSocket not connected")
                            return False
                        
                        packet_id += 1
                        await asyncio.sleep(sleep_amount / 1000)  # Simulate real-time transmission
                
                self.logger.info(f"Transmitted {packet_id} packets from {file_name}")
                return True
                
            except Exception as e:
                self.logger.error(f"Transmit failed: {e}")
                return False
        finally:
            if not self._should_stop and frequency is not None and modulation is not None:
                try:
                    await self._sync_radio_settings(frequency, modulation, intercom_ID, ptt=False)
                except Exception as e:
                    self.logger.debug(f"Failed to sync radio settings after transmission: {e}")
                    
            # Clean up the temporary audio file
            if os.path.exists(file_name) and not keep_file:
                os.remove(file_name)
                self.logger.debug(f"Cleaned up audio file: {file_name}")
                    
            self.transmitting = False
    
    def start(self) -> None:
        """Start the radio transmitter in a separate thread."""
        if self._running:
            self.logger.warning("RadioTransmitter is already running")
            return
        
        self._should_stop = False
        self._paused = False
        
        if asyncio.get_running_loop() is None:
            self.logger.error("Could not start: no active asyncio loop. If using outside plugin manager make sure to first call api.run()")
        
        asyncio.create_task(self._connect_and_maintain())
        
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
            unit_ID (int, optional): The unit ID of the source unit to impersonate. Default is None
            keep_file (boolean, option): If true the file will not be deleted at the end of the transmission. Default is False

        Returns:
            bool: True if transmission succeeded, False otherwise
        """        
        try:
            asyncio.create_task(self._send_message(file_name, frequency, modulation, encryption, None, kwargs.get('unit_ID', None), kwargs.get('keep_file', False)))
            return True
        except Exception as e:
            self.logger.error(f"Failed to schedule transmission: {e}")
            return False
    
    def transmit_on_intercom(self, file_name: str, intercom_ID: int) -> bool:
        """
        Transmit a WAV file as OPUS frames over the websocket on a specific intercom ID.
        
        Args:
            file_name (str): Path to the input WAV file (linear16, mono, 16kHz)
            intercom_ID (int): Unit ID to transmit to
            
        Returns:
            bool: True if transmission succeeded, False otherwise
        """
        try:
            asyncio.create_task(self._send_message(file_name, None, None, None, intercom_ID, None),)
            return True
        except Exception as e:
            self.logger.error(f"Failed to schedule intercom transmission: {e}")
            return False

    def stop(self) -> None:
        """Stop the radio transmitter gracefully."""
        if not self._running:
            self.logger.info("RadioTransmitter is not running")
            return
        
        self.logger.info("Stopping RadioTransmitter...")
        self._should_stop = True
        self._paused = False
        
        # Close WebSocket connection if active
        if self._websocket:
            # Schedule the close in the event loop
            asyncio.create_task(self._websocket.close())
                
        self._running = False
        self.logger.info("RadioTransmitter stopped")

    def pause(self) -> None:
        """Pause outgoing transmissions while keeping the connection alive."""
        if not self._running and self._thread is None:
            self.logger.info("Cannot pause RadioTransmitter because it is not running")
            return

        if self._paused:
            self.logger.info("RadioTransmitter is already paused")
            return

        # TODO: Verify paused works
        self._paused = True
        self.logger.info("RadioTransmitter paused")

    def resume(self) -> None:
        """Resume outgoing transmissions after pause."""
        if not self._running and self._thread is None:
            self.logger.info("Cannot resume RadioTransmitter because it is not running")
            return

        if not self._paused:
            self.logger.info("RadioTransmitter is not paused")
            return

        self._paused = False
        self.logger.info("RadioTransmitter resumed")
    
    def is_running(self) -> bool:
        """Check if the radio transmitter is currently running."""
        return self._running
    
    def is_connected(self) -> bool:
        """Check if WebSocket is currently connected."""
        return self._websocket is not None and not self._websocket.closed
    
    def is_transmitting(self) -> bool:
        """Check if a transmission is currently in progress."""
        return self.transmitting

    def is_paused(self) -> bool:
        """Check if the radio transmitter is currently paused."""
        return self._paused

    def set_debug_packet_timing(self, enabled: bool) -> None:
        """Enable or disable packet interval timing logs."""
        self._debug_packet_timing = bool(enabled)
        self.logger.info("Packet timing debug %s", "enabled" if self._debug_packet_timing else "disabled")

    def is_debug_packet_timing_enabled(self) -> bool:
        """Check whether packet interval timing logs are enabled."""
        return self._debug_packet_timing
        
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with graceful shutdown."""
        self.stop()
