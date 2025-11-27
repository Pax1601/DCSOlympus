import json
import time
import requests
import base64
import signal
import logging
import os
import tempfile
import asyncio
import wave

# Audio processing imports (moved to top level for performance)
try:
    import soundfile as sf
    import numpy as np
    from scipy import signal as scipy_signal
    AUDIO_LIBS_AVAILABLE = True
except ImportError as e:
    AUDIO_LIBS_AVAILABLE = False
    print(f"Audio processing libraries not available: {e}")

# Custom imports
from data.data_extractor import DataExtractor 
from unit.unit import Unit
from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

class API:
    def __init__(self, username: str = "API", databases_location: str = "databases"):
        self.base_url = None
        self.config = None
        self.logs = {}
        self.units: dict[str, Unit] = {}
        self.username = username
        self.databases_location = databases_location
        self.interval = 1  # Default update interval in seconds
        self.on_update_callback = None
        self.on_startup_callback = None
        self.should_stop = False
        self.running = False
        self.auto_update_units = True
        
        self.units_update_timestamp = 0
        
        # Initialize Kokoro TTS and Whisper (will be set up after logger)
        self.kokoro = None
        self.whisper = None
        
        # Whisper configuration options
        self.whisper_options = {
            "fp16": False,  # Use FP32 for better compatibility on some systems
            "no_speech_threshold": 0.6,  # Skip processing if no speech detected
            "logprob_threshold": -1.0,  # Skip low confidence segments
            "compression_ratio_threshold": 2.4,  # Skip repetitive segments
        }
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API")
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

        # Read the config file olympus.json
        try:
            with open("olympus.json", "r") as file:
                # Load the JSON configuration
                self.config = json.load(file)
        except FileNotFoundError:
            self.logger.error("Configuration file olympus.json not found.")
        
        self.password = self.config.get("authentication").get("gameMasterPassword")
        address = self.config.get("backend").get("address")
        port = self.config.get("backend").get("port", None)
        
        if port:
            self.base_url = f"http://{address}:{port}/olympus"
        else:
            self.base_url = f"https://{address}/olympus"
            
        # Read the aircraft, helicopter, groundunit and navyunit databases as json files
        try:
            with open(f"{self.databases_location}/aircraftdatabase.json", "r", -1, 'utf-8') as file:
                self.aircraft_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Aircraft database file not found.")
        
        try:
            with open(f"{self.databases_location}/helicopterdatabase.json", "r", -1, 'utf-8')  as file:
                self.helicopter_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Helicopter database file not found.")
        
        try:
            with open(f"{self.databases_location}/groundunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.groundunit_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Ground unit database file not found.")
        
        try:
            with open(f"{self.databases_location}/navyunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.navyunit_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Navy unit database file not found.")     
        
        # Initialize Kokoro TTS and Whisper after logger and databases are set up
        self._initialize_kokoro()
        self._initialize_whisper()
        
    def _initialize_kokoro(self, model_path: str = "kokoro-v1.0.int8.onnx", voices_path: str = "voices-v1.0.bin"):
        """
        Initialize Kokoro TTS if models are available.
        
        Args:
            model_path (str): Path to the Kokoro ONNX model file.
            voices_path (str): Path to the Kokoro voices file.
        """
        try:
            if os.path.exists(model_path) and os.path.exists(voices_path):
                from kokoro_onnx import Kokoro
                self.kokoro = Kokoro(model_path, voices_path)
                available_voices = self.kokoro.get_voices()
                self.logger.info(f"Kokoro TTS initialized with {len(available_voices)} voices")
                self.logger.info(f"Available voices: {available_voices}...")
            else:
                self.logger.warning(f"Kokoro models not found ({model_path}, {voices_path}). TTS unavailable.")
                self.kokoro = None
        except ImportError:
            self.logger.warning("kokoro-onnx not installed. TTS unavailable.")
            self.kokoro = None
        except Exception as e:
            self.logger.error(f"Failed to initialize Kokoro TTS: {e}")
            self.kokoro = None
            
    def _initialize_whisper(self, model_size: str = "base"):
        """
        Initialize Whisper speech recognition if available.
        
        Args:
            model_size (str): Size of the Whisper model to use (tiny, base, small, medium, large).
        """
        try:
            import whisper
            self.whisper = whisper.load_model(model_size)
            self.logger.info(f"Whisper speech recognition initialized with '{model_size}' model")
            self.logger.debug(f"Whisper model device: {self.whisper.device}")
        except ImportError:
            self.logger.warning("OpenAI whisper not installed. Speech recognition unavailable.")
            self.whisper = None
        except Exception as e:
            self.logger.error(f"Failed to initialize Whisper: {e}")
            self.whisper = None
        
    def _get(self, endpoint):
        credentials = f"{self.username}:{self.password}"
        base64_encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {base64_encoded_credentials}"
        }
        response = requests.get(f"{self.base_url}/{endpoint}", headers=headers)
        if response.status_code == 200:
            return response
        else:
            response.raise_for_status()
            
    def _put(self, data):
        credentials = f"{self.username}:{self.password}"
        base64_encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {base64_encoded_credentials}",
            "Content-Type": "application/json"
        }
        response = requests.put(f"{self.base_url}", headers=headers, json=data)
        if response.status_code == 200:
            return response
        else:
            response.raise_for_status()
            
    def _setup_signal_handlers(self):
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            self.stop()
        
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, signal_handler)  # Termination signal
 
    async def _check_command_executed(self, command_hash: str, execution_callback, wait_for_result: bool, max_wait_time: int = 60):
        """
        Check if a command has been executed by polling the API.
        """
        start_time = time.time()
        while True:
            response = self._get(f"commands?commandHash={command_hash}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("commandExecuted") == True and (data.get("commandResult") is not None or (not wait_for_result)):
                        self.logger.info(f"Command {command_hash} executed successfully, command result: {data.get('commandResult')}")
                        if execution_callback:
                            await execution_callback(data.get("commandResult"))
                        break
                    elif data.get("status") == "failed":
                        self.logger.error(f"Command {command_hash} failed to execute.")
                        break
                except ValueError:
                    self.logger.error("Failed to parse JSON response")
            if time.time() - start_time > max_wait_time:
                self.logger.warning(f"Timeout: Command {command_hash} did not complete within {max_wait_time} seconds.")
                break
            await asyncio.sleep(1) 
            
    async def _run_callback_async(self, callback, *args):
        """
        Run a callback asynchronously, handling both sync and async callbacks.
        """
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback(*args)
            else:
                callback(*args)
        except Exception as e:
            # Log the error but don't crash the update process
            self.logger.error(f"Error in callback: {e}")
       
    async def _run_async(self):
        """
        Async implementation of the API service loop.
        """
        # Setup signal handlers for graceful shutdown
        self._setup_signal_handlers()
        
        # Here you can add any initialization logic if needed
        self.logger.info("API started")
        self.logger.info("Press Ctrl+C to stop gracefully")

        self.running = True
        self.should_stop = False
        
        # Call the startup callback if registered
        if self.on_startup_callback:
            try:
                await self._run_callback_async(self.on_startup_callback, self)
            except Exception as e:
                self.logger.error(f"Error in startup callback: {e}")
    
        try:
            while not self.should_stop:
                # Update units from the last update timestamp
                if self.auto_update_units:
                    self.update_units(self.units_update_timestamp)
                
                if self.on_update_callback:
                    await self._run_callback_async(self.on_update_callback, self)
                await asyncio.sleep(self.interval)
        except KeyboardInterrupt:
            self.logger.info("Keyboard interrupt received")
            self.stop()
        finally:
            self.logger.info("API stopped")
            self.running = False
     
    def register_on_update_callback(self, callback):
        """
        Register a callback function to be called on each update.
        
        Args:
            callback (function): The function to call on update. Can be sync or async. 
                                The function should accept a single argument, which is the API instance.
        """
        self.on_update_callback = callback

    def unregister_on_update_callback(self):
        """
        Unregister the callback function that is called on each update.
        """
        self.on_update_callback = None

    def register_on_startup_callback(self, callback):
        """
        Register a callback function to be called on startup.
        Args:
            callback (function): The function to call on startup. Can be sync or async.
                                The function should accept a single argument, which is the API instance.
        """
        self.on_startup_callback = callback

    def unregister_on_startup_callback(self):
        """
        Unregister the callback function that is called on startup.
        """
        self.on_startup_callback = None

    def set_log_level(self, level):
        """
        Set the logging level for the API.
        
        Args:
            level: Logging level (e.g., logging.DEBUG, logging.INFO, logging.WARNING, self.logger.error)
        """
        self.logger.setLevel(level)
        self.logger.info(f"Log level set to {logging.getLevelName(level)}")
               
    def get_units(self):
        """
        Get all units from the API. Notice that if the API is not running, update_units() must be manually called first.
        Returns:
            dict: A dictionary of Unit objects indexed by their unit ID.
        """
        return self.units
    
    def get_logs(self):
        """
        Get the logs from the API. Notice that if the API is not running, update_logs() must be manually called first.
        Returns:
            dict: A dictionary of log entries indexed by their log ID.
        """
        return self.logs

    def update_units(self, time=0):
        """
        Fetch the list of units from the API.
        Args:
            time (int): The time in milliseconds from Unix epoch to fetch units from. Default is 0, which fetches all units.
        If time is greater than 0, it fetches units updated after that time.
        Returns:
            dict: A dictionary of Unit objects indexed by their unit ID.
        """
        response = self._get("units")
        if response.status_code == 200 and len(response.content) > 0:
            try:
                data_extractor = DataExtractor(response.content)
                
                # Extract the update timestamp
                self.units_update_timestamp  = data_extractor.extract_uint64()
                self.logger.debug(f"Update Timestamp: {self.units_update_timestamp}")

                while data_extractor.get_seek_position() < len(response.content):
                    # Extract the unit ID
                    unit_id = data_extractor.extract_uint32()
                    
                    if unit_id not in self.units:
                        # Create a new Unit instance if it doesn't exist
                        self.units[unit_id] = Unit(unit_id, self)
                    
                    self.units[unit_id].update_from_data_extractor(data_extractor)
                    
                return self.units
                    
            except ValueError:
                self.logger.error("Failed to parse JSON response")
        else:
            self.logger.error(f"Failed to fetch units: {response.status_code} - {response.text}")
             
    def update_logs(self, time = 0):
        """
        Fetch the logs from the API.
        Args:
            time (int): The time in milliseconds from Unix epoch to fetch logs from. Default is 0, which fetches all logs.
        Returns:
            list: A list of log entries.
        """
        endpoint = "/logs"
        endpoint += f"?time={time}"
        response = self._get(endpoint)
        if response.status_code == 200:
            try:
                self.logs = json.loads(response.content.decode('utf-8'))
                return self.logs
            except ValueError:
                self.logger.error("Failed to parse JSON response")
        else:
            self.logger.error(f"Failed to fetch logs: {response.status_code} - {response.text}")

    def spawn_aircrafts(self, units: list[UnitSpawnTable], coalition: str, airbaseName: str, country: str, immediate: bool, spawnPoints: int = 0, execution_callback=None):
        """
        Spawn aircraft units at the specified location or airbase.
        Args:
            units (list[UnitSpawnTable]): List of UnitSpawnTable objects representing the aircraft to spawn.
            coalition (str): The coalition to which the units belong. ("blue", "red", "neutral")
            airbaseName (str): The name of the airbase where the units will be spawned. Leave "" for air spawn.
            country (str): The country of the units.
            immediate (bool): Whether to spawn the units immediately or not, overriding the scheduler.
            spawnPoints (int): Amount of spawn points to use, default is 0.
            execution_callback (function): An optional async callback function to execute after the command is processed.
        """
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "airbaseName": airbaseName,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnAircrafts": command }
        response = self._put(data)
        
        # Parse the response as JSON if callback is provided
        if execution_callback:
            try:
                response_data = response.json()
                command_hash = response_data.get("commandHash", None)
                if command_hash:
                    self.logger.info(f"Aircraft spawned successfully. Command Hash: {command_hash}")
                    # Start a background task to check if the command was executed
                    asyncio.create_task(self._check_command_executed(command_hash, execution_callback, wait_for_result=True))
                else:
                    self.logger.error("Command hash not found in response")
            except ValueError:
                self.logger.error("Failed to parse JSON response")
        
    def spawn_helicopters(self, units: list[UnitSpawnTable], coalition: str, airbaseName: str, country: str, immediate: bool, spawnPoints: int = 0, execution_callback=None):
        """
        Spawn helicopter units at the specified location or airbase.
        Args:
            units (list[UnitSpawnTable]): List of UnitSpawnTable objects representing the helicopters to spawn.
            coalition (str): The coalition to which the units belong. ("blue", "red", "neutral")
            airbaseName (str): The name of the airbase where the units will be spawned. Leave "" for air spawn.
            country (str): The country of the units.
            immediate (bool): Whether to spawn the units immediately or not, overriding the scheduler.
            spawnPoints (int): Amount of spawn points to use, default is 0.
            execution_callback (function): An optional async callback function to execute after the command is processed.
        """
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "airbaseName": airbaseName,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnHelicopters": command }
        response = self._put(data)
        
        # Parse the response as JSON if callback is provided
        if execution_callback:
            try:
                response_data = response.json()
                command_hash = response_data.get("commandHash", None)
                if command_hash:
                    self.logger.info(f"Helicopters spawned successfully. Command Hash: {command_hash}")
                    # Start a background task to check if the command was executed
                    asyncio.create_task(self._check_command_executed(command_hash, execution_callback, wait_for_result=True))
                else:
                    self.logger.error("Command hash not found in response")
            except ValueError:
                self.logger.error("Failed to parse JSON response")
        
    def spawn_ground_units(self, units: list[UnitSpawnTable], coalition: str, country: str, immediate: bool, spawnPoints: int, execution_callback):
        """
        Spawn ground units at the specified location.
        Args:
            units (list[UnitSpawnTable]): List of UnitSpawnTable objects representing the ground units to spawn.
            coalition (str): The coalition to which the units belong. ("blue", "red", "neutral")
            country (str): The country of the units.
            immediate (bool): Whether to spawn the units immediately or not, overriding the scheduler.
            spawnPoints (int): Amount of spawn points to use.
            execution_callback (function): An async callback function to execute after the command is processed.
        """
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnGroundUnits": command }
        response = self._put(data)
        
        # Parse the response as JSON
        try:
            response_data = response.json()
            command_hash = response_data.get("commandHash", None)
            if command_hash:
                self.logger.info(f"Ground units spawned successfully. Command Hash: {command_hash}")
                # Start a background task to check if the command was executed
                asyncio.create_task(self._check_command_executed(command_hash, execution_callback, wait_for_result=True,))
            else:
                self.logger.error("Command hash not found in response")
            
                
        except ValueError:
            self.logger.error("Failed to parse JSON response")
            
    def spawn_navy_units(self, units: list[UnitSpawnTable], coalition: str, country: str, immediate: bool, spawnPoints: int = 0, execution_callback=None):
        """
        Spawn navy units at the specified location.
        Args:
            units (list[UnitSpawnTable]): List of UnitSpawnTable objects representing the navy units to spawn.
            coalition (str): The coalition to which the units belong. ("blue", "red", "neutral")
            country (str): The country of the units.
            immediate (bool): Whether to spawn the units immediately or not, overriding the scheduler.
            spawnPoints (int): Amount of spawn points to use, default is 0.
            execution_callback (function): An optional async callback function to execute after the command is processed.
        """
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnNavyUnits": command }
        response = self._put(data)
        
        # Parse the response as JSON if callback is provided
        if execution_callback:
            try:
                response_data = response.json()
                command_hash = response_data.get("commandHash", None)
                if command_hash:
                    self.logger.info(f"Navy units spawned successfully. Command Hash: {command_hash}")
                    # Start a background task to check if the command was executed
                    asyncio.create_task(self._check_command_executed(command_hash, execution_callback, wait_for_result=True))
                else:
                    self.logger.error("Command hash not found in response")
            except ValueError:
                self.logger.error("Failed to parse JSON response")

    def create_radio_listener(self):
        """
        Create an audio listener instance.
        
        Returns:
            AudioListener: An instance of the AudioListener class.
        """
        from radio.radio_listener import RadioListener
        return RadioListener(self, "localhost", self.config.get("audio").get("WSPort"))
    
    def generate_audio_message(self, text: str, voice: str = "af_bella") -> str:
        """
        Generate a WAV file from text using Kokoro TTS.
        Remember to manually delete the generated file after use!
        
        Args:
            text (str): The text to synthesize.
            voice (str): The voice name to use (e.g., af_bella, af_alloy, etc.).

        Returns:
            str: The filename of the generated WAV file.
            
        Raises:
            Exception: If Kokoro TTS fails or is not available.
        """
        try:
            # Check if Kokoro is available
            if self.kokoro is None:
                raise RuntimeError("Kokoro TTS not available. Check model files and installation.")
            
            # Preprocess text for better TTS results
            text = text.strip()
            if not text:
                raise ValueError("Empty text provided for TTS")
            
            # Ensure text ends with punctuation for better prosody
            if not text[-1] in '.!?':
                text += '.'
                
            logging.debug(f"Preprocessed text for TTS: '{text}'")
            
            # Check if audio libraries are available
            if not AUDIO_LIBS_AVAILABLE:
                raise RuntimeError("Audio processing libraries (soundfile, numpy, scipy) not available")
            
            # Get available voices and validate the requested voice
            available_voices = self.kokoro.get_voices()
            logging.debug(f"Available voices: {available_voices[:5]}...")  # Log first 5 voices
            
            if voice not in available_voices:
                logging.warning(f"Voice {voice} not found, using {available_voices[0]}")
                voice = available_voices[0]
            
            logging.debug(f"Using voice: {voice}")
            
            # Generate audio
            audio_result = self.kokoro.create(text, voice=voice)
            logging.debug(f"Kokoro returned: {type(audio_result)}")
            
            # Handle tuple return format (audio_array, sample_rate)
            if isinstance(audio_result, tuple) and len(audio_result) == 2:
                audio, sample_rate = audio_result
                logging.debug(f"Extracted audio: {len(audio)} samples at {sample_rate}Hz")
            else:
                audio = audio_result
                sample_rate = 24000  # Default Kokoro sample rate
                logging.debug(f"Direct audio: {len(audio) if audio else 0} samples")
            
            # Check if audio was generated successfully
            if audio is None or len(audio) < 100:  # Less than 100 samples is likely an error
                # Try with longer text if original was very short
                if len(text.strip()) < 10:
                    extended_text = f"Message received: {text}. End of message."
                    logging.warning(f"Text too short, extending: '{text}' -> '{extended_text}'")
                    audio_result = self.kokoro.create(extended_text, voice=voice)
                    
                    # Handle tuple return format again
                    if isinstance(audio_result, tuple) and len(audio_result) == 2:
                        audio, sample_rate = audio_result
                    else:
                        audio = audio_result
                        sample_rate = 24000
                    
                    logging.debug(f"Extended audio length: {len(audio) if audio is not None else 0}")
                
                # If still too short, raise an error
                if audio is None or len(audio) < 100:
                    raise ValueError(f"Kokoro generated very short audio ({len(audio) if audio is not None else 0} samples). Original text: '{text}'")
            
            logging.debug(f"Generated {len(audio)} audio samples for text: '{text}'")
            
            # Convert to numpy array if needed
            if isinstance(audio, list):
                audio = np.array(audio, dtype=np.float32)
            elif not isinstance(audio, np.ndarray):
                raise TypeError(f"Unexpected audio format from Kokoro: {type(audio)}")
            
            # Resample from Kokoro's 24kHz to 16kHz for radio compatibility using scipy
            # Calculate the resampling ratio
            resample_ratio = 16000 / 24000  # target_sr / orig_sr
            num_samples = int(len(audio) * resample_ratio)
            audio_16k = scipy_signal.resample(audio, num_samples)
            
            # Save to temporary file
            temp_dir = tempfile.gettempdir()
            file_name = os.path.join(temp_dir, next(tempfile._get_candidate_names()) + ".wav")
            
            # Save as 16-bit PCM WAV
            sf.write(file_name, audio_16k, 16000, subtype='PCM_16')
            
            logging.debug(f"Generated audio with Kokoro: {file_name} ({len(audio_16k)} samples)")
            return file_name
            
        except Exception as e:
            logging.error(f"Kokoro TTS failed: {e}")
            raise
    
    def transcribe_audio(self, wav_filename: str) -> str:
        """
        Transcribe audio from a WAV file using the pre-initialized Whisper model.
        
        Args:
            wav_filename (str): Path to the WAV file to transcribe.
            
        Returns:
            str: The transcribed text, or empty string if transcription fails or no speech detected.
            
        Raises:
            RuntimeError: If Whisper model is not available.
            FileNotFoundError: If the audio file doesn't exist.
        """
        if self.whisper is None:
            raise RuntimeError("Whisper model not available")
            
        # Check if audio libraries are available
        if not AUDIO_LIBS_AVAILABLE:
            raise RuntimeError("Audio processing libraries (numpy) not available")
            
        try:
            
            # Check if file exists
            if not os.path.exists(wav_filename):
                raise FileNotFoundError(f"Audio file not found: {wav_filename}")
            
            # Get absolute path
            abs_wav_filename = os.path.abspath(wav_filename)
            
            # Verify file can be opened and get properties
            with wave.open(abs_wav_filename, 'rb') as test_wav:
                channels = test_wav.getnchannels()
                sample_rate = test_wav.getframerate()
                sample_width = test_wav.getsampwidth()
                frames = test_wav.getnframes()
                duration = frames / sample_rate
                
            self.logger.debug(f"WAV file properties - Channels: {channels}, Sample Rate: {sample_rate}, "
                            f"Sample Width: {sample_width}, Duration: {duration:.2f}s")
            
            # Load audio data directly from WAV file
            with wave.open(abs_wav_filename, 'rb') as wav_file:
                # Read all frames
                frames = wav_file.readframes(wav_file.getnframes())
                # Convert bytes to numpy array
                if wav_file.getsampwidth() == 2:  # 16-bit
                    audio = np.frombuffer(frames, dtype=np.int16)
                else:
                    audio = np.frombuffer(frames, dtype=np.int32)
                
                # Convert to float32 and normalize to [-1, 1] range
                audio = audio.astype(np.float32) / (2**(wav_file.getsampwidth() * 8 - 1))
            
            self.logger.debug(f"Loaded audio: {len(audio)} samples")
            
            # Use Whisper with the audio array
            result = self.whisper.transcribe(
                audio, 
                language="en", 
                verbose=False,
                **self.whisper_options
            )
            
            recognized_text = result["text"].strip()
            self.logger.debug(f"Transcribed text: '{recognized_text}'")
            
            return recognized_text
            
        except Exception as e:
            self.logger.error(f"Audio transcription failed: {e}")
            import traceback
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            return ""
    
    def configure_whisper_options(self, fp16: bool = None, no_speech_threshold: float = None, 
                                 logprob_threshold: float = None, compression_ratio_threshold: float = None):
        """
        Configure Whisper transcription options.
        
        Args:
            fp16 (bool, optional): Use FP16 precision. If None, keeps current setting.
            no_speech_threshold (float, optional): Threshold for skipping segments with no speech. 
                                                 Higher values make it more likely to skip segments. If None, keeps current setting.
            logprob_threshold (float, optional): Threshold for skipping segments with low confidence.
                                               Lower values make it more likely to skip segments. If None, keeps current setting.
            compression_ratio_threshold (float, optional): Threshold for skipping repetitive segments.
                                                         Higher values make it more likely to skip segments. If None, keeps current setting.
        
        Returns:
            dict: The updated Whisper options configuration.
        """
        if fp16 is not None:
            self.whisper_options["fp16"] = fp16
            
        if no_speech_threshold is not None:
            self.whisper_options["no_speech_threshold"] = no_speech_threshold
            
        if logprob_threshold is not None:
            self.whisper_options["logprob_threshold"] = logprob_threshold
            
        if compression_ratio_threshold is not None:
            self.whisper_options["compression_ratio_threshold"] = compression_ratio_threshold
        
        self.logger.info(f"Whisper options updated: {self.whisper_options}")
        return self.whisper_options.copy()
    
    def get_whisper_options(self):
        """
        Get the current Whisper transcription options.
        
        Returns:
            dict: A copy of the current Whisper options configuration.
        """
        return self.whisper_options.copy()
    
    def set_whisper_model(self, model_size: str = "base"):
        """
        Change the Whisper model to a different size.
        
        Args:
            model_size (str): Size of the Whisper model to use (tiny, base, small, medium, large, large-v2, large-v3).
                            - tiny: Fastest, least accurate (~39 MB)
                            - base: Good balance (~74 MB) 
                            - small: Better accuracy (~244 MB)
                            - medium: Higher accuracy (~769 MB)
                            - large: Best accuracy (~1550 MB)
                            - large-v2: Improved large model
                            - large-v3: Latest large model
        
        Returns:
            bool: True if model was successfully loaded, False otherwise.
        """
        try:
            import whisper
            
            # Store old model reference for cleanup
            old_model = self.whisper
            
            self.logger.info(f"Loading Whisper model: {model_size}")
            new_model = whisper.load_model(model_size)
            
            # Only update if loading was successful
            self.whisper = new_model
            self.logger.info(f"Whisper model changed to '{model_size}' successfully")
            self.logger.debug(f"New Whisper model device: {self.whisper.device}")
            
            # Clean up old model if it exists
            if old_model is not None:
                del old_model
                self.logger.debug("Old Whisper model cleaned up")
            
            return True
            
        except ImportError:
            self.logger.error("OpenAI whisper not installed. Cannot change model.")
            return False
        except Exception as e:
            self.logger.error(f"Failed to load Whisper model '{model_size}': {e}")
            return False
    
    def get_whisper_model_info(self):
        """
        Get information about the current Whisper model.
        
        Returns:
            dict: Information about the current model including device and available models.
        """
        if self.whisper is None:
            return {"status": "not_available", "current_model": None, "device": None}
        
        # Try to determine model size from the model's name or dims
        model_size = "unknown"
        if hasattr(self.whisper, 'dims'):
            dims = self.whisper.dims
            # Map common dimensions to model sizes (approximate)
            if dims.n_text_layer == 4:
                model_size = "tiny"
            elif dims.n_text_layer == 6:
                model_size = "base"
            elif dims.n_text_layer == 12:
                model_size = "small"
            elif dims.n_text_layer == 24:
                model_size = "medium"
            elif dims.n_text_layer == 32:
                model_size = "large"
        
        return {
            "status": "available",
            "current_model": model_size,
            "device": str(self.whisper.device),
            "available_models": ["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"],
            "model_dims": {
                "n_mels": self.whisper.dims.n_mels if hasattr(self.whisper, 'dims') else None,
                "n_text_layer": self.whisper.dims.n_text_layer if hasattr(self.whisper, 'dims') else None,
                "n_vocab": self.whisper.dims.n_vocab if hasattr(self.whisper, 'dims') else None
            }
        }
       
    def get_closest_units(self, coalitions: list[str], categories: list[str], position: LatLng, operate_as: str | None = None, max_number: int = 1, max_distance: float = 10000) -> list[Unit]:
        """
        Get the closest units of a specific coalition and category to a given position. 
        Units are filtered by coalition, category, and optionally by operating role.
        
        
        Args:
            coalitions (list[str]): List of coalitions to filter by (e.g., ["blue", "red"]).
            categories (list[str]): List of categories to filter by (e.g., ["aircraft", "groundunit"]).
            position (LatLng): The position to measure distance from.
            operate_as (str | None): Optional list of operating roles to filter by (either "red" or "blue"). Default is None.
            max_number (int): Maximum number of closest units to return. Default is 1.
            max_distance (float): Maximum distance to consider for the closest unit. Default is 10000 meters.
        """
        closest_units = []
        closest_distance = max_distance
        
        # Iterate through all units and find the closest ones that match the criteria
        for unit in self.units.values():
            if unit.alive and unit.coalition in coalitions and unit.category.lower() in categories and (operate_as is None or unit.operate_as == operate_as or unit.coalition != "neutral"):
                distance = position.distance_to(unit.position)
                if distance < closest_distance:
                    closest_distance = distance
                    closest_units = [unit]
                elif distance == closest_distance:
                    closest_units.append(unit)
                
        # Sort the closest units by distance
        closest_units.sort(key=lambda u: position.distance_to(u.position))
        
        # Limit the number of closest units returned
        closest_units = closest_units[:max_number]

        return closest_units
    
    def send_command(self, command: str):
        """
        Send a command to the API.
        
        Args:
            command (str): The command to send.
        """
        response = self._put(command)
        if response.status_code == 200:
            self.logger.info(f"Command sent successfully: {command}")
        else:
            self.logger.error(f"Failed to send command: {response.status_code} - {response.text}")
    
    def stop(self):
        """
        Stop the API service gracefully.
        """
        self.logger.info("Stopping API service...")
        self.should_stop = True
        
    def run(self):
        """
        Start the API service.
        
        This method initializes the API and starts the necessary components.
        Sets up signal handlers for graceful shutdown.
        """
        asyncio.run(self._run_async())

