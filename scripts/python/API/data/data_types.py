from dataclasses import dataclass
from typing import List, Optional

from utils.utils import bearing_to, distance, project_with_bearing_and_distance

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
        
    def project_with_bearing_and_distance(self, d, bearing):
        """
        Project this LatLng point with a bearing and distance.
        Args:
            d: Distance in meters to project.
            bearing: Bearing in radians.
        Returns:            
            A new LatLng point projected from this point.
        
        """
        (new_lat, new_lng) = project_with_bearing_and_distance(self.lat, self.lng, d, bearing) 
        return LatLng(new_lat, new_lng, self.alt)
    
    def distance_to(self, other):
        """
        Calculate the distance to another LatLng point.
        Args:
            other: Another LatLng point.
        Returns:
            Distance in meters to the other point.
        """
        return distance(self.lat, self.lng, other.lat, other.lng)
    
    def bearing_to(self, other):
        """
        Calculate the bearing to another LatLng point.
        Args:
            other: Another LatLng point.
        Returns:
            Bearing in radians to the other point.
        """
        return bearing_to(self.lat, self.lng, other.lat, other.lng)

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