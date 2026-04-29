import json
import time
import requests
import base64
import signal
import logging
import os
import tempfile
import asyncio
import re

from weapon.weapon import Weapon
from data.data_types import LatLng

# Audio processing imports (moved to top level for performance)
try:
    import soundfile as sf
    import numpy as np
    from scipy import signal as scipy_signal
    AUDIO_LIBS_AVAILABLE = True
except ImportError as e:
    AUDIO_LIBS_AVAILABLE = False
    import logging
    logging.warning(f"Audio processing libraries not available: {e}")

# Custom imports
from data.data_extractor import DataExtractor 
from unit.unit import Unit
from data.unit_spawn_table import UnitSpawnTable
from data.data_types import LatLng

class API:
    # Kokore and whisper instances are handled as static variables to share them across all API instances and avoid reloading models multiple times
    kokoro = None
    whisper = None
    whisper_model = None
    audio_cache = {}

    def __init__(self, username: str = "API", saved_games_folder: str = ".", load_whisper: bool = True, load_kokoro: bool = True, SRS_folder: str = ""):
        self.base_url = None
        self.config = None
        self.logs = {}
        self.units: dict[str, Unit] = {}
        self.weapons: dict[str, Weapon] = {}
        self.mission = {}
        self.markers = {}
        self.spots = {}
        self.bullseyes = {}
        self.username = username
        self.databases_location = os.path.join(saved_games_folder, "Mods", "Services", "Olympus", "databases")
        self.interval = 1  # Default update interval in seconds
        self.on_update_callback = None
        self.on_startup_callback = None
        self.should_stop = False
        self.running = False
        self.auto_update_units = True
        self.auto_update_weapons = True
        self.SRS_folder = SRS_folder

        # These are test units that are not really in game, but are useful for testing purposes
        self.test_units: dict[int, Unit] = {}
        
        self.units_update_timestamp = 0
        self.weapons_update_timestamp = 0
        
        # Setup logging
        self.logger = logging.getLogger(f"DCSOlympus.API")

        # Read the config file olympus.json
        try:
            with open(os.path.join(saved_games_folder, "Config", "olympus.json"), "r") as file:
                # Load the JSON configuration
                self.config = json.load(file)
        except FileNotFoundError:
            self.logger.error(f"Configuration file {os.path.join(saved_games_folder, 'Config', 'olympus.json')} not found.")
            return
        
        self.password = self.config.get("authentication").get("gameMasterPassword")
        address = self.config.get("backend").get("address")
        port = self.config.get("backend").get("port", None)
        
        if port:
            self.base_url = f"http://{address}:{port}/olympus"
        else:
            self.base_url = f"https://{address}/olympus"
            
        # Read the aircraft, helicopter, groundunit and navyunit databases as json files
        try:
            with open(f"{self.databases_location}/units/aircraftdatabase.json", "r", -1, 'utf-8') as file:
                self.aircraft_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Aircraft database file not found.")
        
        try:
            with open(f"{self.databases_location}/units/helicopterdatabase.json", "r", -1, 'utf-8')  as file:
                self.helicopter_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Helicopter database file not found.")
        
        try:
            with open(f"{self.databases_location}/units/groundunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.groundunit_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Ground unit database file not found.")
        
        try:
            with open(f"{self.databases_location}/units/navyunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.navyunit_database = json.load(file)
        except FileNotFoundError:
            self.logger.error("Navy unit database file not found.")     
        
        # Initialize Kokoro TTS and Whisper after logger and databases are set up
        if load_kokoro:
            if API.kokoro is None:
                self._initialize_kokoro()
            else:
                self.logger.info("Kokoro TTS already initialized, skipping re-initialization")

        if load_whisper:
            if API.whisper_model is None:
                self._initialize_whisper()
            else:
                self.logger.info("Whisper speech recognition already initialized, skipping re-initialization")
        
    def _initialize_kokoro(self, repo_id: str = 'hexgrad/Kokoro-82M', lang_code: str = 'a'):
        """
        Initialize Kokoro TTS using KPipeline.
        
        Args:
            repo_id (str): HuggingFace repo ID for the Kokoro model.
            lang_code (str): Language code (e.g., 'a' for American English, 'b' for British English).
        """
        try:
            from kokoro import KPipeline
            import warnings
            
            # Suppress kokoro warnings
            warnings.filterwarnings("ignore", message='dropout option adds dropout after all but last recurrent layer.*')
            warnings.filterwarnings("ignore", message='.*torch.nn.utils.weight_norm.*is deprecated.*')
            
            API.kokoro = KPipeline(lang_code=lang_code, repo_id=repo_id)
            self.kokoro_lang_code = lang_code
            
            # Available voices for reference
            # https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
            self.logger.info(f"Kokoro TTS initialized with KPipeline from {repo_id}")
            self.logger.info("Available voices: af_* (American Female), am_* (American Male), bf_* (British Female), bm_* (British Male), etc.")
        except ImportError:
            self.logger.warning("kokoro not installed. TTS unavailable.")
            API.kokoro = None
        except Exception as e:
            self.logger.error(f"Failed to initialize Kokoro TTS: {e}")
            API.kokoro = None
            
    def _initialize_whisper(self, model_size: str = "base.en"):
        """
        Initialize Whisper speech recognition if available.
        
        Args:
            model_size (str): Size of the Whisper model to use (tiny, base, small, medium, large).
        """    
        
        try:
            import whisper
            from faster_whisper import WhisperModel

            API.whisper = whisper
            API.whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            self.logger.info(f"Whisper speech recognition initialized with '{model_size}' model")
        except ImportError:
            self.logger.warning("OpenAI whisper not installed. Speech recognition unavailable.")
            API.whisper_model = None
        except Exception as e:
            self.logger.error(f"Failed to initialize Whisper: {e}")
            API.whisper_model = None
        
    def _get(self, endpoint):
        credentials = f"{self.username}:{self.password}"
        base64_encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {base64_encoded_credentials}"
        }
        try:
            response = requests.get(f"{self.base_url}/{endpoint}", headers=headers, timeout=0.5)
        except Exception as e:
            self.logger.error(f"HTTP request failed")
            self.logger.debug(f"HTTP request failed: {e}")
            # Simulate a response object with an error status code to trigger error handling
            class ErrorResponse:
                def __init__(self, error):
                    self.status_code = 500
                    self.text = str(error)
                def raise_for_status(self):
                    raise requests.exceptions.HTTPError(self.text)
            return ErrorResponse(e)
        
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
        try:
            response = requests.put(f"{self.base_url}", headers=headers, json=data, timeout=0.5)
        except Exception as e:
            self.logger.error(f"HTTP request failed")
            self.logger.debug(f"HTTP request failed: {e}")
            # Simulate a response object with an error status code to trigger error handling
            class ErrorResponse:
                def __init__(self, error):
                    self.status_code = 500
                    self.text = str(error)
                def raise_for_status(self):
                    raise requests.exceptions.HTTPError(self.text)
            return ErrorResponse(e)

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
                except Exception as e:
                    self.logger.error(f"Failed to parse JSON response: {e}")
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

                if self.auto_update_weapons:
                    self.update_weapons(self.weapons_update_timestamp)
                
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
        # Merge the test units into the main units dictionary for retrieval
        result = self.units.copy()
        result.update(self.test_units)
        return result
    
    def get_weapons(self):
        """
        Get all weapons from the API. Notice that if the API is not running, update_weapons() must be manually called first.
        Returns:
            dict: A dictionary of Weapon objects indexed by their weapon ID.
        """
        return self.weapons
    
    def get_logs(self):
        """
        Get the logs from the API. Update_logs() must be manually called first.
        Returns:
            dict: A dictionary of log entries indexed by their log ID.
        """
        return self.logs
    
    def get_mission(self):
        """
        Get the mission data from the API. Update_mission() must be manually called first.
        Returns:
            dict: A dictionary representing the mission data.
        """
        return self.mission
    
    def get_markers(self):
        """
        Get the markers data from the API. Update_marker() must be manually called first.
        Returns:
            dict: A dictionary representing the markers data.
        """
        return self.markers
    
    def get_spots(self):
        """
        Get the spots data from the API. Update_spots() must be manually called first.
        Returns:
            dict: A dictionary representing the spots data.
        """
        return self.spots
    
    def get_bullseyes(self):
        """
        Get the bullseyes data from the API. Update_bullseyes() must be manually called first.
        Returns:
            dict: A dictionary representing the bullseyes data.
        """
        return self.bullseyes

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
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch units: {response.status_code}")

    def update_weapons(self, time=0):
        """
        Fetch the list of weapons from the API.
        Args:
            time (int): The time in milliseconds from Unix epoch to fetch weapons from. Default is 0, which fetches all weapons.
        If time is greater than 0, it fetches weapons updated after that time.
        Returns:
            dict: A dictionary of Weapon objects indexed by their weapon ID.
        """
        response = self._get("weapons")
        if response.status_code == 200 and len(response.content) > 0:
            try:
                data_extractor = DataExtractor(response.content)
                
                # Extract the update timestamp
                self.weapons_update_timestamp  = data_extractor.extract_uint64()
                self.logger.debug(f"Weapons Update Timestamp: {self.weapons_update_timestamp}")

                while data_extractor.get_seek_position() < len(response.content):
                    # Extract the weapon ID
                    weapon_id = data_extractor.extract_uint32()
                    
                    if weapon_id not in self.weapons:
                        # Create a new Weapon instance if it doesn't exist
                        self.weapons[weapon_id] = Weapon(weapon_id, self)
                    
                    self.weapons[weapon_id].update_from_data_extractor(data_extractor)
                    
                return self.weapons
                    
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch weapons: {response.status_code}")
             
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
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch logs: {response.status_code}")
            
    def update_mission(self):
        """
        Fetch the mission data from the API.
        Returns:
            dict: A dictionary representing the mission data.
        """
        response = self._get("mission")
        if response.status_code == 200:
            try:
                self.mission = json.loads(response.content.decode('utf-8'))['mission']
                return self.mission
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch mission data: {response.status_code}")
            
    def update_markers(self):
        """
        Fetch the markers from the API.
        Returns:
            dict: A dictionary representing the markers data.
        """
        response = self._get("markers")
        if response.status_code == 200:
            try:
                self.markers = json.loads(response.content.decode('utf-8'))['markers']
                return self.markers
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch markers data: {response.status_code}")
            
    def update_spots(self):
        """
        Fetch the spots from the API.
        Returns:
            dict: A dictionary representing the spots data.
        """
        response = self._get("spots")
        if response.status_code == 200:
            try:
                self.spots = json.loads(response.content.decode('utf-8'))['spots']
                return self.spots
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch spots data: {response.status_code}")
            
    def update_bullseyes(self):
        """
        Fetch the bullseyes from the API.
        Returns:
            dict: A dictionary representing the bullseyes data.
        """
        response = self._get("bullseyes")
        if response.status_code == 200:
            try:
                self.bullseyes = json.loads(response.content.decode('utf-8'))['bullseyes']
                return self.bullseyes
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch bullseyes data: {response.status_code}")

    def update_custom_mission_data(self, data_table: str):
        """
        Fetch a custom table from the mission data structure
        """
        response = self._get(f"customMissionData?tableName={data_table}")
        if response.status_code == 200:
            try:
                return json.loads(response.content.decode('utf-8'))
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        else:
            self.logger.error(f"Failed to fetch custom data: {response.status_code}")

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
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        
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
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
        
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
        except Exception as e:
            self.logger.error(f"Failed to parse JSON response: {e}")
            
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
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
                
    def create_marker(self, markerID: int, latlng: LatLng, text: str):
        """
        Create a map marker.
        
        Args:
            latlng (LatLng): The latitude and longitude of the marker.
            text (str): The text to display on the marker.
        """
        command = {
            "markerID": markerID,
            "location": {
                "lat": latlng.lat,
                "lng": latlng.lng
            },
            "text": text
        }
        data = { "createMarker": command }
        response = self._put(data)
        if response.status_code == 200:
            self.logger.info(f"Marker created at ({latlng.lat}, {latlng.lng}) with text: '{text}'")
        else:
            self.logger.error(f"Failed to create marker: {response.status_code}")
            
    def delete_marker(self, marker_id: int):
        """
        Delete a map marker by its ID.
        
        Args:
            marker_id (int): The ID of the marker to delete.
        """
        command = {
            "markerID": marker_id
        }
        data = { "deleteMarker": command }
        response = self._put(data)
        if response.status_code == 200:
            self.logger.info(f"Marker with ID {marker_id} deleted successfully")
        else:
            self.logger.error(f"Failed to delete marker: {response.status_code}")

    def execute_file(self, filePath: str):
        """Execute a Lua file on the DCS mission."""
        command = {
            "filePath": filePath
        }
        data = { "executeFile": command }
        response = self._put(data)
        if response.status_code == 200:
            self.logger.info(f"Lua file '{filePath}' executed successfully")
        else:
            self.logger.error(f"Failed to execute Lua file: {response.status_code}")

    def create_radio_listener(self):
        """
        Create an audio listener instance.
        
        Returns:
            RadioListener: An instance of the RadioListener class.
        """
        from radio.radio_listener import RadioListener

        if self.config.get("audio").get("WSAddress"):
            return RadioListener(self, self.config.get("audio").get("WSAddress"), None, self.SRS_folder)
        else:
            return RadioListener(self, self.config.get("backend").get("address"), self.config.get("audio").get("WSPort"), self.SRS_folder)
        
    def create_radio_transmitter(self):
        """
        Create an audio transmitter instance.
        
        Returns:
            RadioTransmitter: An instance of the RadioTransmitter class.
        """
        from radio.radio_transmitter import RadioTransmitter

        if self.config.get("audio").get("WSAddress"):
            return RadioTransmitter(self.config.get("audio").get("WSAddress"), None, self.SRS_folder)
        else:
            return RadioTransmitter(self.config.get("backend").get("address"), self.config.get("audio").get("WSPort"), self.SRS_folder)
        
    def _text_to_speech(self, text: str, voice: str = "bm_daniel", speed: float = 1.0):
        try:
            # Check if Kokoro is available
            if API.kokoro is None:
                raise RuntimeError("Kokoro TTS not available. Install with: pip install kokoro-onnx")
            
            # Strip the text and check if it's empty after stripping to avoid generating audio for empty text
            original_text = text
            text = text.strip()
            if not text:
                raise ValueError("Empty text provided for TTS")
                                    
            # Check if audio libraries are available
            if not AUDIO_LIBS_AVAILABLE:
                raise RuntimeError("Audio processing libraries (soundfile, numpy, scipy) not available")
            
            # Generate audio using KPipeline streaming
            self.logger.debug(f"Generating audio for: '{text}' with voice: {voice} at speed: {speed}")
            
            chunk_list = []
            try:
                # Use KPipeline to generate audio in streaming fashion
                for _, _, audio in self.kokoro(text, voice=voice, speed=speed):
                    chunk_list.append(np.array(audio.tolist(), dtype=np.float32))
            except Exception as e:
                self.logger.error(f"Message generation failed: {e}")
                raise RuntimeError(f"Failed to generate audio: {e}")
            
            if not chunk_list:
                raise ValueError(f"No audio generated for text: '{original_text}'")
            
            # Concatenate all chunks
            audio = np.concatenate(chunk_list)
            self.logger.debug(f"Generated {len(audio)} audio samples")
            
            # Resample from Kokoro's 24kHz to 16kHz for radio compatibility
            target_length = int(len(audio) * 16000 / 24000)
            audio_16k = scipy_signal.resample(audio, target_length)

            return audio_16k
        except Exception as e:
            self.logger.error(f"Message generation failed: {e}")
            raise

    def generate_audio_message(self, text: str, voice: str = "bm_daniel", speed: float = 1.0, format: str = "mp3") -> str:
        """
        Generate a MP3 or WAV file from text using Kokoro TTS with streaming for faster response.
        Remember to manually delete the generated file after use!
        
        Args:
            text (str): The text to synthesize.
            voice (str): The voice name to use (e.g., af_bella, af_nicole, am_adam, bm_daniel, etc.).
            speed (float): Speech speed multiplier (default 1.0, higher = faster).
            format (str): The audio format to save ("mp3" or "wav", default "mp3").

        Returns:
            str: The filename of the generated MP3 file.
            
        Raises:
            Exception: If Kokoro TTS fails or is not available.
        """
        try:
            # Initialize the empty audio signal to which chunks will be concatenated
            audio = np.array([], dtype=np.float32)

            # Split the text using punctuation for caching. Punctuation must be followed by a space to avoid problems with abbreviations and numbers.
            chunks = re.split(r'([.!?:](?:\s|$))', text)

            # Iterate through the chunks and generate audio for each, concatenating them together. 
            for i in range(0, len(chunks), 2):
                chunk_text = chunks[i].strip()
                if i + 1 < len(chunks):
                    chunk_text += chunks[i + 1]  # Add the punctuation back to the chunk
                
                if chunk_text:
                    self.logger.debug(f"Processing chunk for TTS: '{chunk_text}'")

                    # Check if the audio for this text and voice combination is already in the cache
                    cache_key = f"{chunk_text}_{voice}_{speed}"
                    if cache_key in API.audio_cache:
                        self.logger.info(f"Audio for text '{chunk_text}' with voice '{voice}' retrieved from cache")
                        
                        # Concatenate the cached audio to the final audio signal
                        audio = np.concatenate((audio, API.audio_cache[cache_key]))
                    else:
                        self.logger.info(f"Audio for text '{chunk_text}' with voice '{voice}' not in cache, generating with Kokoro")
                        new_audio = self._text_to_speech(chunk_text, voice, speed)
                        audio = np.concatenate((audio, new_audio))

                        # Save to the in memory cache to reuse if needed again, using the original text and voice as the key
                        API.audio_cache[cache_key] = new_audio

                # Check that the audio signal is not empty before trying to save it, to avoid creating empty files
                if len(audio) == 0:
                    raise ValueError(f"No audio generated for text: '{text}'")

                # Save to temporary file
                temp_dir = tempfile.gettempdir()
                file_name = os.path.join(temp_dir, next(tempfile._get_candidate_names()) + ".mp3")
                
                if format == "wav":
                    # Save as WAV if specified, used by internal tranmission
                    sf.write(file_name.replace(".mp3", ".wav"), audio, 16000, format='WAV')
                    file_name = file_name.replace(".mp3", ".wav")
                else:
                    # Fast MP3 writing
                    sf.write(file_name, audio, format='MP3')
            return file_name
            
        except Exception as e:
            self.logger.error(f"Message generation failed: {e}")
            raise RuntimeError(f"Failed to generate audio message: {e}")
    
    def generate_audio_message_in_executor(self, text: str, voice: str = "bm_daniel", speed: float = 1.0):
        """
        Asynchronous version of generate_audio_message.
        
        Args:
            text (str): The text to synthesize.
            voice (str): The voice name to use (e.g., af_bella, af_nicole, am_adam, bm_daniel, etc.).
            speed (float): Speech speed multiplier (default 1.0, higher = faster).

        Returns:
            str: The filename of the generated MP3 file.
            
        Raises:
            Exception: If Kokoro TTS fails or is not available.
        """
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(None, self.generate_audio_message, text, voice, speed)

    def transcribe_audio(self, wav_filename: str, prompt: str = "") -> str:
        """
        Transcribe audio from a WAV file using the pre-initialized Whisper model.
        
        Args:
            wav_filename (str): Path to the WAV file to transcribe.
            prompt (str): Optional prompt to guide transcription.
            
        Returns:
            str: The transcribed text, or empty string if transcription fails or no speech detected.
            
        Raises:
            RuntimeError: If Whisper model is not available.
            FileNotFoundError: If the audio file doesn't exist.
        """
        if API.whisper_model is None:
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
            
            audio = API.whisper.load_audio(abs_wav_filename)  # Preload the audio file to cache it in Whisper's internal storage
            audio = API.whisper.pad_or_trim(audio)  # Ensure the audio is the correct length for Whisper
            
            # Use Whisper with the audio array
            segments, info = API.whisper_model.transcribe(
                audio, 
                language="en", 
                initial_prompt=prompt
            )
            recognized_text = ""
            for segment in segments:
                recognized_text += segment.text

            self.logger.debug(f"Transcribed text: '{recognized_text}'")
            
            return recognized_text
            
        except Exception as e:
            self.logger.error(f"Audio transcription failed: {e}")
            import traceback
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            return ""
        
    def transcribe_audio_in_executor(self, wav_filename: str, prompt: str = ""):
        """
        Asynchronous version of transcribe_audio.
        
        Args:
            wav_filename (str): Path to the WAV file to transcribe.
            prompt (str): Optional prompt to guide transcription.
            
        Returns:
            str: The transcribed text, or empty string if transcription fails or no speech detected.
        """
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(None, self.transcribe_audio, wav_filename, prompt)
    
    def set_whisper_model(self, model_size: str = "base.en"):
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
            from faster_whisper import WhisperModel
            API.whisper = whisper
            
            # Store old model reference for cleanup
            old_model = API.whisper_model
            
            self.logger.info(f"Loading Whisper model: {model_size}")
             
            new_model = WhisperModel("base", device="cpu", compute_type="int8")
            
            # Only update if loading was successful
            API.whisper_model = new_model
            self.logger.info(f"Whisper model changed to '{model_size}' successfully")
            
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
    
    def add_test_unit(self, unit: Unit):
        """
        Add a test unit to the API's unit list. This is primarily for testing purposes.
        
        Args:
            unit (Unit): The Unit object to add.
        """
        self.units[unit.ID] = unit
        self.logger.info(f"Test unit added: ID {unit.ID}, Name: {unit.callsign}")
    
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
            self.logger.error(f"Failed to send command: {response.status_code}")
        return response
    
    def spawn_static_object(self, location: LatLng, type: str, shapeName: str, coalition: str, heading: float, canCargo: bool, linkOffset: bool, dead: bool, mass: float):
        """
        Spawn a static object in the mission.
        
        Args:
            location (LatLng): The latitude and longitude where the static object should be spawned.
            type (str): The type of static object to spawn (e.g., "SAM", "Vehicle", "Infantry").
            shapeName (str): The name of the shape/model to use for the static object.
            coalition (str): The coalition to which the static object belongs.
            heading (float): The heading/direction the static object should face, in degrees.
            canCargo (bool): Whether the static object can be used as cargo or not.
            linkOffset (bool): Whether to link the static object with an offset or not.
            dead (bool): Whether the static object should be spawned as destroyed/dead or not.
            mass (float): The mass of the static object in kilograms.
        """
        command = {
            "location": {
                "lat": location.lat,
                "lng": location.lng
            },
            "type": type,
            "shapeName": shapeName,
            "coalition": coalition.value,
            "heading": heading,
            "canCargo": canCargo,
            "linkOffset": linkOffset,
            "dead": dead,
            "mass": mass
        }
        data = { "spawnStaticObject": command }
        response = self._put(data)
        if response.status_code == 200:
            self.logger.info(f"Static object of type '{type}' spawned successfully with shape '{shapeName}'")
        else:
            self.logger.error(f"Failed to spawn static object: {response.status_code}")

    def clone_units(self, to_clone: list[dict], delete_original=False, coalition="all", spawn_points: int = 0, execution_callback=None):
        """
        Clone existing units based on specified options.
        
        Args:
            to_clone (list[dict]): A list of dictionaries specifying the units to clone. Each dictionary should contain:
                - "ID": The ID of the unit to clone.
                - "location": A LatLng object specifying the new position for the cloned unit.
            delete_original (bool): Whether to delete the original units after cloning. Default is False.
            coalition (str): The coalition for the cloned units ("blue", "red", "neutral", or "all"). Default is "all".
            spawn_points (int): Amount of spawn points to use for the cloned units. Default is 0.
            execution_callback (function): An optional async callback function to execute after the command is processed.
        """
        data = { "cloneUnits": 
                {
                "units": to_clone,
                "deleteOriginal": delete_original,
                "coalition": coalition,
                "spawnPoints": spawn_points
            } 
        }
        response = self._put(data)
        
        # Parse the response as JSON if callback is provided
        if execution_callback:
            try:
                response_data = response.json()
                command_hash = response_data.get("commandHash", None)
                if command_hash:
                    self.logger.info(f"Unit cloning command sent successfully. Command Hash: {command_hash}")
                    # Start a background task to check if the command was executed
                    asyncio.create_task(self._check_command_executed(command_hash, execution_callback, wait_for_result=True))
                else:
                    self.logger.error("Command hash not found in response")
            except Exception as e:
                self.logger.error(f"Failed to parse JSON response: {e}")
    
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
        try:
            asyncio.create_task(self._run_async())
        except Exception as e:
            self.logger.info(f"Failed to register async task: {e}. Creating own event loop.")
            asyncio.run(self._run_async())