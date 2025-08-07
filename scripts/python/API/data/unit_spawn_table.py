from dataclasses import dataclass
from typing import Optional
from data.data_types import LatLng

@dataclass
class UnitSpawnTable:
    """Unit spawn table data structure for spawning units."""
    unit_type: str
    location: LatLng
    skill: str
    livery_id: str
    altitude: Optional[int] = None
    loadout: Optional[str] = None
    heading: Optional[int] = None
    
    def toJSON(self):
        """Convert the unit spawn table to a JSON serializable dictionary."""
        return {
            "unitType": self.unit_type,
            "location": {
                "lat": self.location.lat,
                "lng": self.location.lng,
                "alt": self.location.alt
            },
            "skill": self.skill,
            "liveryID": self.livery_id,
            "altitude": self.altitude,
            "loadout": self.loadout,
            "heading": self.heading
        }