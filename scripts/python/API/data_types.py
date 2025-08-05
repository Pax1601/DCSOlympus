from dataclasses import dataclass
from typing import List, Optional

@dataclass
class LatLng:
    lat: float
    lng: float
    alt: float
    
    def toJSON(self):
        """Convert LatLng to a JSON serializable dictionary."""
        return {
            "lat": self.lat,
            "lng": self.lng,
            "alt": self.alt
        }

@dataclass
class TACAN:
    is_on: bool
    channel: int
    xy: str
    callsign: str

@dataclass
class Radio:
    frequency: int
    callsign: int
    callsign_number: int

@dataclass
class GeneralSettings:
    prohibit_jettison: bool
    prohibit_aa: bool
    prohibit_ag: bool
    prohibit_afterburner: bool
    prohibit_air_wpn: bool

@dataclass
class Ammo:
    quantity: int
    name: str
    guidance: int
    category: int
    missile_category: int

@dataclass
class Contact:
    id: int
    detection_method: int

@dataclass
class Offset:
    x: float
    y: float
    z: float