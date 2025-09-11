import json
import time
import requests
import base64
import signal
import sys
import logging
import os
import tempfile
import asyncio
from google.cloud import speech, texttospeech

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
        
        self.units_update_timestamp = 0
        
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
    
    def generate_audio_message(text: str, gender: str = "male", code: str = "en-US") -> str:
        """
        Generate a WAV file from text using Google Text-to-Speech API.
        Remember to manually delete the generated file after use!
        
        Args:
            text (str): The text to synthesize.
            gender (str): The gender of the voice (male or female).
            code (str): The language code (e.g., en-US).

        Returns:
            str: The filename of the generated WAV file.
        """
        client = texttospeech.TextToSpeechClient()
        input_text = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=code,
            ssml_gender=texttospeech.SsmlVoiceGender.MALE if gender == "male" else texttospeech.SsmlVoiceGender.FEMALE
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000
        )
        response = client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config
        )
        # Save the response audio to a WAV file
        temp_dir = tempfile.gettempdir()
        file_name = os.path.join(temp_dir, next(tempfile._get_candidate_names()) + ".wav")
        with open(file_name, "wb") as out:
            out.write(response.audio_content)
        
        return file_name       
    
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

