from api import API
from atc.agency.agency import Agency
from atc.agency.airbase import Airbase
import logging


class AirbaseAgency(Agency):
    """
    Base class for airbase-specific ATC agencies (Ground, Tower, Base, Approach).
    These agencies are associated with a specific airbase and share common functionality.
    """
    
    def __init__(self, name: str, config: dict, api: API, logger: logging.Logger, kml: dict, airbase: Airbase):
        super().__init__(name, config, api, logger)
        self.kml = kml
        self.airbase = airbase
        
    def get_airbase(self) -> Airbase:
        """Get the airbase associated with this agency."""
        return self.airbase
    
    def get_kml(self) -> dict:
        """Get the KML data for this agency's airspace."""
        return self.kml
