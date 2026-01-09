from dataclasses import dataclass
from typing import List, Optional

from shapely.geometry import Point, Polygon

from utils.utils import bearing_to, distance, project_with_bearing_and_distance

@dataclass
class LatLng:
    lat: float
    lng: float
    alt: float
    threshold: Optional[float] = 0  # Optional threshold for proximity checks

    def toJSON(self):
        """Convert LatLng to a JSON serializable dictionary."""
        return {
            "lat": self.lat,
            "lng": self.lng,
            "alt": self.alt,
            "threshold": self.threshold
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
class BoundingPolygon:
    coordinates: List[LatLng]

    def contains(self, point: LatLng) -> bool:
        """
        Check if a point is inside the polygon using Shapely library.
        Uses geographic coordinates (lat, lng) for accurate spherical geometry.
        
        Args:
            point: The LatLng point to check.
        Returns:
            True if the point is inside the polygon, False otherwise.
        """
        if len(self.coordinates) < 3:
            return False
        
        # Create a Shapely polygon from coordinates (lng, lat order for Shapely)
        polygon_coords = [(coord.lng, coord.lat) for coord in self.coordinates]
        polygon = Polygon(polygon_coords)
        
        # Create a Shapely point from the test point
        test_point = Point(point.lng, point.lat)
        
        # Use Shapely's contains method
        return polygon.contains(test_point)

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

@dataclass
class DrawArgument:
    argument: int
    value: float