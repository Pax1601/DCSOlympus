from math import asin, atan2, cos, degrees, radians, sin, sqrt

def enum_to_coalition(coalition_id: int) -> str:
    if coalition_id == 0:
        return "neutral"
    elif coalition_id == 1:
        return "red"
    elif coalition_id == 2:
        return "blue"
    return ""


def coalition_to_enum(coalition: str) -> int:
    if coalition == "neutral":
        return 0
    elif coalition == "red":
        return 1
    elif coalition == "blue":
        return 2
    return 0

def project_with_bearing_and_distance(lat1, lon1, d, bearing, R=6371000):
    """
    lat: initial latitude, in degrees
    lon: initial longitude, in degrees
    d: target distance from initial in meters
    bearing: (true) heading in radians
    R: optional radius of sphere, defaults to mean radius of earth

    Returns new lat/lon coordinate {d}m from initial, in degrees
    """
    lat1 = radians(lat1)
    lon1 = radians(lon1)
    a = bearing
    lat2 = asin(sin(lat1) * cos(d/R) + cos(lat1) * sin(d/R) * cos(a))
    lon2 = lon1 + atan2(
        sin(a) * sin(d/R) * cos(lat1),
        cos(d/R) - sin(lat1) * sin(lat2)
    )
    return (degrees(lat2), degrees(lon2),)

def distance(lat1, lng1, lat2, lng2):
    """
    Calculate the Haversine distance.
    Args:
        lat1: Latitude of the first point
        lng1: Longitude of the first point
        lat2: Latitude of the second point
        lng2: Longitude of the second point
    Returns:
        Distance in meters between the two points.
    """
    radius = 6371000 

    dlat = radians(lat2 - lat1)
    dlon = radians(lng2 - lng1)
    a = (sin(dlat / 2) * sin(dlat / 2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlon / 2) * sin(dlon / 2))
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    d = radius * c

    return d

def bearing_to(lat1, lng1, lat2, lng2):
    """
    Calculate the bearing from one point to another.
    Args:
        lat1: Latitude of the first point
        lng1: Longitude of the first point
        lat2: Latitude of the second point
        lng2: Longitude of the second point
    Returns:
        Bearing in radians from the first point to the second.
    """
    dLon = (lng2 - lng1)
    x = cos(radians(lat2)) * sin(radians(dLon))
    y = cos(radians(lat1)) * sin(radians(lat2)) - sin(radians(lat1)) * cos(radians(lat2)) * cos(radians(dLon))
    brng = atan2(x,y)
    brng = brng

    return brng
    