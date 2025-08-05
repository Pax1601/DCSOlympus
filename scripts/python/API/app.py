import hashlib
import json
from math import pi
from random import random
import requests
import base64
from data_extractor import DataExtractor 
from data_types import LatLng
from unit import Unit
from unit_spawn_table import UnitSpawnTable
from datetime import datetime

class API:
    def __init__(self, username: str = "API", databases_location: str = "databases"):
        self.base_url = None
        self.config = None
        self.units: dict[str, Unit] = {}
        self.username = username
        self.databases_location = databases_location

        # Read the config file olympus.json
        try:
            with open("olympus.json", "r") as file:
                # Load the JSON configuration
                self.config = json.load(file)
        except FileNotFoundError:
            raise Exception("Configuration file olympus.json not found.")
        
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
            raise Exception("Aircraft database file not found.")
        
        try:
            with open(f"{self.databases_location}/helicopterdatabase.json", "r", -1, 'utf-8')  as file:
                self.helicopter_database = json.load(file)
        except FileNotFoundError:
            raise Exception("Helicopter database file not found.")
        
        try:
            with open(f"{self.databases_location}/groundunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.groundunit_database = json.load(file)
        except FileNotFoundError:
            raise Exception("Ground unit database file not found.")
        
        try:
            with open(f"{self.databases_location}/navyunitdatabase.json", "r", -1, 'utf-8')  as file:
                self.navyunit_database = json.load(file)
        except FileNotFoundError:
            raise Exception("Navy unit database file not found.")     
        
    def get(self, endpoint):
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
            
    def put(self, endpoint, data):
        credentials = f"{self.username}:{self.password}"
        base64_encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {base64_encoded_credentials}",
            "Content-Type": "application/json"
        }
        response = requests.put(f"{self.base_url}/{endpoint}", headers=headers, json=data)
        if response.status_code == 200:
            return response
        else:
            response.raise_for_status()
        
    def get_units(self):
        response = self.get("/units")
        if response.status_code == 200:
            try:
                data_extractor = DataExtractor(response.content)
                
                # Extract the update timestamp
                update_timestamp = data_extractor.extract_uint64()
                print(f"Update Timestamp: {update_timestamp}")
                
                while data_extractor.get_seek_position() < len(response.content):
                    # Extract the unit ID
                    unit_id = data_extractor.extract_uint32()
                    
                    if unit_id not in self.units:
                        # Create a new Unit instance if it doesn't exist
                        self.units[unit_id] = Unit(unit_id)
                    
                    self.units[unit_id].update_from_data_extractor(data_extractor)
                    
                return self.units
                    
            except ValueError:
                raise Exception("Failed to parse JSON response")
        else:
            raise Exception(f"Failed to fetch units: {response.status_code} - {response.text}")
        
        
    def get_logs(self, time = 0):
        endpoint = "/logs"
        endpoint += f"?time={time}"
        response = self.get(endpoint)
        if response.status_code == 200:
            try:
                logs = json.loads(response.content.decode('utf-8'))
                return logs
            except ValueError:
                raise Exception("Failed to parse JSON response")
        else:
            raise Exception(f"Failed to fetch logs: {response.status_code} - {response.text}")

    def spawn_aircrafts(self, units: list[UnitSpawnTable], coalition: str, airbaseName: str, country: str, immediate: bool, spawnPoints: list[LatLng]):
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "airbaseName": airbaseName,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnAircrafts": command }
        self.put("", data)
        
    def spanw_helicopters(self, units: list[UnitSpawnTable], coalition: str, airbaseName: str, country: str, immediate: bool, spawnPoints: list[LatLng]):
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "airbaseName": airbaseName,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnHelicopters": command }
        self.put("", data)
        
    def spawn_ground_units(self, units: list[UnitSpawnTable], coalition: str, country: str, immediate: bool, spawnPoints: list[LatLng]):
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnGroundUnits": command }
        self.put("", data)
        
    def spawn_navy_units(self, units: list[UnitSpawnTable], coalition: str, country: str, immediate: bool, spawnPoints: list[LatLng]):
        command = {
            "units": [unit.toJSON() for unit in units],
            "coalition": coalition,
            "country": country,
            "immediate": immediate,
            "spawnPoints": spawnPoints,
        }
        data = { "spawnNavyUnits": command }
        self.put("", data)

    def delete_unit(self, ID: int, explosion: bool, explosionType: str, immediate: bool):
        command = {
            "ID": ID,
            "explosion": explosion,
            "explosionType": explosionType,
            "immediate": immediate,
        }
        data = { "deleteUnit": command }
        self.put("", data)
             
if __name__ == "__main__":
    api = API()
    try:
        # Example usage
        # Get the units from the API
        print("Fetching units...")
        units = api.get_units()
        print("Units:", units)
        
        # Example of spawning aircrafts
        print("Spawning aircrafts...")
        spawn_units = [
            UnitSpawnTable(
                unit_type="A-10C_2",
                location=LatLng(lat=35.0, lng=35.0, alt=1000),
                skill="High",
                livery_id="Default",
                altitude=1000,
                loadout="Default",
                heading=pi/2
            )
        ]
        api.spawn_aircrafts(spawn_units, "blue", "", "", False, 0)
        
        # Spawn a random navy unit
        print("Spawning navy units...")
        random_navy_unit = list(api.navyunit_database.keys())[int(random() * len(api.navyunit_database))]

        spawn_navy_units = [
            UnitSpawnTable(
                unit_type=random_navy_unit,
                location=LatLng(lat=35.0, lng=35.0, alt=0),
                skill="High",
                livery_id="Default",
                altitude=None,
                loadout=None,
                heading=0
            )
        ]
        api.spawn_navy_units(spawn_navy_units, "blue", "", False, 0)
        
        # Example of deleting a unit
        # Get all the unit of type A-10C_2
        a10_units = [unit for unit in units.values() if unit.name == "A-10C_2"]
        for unit in a10_units:
            api.delete_unit(unit.ID, explosion=False, explosionType="", immediate=False)

        # Fetch logs from the API
        print("Fetching logs...")
        logs = api.get_logs()["logs"]
        
        # Pretty print the logs
        print("Logs:")
        # The log is a dictionary. The key is the timestamp and the value is the log message
        for timestamp, log_message in logs.items():
            # The timestamp is in milliseconds from unix epoch
            timestamp = int(timestamp) / 1000  # Convert to seconds
            iso_time = datetime.fromtimestamp(timestamp).isoformat()
            print(f"{iso_time}: {log_message}")

    except Exception as e:
        print("An error occurred:", e)