import asyncio

from data.data_extractor import DataExtractor
from data.data_indexes import DataIndexes
from data.data_types import LatLng
from utils.utils import enum_to_coalition

class Weapon:
    def __init__(self, id: int, api):
        from api import API

        self.ID = id
        self.api: API = api

        # Data controlled directly by the backend
        self.alive = False
        self.coalition = "neutral"
        self.name = ""
        self.position = LatLng(0, 0, 0)
        self.speed = 0.0
        self.heading = 0.0
        self.launcher_ID = None

        self.on_property_change_callbacks = {}
        
    def __repr__(self):
        return f"Weapon(id={self.ID}, name={self.name}, coalition={self.coalition}, position={self.position})"
    
    def register_on_property_change_callback(self, property_name: str, callback):
        """
        Register a callback function that will be called when a property changes.
        Args:
            property_name (str): The name of the property to watch.
            callback (function): The function to call when the property changes. The callback should accept two parameters: the weapon and the new value of the property.
        """
        if property_name not in self.on_property_change_callbacks:
            self.on_property_change_callbacks[property_name] = callback
            
    def unregister_on_property_change_callback(self, property_name: str):
        """
        Unregister a callback function for a property.
        Args:
            property_name (str): The name of the property to stop watching.
        """
        if property_name in self.on_property_change_callbacks:
            del self.on_property_change_callbacks[property_name]
        
    def _trigger_callback(self, property_name: str, value):
        """
        Trigger a property change callback, executing it in the asyncio event loop if available.
        Args:
            property_name (str): The name of the property that changed.
            value: The new value of the property.
        """
        if property_name in self.on_property_change_callbacks:
            callback = self.on_property_change_callbacks[property_name]
            try:
                # Try to get the current event loop and schedule the callback
                loop = asyncio.get_running_loop()
                loop.create_task(self._run_callback_async(callback, self, value))
            except RuntimeError:
                # No event loop running, execute synchronously
                callback(self, value)
    
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
            import logging
            logging.getLogger(__name__).error(f"Error in property change callback: {e}")
        
    def update_from_data_extractor(self, data_extractor: DataExtractor):
        datum_index = 0
        
        while datum_index != DataIndexes.END_OF_DATA.value:
            datum_index = data_extractor.extract_uint8()
            
            if datum_index == DataIndexes.CATEGORY.value:
                data_extractor.extract_string()
            elif datum_index == DataIndexes.ALIVE.value:
                alive = data_extractor.extract_bool()
                if alive != self.alive:
                    self.alive = alive
                    # Trigger callbacks for property change
                    if "alive" in self.on_property_change_callbacks:
                        self._trigger_callback("alive", self.alive)
            elif datum_index == DataIndexes.COALITION.value:
                coalition = enum_to_coalition(data_extractor.extract_uint8())
                if coalition != self.coalition:
                    self.coalition = coalition
                    # Trigger callbacks for property change
                    if "coalition" in self.on_property_change_callbacks:
                        self._trigger_callback("coalition", self.coalition)
            elif datum_index == DataIndexes.NAME.value:
                name = data_extractor.extract_string()
                if name != self.name:
                    self.name = name
                    # Trigger callbacks for property change
                    if "name" in self.on_property_change_callbacks:
                        self._trigger_callback("name", self.name)
            elif datum_index == DataIndexes.POSITION.value:
                position = data_extractor.extract_lat_lng()
                if position != self.position:
                    self.position = position
                    # Trigger callbacks for property change
                    if "position" in self.on_property_change_callbacks:
                        self._trigger_callback("position", self.position)
                        
            elif datum_index == DataIndexes.SPEED.value:
                speed = data_extractor.extract_float64()
                if speed != self.speed:
                    self.speed = speed
                    # Trigger callbacks for property change
                    if "speed" in self.on_property_change_callbacks:
                        self._trigger_callback("speed", self.speed)
            elif datum_index == DataIndexes.HEADING.value:
                heading = data_extractor.extract_float64()
                if heading != self.heading:
                    self.heading = heading
                    # Trigger callbacks for property change
                    if "heading" in self.on_property_change_callbacks:
                        self._trigger_callback("heading", self.heading)
            elif datum_index == DataIndexes.LAUNCHER_ID.value:
                launcher_ID = data_extractor.extract_uint32()
                if launcher_ID != self.launcher_ID:
                    self.launcher_ID = launcher_ID
                    # Trigger callbacks for property change
                    if "launcher_ID" in self.on_property_change_callbacks:
                        self._trigger_callback("launcher_ID", self.launcher_ID)