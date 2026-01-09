import logging
import xml.etree.ElementTree as ET
from api import LatLng
from metar.Metar import Metar

def load_kml_file(path: str, logger: logging.Logger) -> str:
    try:
        with open(path, 'r') as file:
            kml_data = file.read()
            logger.info(f"KML file loaded from {path}")
            return kml_data
    except FileNotFoundError:
        logger.error(f"KML file not found: {path}")
        return ""
    
def parse_kml_file(path: str, logger: logging.Logger) -> dict:
    """
    Parse a KML file and extract airbase data.
    Each airbase is represented as a folder in the KML file, containing placemarks for runways, tower, approach, etc.
    Returns a dictionary with airbase names as keys and their data as values.
    """
    kml_data = load_kml_file(path, logger)
    
    # Read the kml file. Each airbase is a folder in the file, with different polygons inside for runways, tower, approach etc.
    # Create a dict. The keys are the airbases, then it is split into runways, tower, approach etc.
    
    if not kml_data:
        logger.error("KML data is empty")
        return {}
    
    try:
        # Parse the KML XML
        root = ET.fromstring(kml_data)
        
        # Define the KML namespace
        namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
        
        # Initialize the result dictionary
        airbases = {}
        
        # Helper function to parse placemark coordinates
        def parse_placemark_coordinates(placemark):
            # Find the polygon coordinates
            coordinates_elem = placemark.find('.//kml:Polygon//kml:coordinates', namespace)
            if coordinates_elem is None:
                return None
            
            # Parse the coordinates
            coordinates_text = coordinates_elem.text.strip()
            coordinates_list = []
            
            for coord_pair in coordinates_text.split():
                if coord_pair:
                    parts = coord_pair.split(',')
                    if len(parts) >= 2:
                        lon = float(parts[0])
                        lat = float(parts[1])
                        alt = float(parts[2]) if len(parts) > 2 else 0.0
                        coordinates_list.append(LatLng(lat, lon, alt))
            
            return coordinates_list if coordinates_list else None
        
        # Find the Document element
        document = root.find('.//kml:Document', namespace)
        if document is None:
            logger.error("No Document element found in KML file")
            return {}
        
        # First, process top-level Placemarks (not inside Folders)
        for placemark in document.findall('kml:Placemark', namespace):
            # Get the placemark name
            placemark_name_elem = placemark.find('kml:name', namespace)
            if placemark_name_elem is None:
                continue
            
            placemark_name = placemark_name_elem.text
            
            # Parse coordinates
            coordinates_list = parse_placemark_coordinates(placemark)
            if coordinates_list is None:
                continue
            
            # Store as a top-level entry
            airbases[placemark_name] = {
                'coordinates': coordinates_list
            }
        
        # Then, process all Folder elements (each represents an airbase)
        for folder in root.findall('.//kml:Folder', namespace):
            # Get the airbase name
            airbase_name_elem = folder.find('kml:name', namespace)
            if airbase_name_elem is None:
                continue
            
            airbase_name = airbase_name_elem.text
            
            # Initialize the airbase dictionary
            airbases[airbase_name] = {}
            
            # Find all Placemarks inside this folder
            for placemark in folder.findall('kml:Placemark', namespace):
                # Get the placemark name (e.g., "Approach", "Runway 26/08", "Tower")
                placemark_name_elem = placemark.find('kml:name', namespace)
                if placemark_name_elem is None:
                    continue
                
                placemark_name = placemark_name_elem.text
                
                # Parse coordinates
                coordinates_list = parse_placemark_coordinates(placemark)
                if coordinates_list is None:
                    continue
                
                # Store the placemark data
                airbases[airbase_name][placemark_name] = {
                    'coordinates': coordinates_list
                }
        
        logger.info(f"Parsing KML file from {path} - Found {len(airbases)} zone(s)")
        return airbases
    
    except ET.ParseError as e:
        logger.error(f"Error parsing KML file: {e}")
        return {}
    
def compute_runway_headings(runway_coordinates: list[LatLng]) -> tuple[float, float]:
    """
    Compute the runway headings from runway polygon coordinates.
    Uses PCA to find the principal axis of the elongated runway shape.
    
    Args:
        runway_coordinates: List of LatLng points defining the runway polygon.
    
    Returns:
        Tuple of (heading1, heading2) in degrees, where heading2 is the reciprocal of heading1.
    """
    import math
    import numpy as np
    
    if len(runway_coordinates) < 2:
        return (0.0, 180.0)
    
    # Convert coordinates to numpy array (use lng, lat for Cartesian approximation)
    points = np.array([[coord.lng, coord.lat] for coord in runway_coordinates])
    
    # Calculate centroid
    centroid = np.mean(points, axis=0)
    
    # Center the points
    centered_points = points - centroid
    
    # Compute covariance matrix
    cov_matrix = np.cov(centered_points.T)
    
    # Compute eigenvectors and eigenvalues
    eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)
    
    # The eigenvector with the largest eigenvalue is the principal axis (runway direction)
    principal_axis = eigenvectors[:, np.argmax(eigenvalues)]
    
    # Calculate heading from the principal axis
    # arctan2(dy, dx) gives the angle
    heading_rad = math.atan2(principal_axis[1], principal_axis[0])
    
    # Convert to degrees and normalize to 0-360 (aviation heading)
    # Note: atan2 gives angle from east, we need from north
    heading1 = (90 - math.degrees(heading_rad)) % 360
    
    # Calculate reciprocal heading (180 degrees opposite)
    heading2 = (heading1 + 180) % 360
    
    # Return both headings, sorted so smaller is first
    if heading1 < heading2:
        return (heading1, heading2)
    else:
        return (heading2, heading1)

def format_frequency_for_speech(frequency_hz: float) -> str:
    """
    Format a frequency in Hz for speech synthesis.
    Example: 180325000 Hz becomes "1 8 0 decimal 3 2 5"
    """
    # Convert to MHz and format with 3 decimal places
    frequency_mhz = frequency_hz / 1e6
    frequency_str = f"{frequency_mhz:.3f}"
    
    # Split into whole and decimal parts
    if '.' in frequency_str:
        whole_part, decimal_part = frequency_str.split('.')
    else:
        whole_part = frequency_str
        decimal_part = ""
    
    # Format whole part with spaces between digits
    formatted_whole = ' '.join(whole_part)
    
    # Format decimal part with spaces between digits, remove trailing zeros
    if decimal_part:
        decimal_part = decimal_part.rstrip('0')  # Remove trailing zeros
        if decimal_part:  # If there are still digits after removing zeros
            formatted_decimal = ' '.join(decimal_part)
            return f"{formatted_whole} decimal {formatted_decimal}"
    
    return formatted_whole

def normalize_metar(metar_string: str, ICAO: str, time: str = "") -> str:
    """
    Normalize a METAR string to ensure it starts with "METAR <ICAO>" and optionally set the observation time.
    Args:
        metar_string: The original METAR string.
        ICAO: The ICAO code of the airport.
        time: Optional time string in the format "DDHHMMZ" to set in the METAR.

    Returns:
        The normalized METAR string.
    """

    # Check fi the word "METAR" is at the start of the string
    if not metar_string.startswith("METAR"):
        metar_string = "METAR " + metar_string

    # Check if the icao code is already in the metar string. If not, add it at the start, after "METAR"
    if ICAO not in metar_string:
        metar_string = metar_string.replace("METAR", f"METAR {ICAO}", 1)

    # If a time is provided, force it in the metar string
    if time:
        # Find the part that ends with "Z" (the time part)
        parts = metar_string.split()
        for i, part in enumerate(parts):
            if part.endswith("Z"):
                parts[i] = time
                break
        metar_string = ' '.join(parts)

    # If no time part was found and replaced, add the time after the ICAO code
    if all(not part.endswith("Z") for part in metar_string.split()):
        parts = metar_string.split()
        # Insert time after ICAO code
        for i, part in enumerate(parts):
            if part == ICAO:
                parts.insert(i + 1, time)
                break
        metar_string = ' '.join(parts)

    return metar_string

def read_metar(metar_string: str) -> dict:
    """
    Parse a METAR weather report string and extract key information.
    
    Args:
        metar_string: Standard METAR format string (e.g., "METAR KJFK 121853Z 24008KT 10SM FEW250 M04/M17 A3034 RMK AO2 SLP279 T10441172")
    
    Returns:
        Dictionary containing parsed METAR data with fields like:
        - station_id: Airport ICAO code
        - time: Observation time
        - temp: Temperature
        - dewpt: Dew point
        - wind_speed: Wind speed
        - wind_dir: Wind direction
        - visibility: Visibility
        - pressure: Altimeter setting
        - sky: Sky conditions
        - weather: Weather conditions
    """
    try:
        # Parse the METAR string using the metar library
        obs = Metar(metar_string)
        
        # Extract key information into a dictionary
        metar_data = {
            'station_id': obs.station_id,
            'time': obs.time.strftime('%Y-%m-%d %H:%M:%S UTC') if obs.time else None,
            'temp': obs.temp.value('C') if obs.temp else None,
            'temp_unit': 'C',
            'dewpt': obs.dewpt.value('C') if obs.dewpt else None,
            'dewpt_unit': 'C',
            'wind_speed': obs.wind_speed.value('KT') if obs.wind_speed else None,
            'wind_speed_unit': 'KT',
            'wind_dir': obs.wind_dir.value() if obs.wind_dir else None,
            'wind_dir_unit': 'degrees',
            'wind_gust': obs.wind_gust.value('KT') if obs.wind_gust else None,
            'visibility': obs.vis.value('SM') if obs.vis else None,
            'visibility_unit': 'SM',
            'pressure': obs.press.value('MB') if obs.press else None,
            'pressure_unit': 'MB',
            'sky_conditions': [f"{sky[0]} at {sky[1].value('FT')} ft" for sky in obs.sky] if obs.sky else [],
            'weather': [str(w) for w in obs.weather] if obs.weather else [],
            'raw': metar_string
        }
        
        return metar_data
        
    except Exception as e:
        # Return error information if parsing fails
        return {
            'error': str(e),
            'raw': metar_string
        }
    
def spell_number(num, decimals=0):
    """Convert a number to spelled-out digits for TTS."""
    if num is None:
        return ""
    
    # Handle negative numbers
    prefix = "minus " if num < 0 else ""
    num = abs(num)
    
    # Round to specified decimals
    num = round(num, decimals)
    
    # Convert to string and remove decimal point
    if decimals > 0:
        num_str = f"{num:.{decimals}f}"
    else:
        num_str = str(int(num))
    
    # Spell out each digit
    spelled = ' '.join(num_str.replace('.', ' decimal ').replace('-', ''))
    
    return prefix + spelled

def metar_to_ATIS_speech(metar_data: dict, airport_name: str = None, information_code: str = None, 
                         runway: str = None, color_code: str = None) -> str:
    """
    Convert parsed METAR data into a speech-friendly ATIS message format.
    Numbers are spelled out digit by digit for TTS.
    
    Args:
        metar_data: Dictionary containing parsed METAR data.
        airport_name: Name of the airport (e.g., "Wiesbaden")
        information_code: Phonetic alphabet code (e.g., "alpha", "bravo", "charlie")
        runway: Active runway (e.g., "2 6" for runway 26)
        color_code: Airport color code (e.g., "blue", "green")
    Returns:
        A string formatted for ATIS speech output.
    """
    
    if 'error' in metar_data:
        return "METAR data unavailable"
    
    # Build the ATIS message
    atis_parts = []
    
    # PREAMBLE - Airport identification, information code, time, runway
    preamble_parts = []
    
    # Airport name and information code
    if airport_name:
        station_info = f"{airport_name} information"
        if information_code:
            station_info += f" code {information_code}"
        preamble_parts.append(station_info)
    elif metar_data.get('station_id'):
        station_info = f"{metar_data['station_id']} information"
        if information_code:
            station_info += f" code {information_code}"
        preamble_parts.append(station_info)
    
    # Time (from METAR observation time)
    if metar_data.get('time'):
        # Extract just the time part (HH:MM) and convert to zulu time format
        time_str = metar_data['time']
        if isinstance(time_str, str) and ':' in time_str:
            # Parse "YYYY-MM-DD HH:MM:SS UTC" format
            parts = time_str.split(' ')
            if len(parts) >= 2:
                time_part = parts[1].split(':')
                if len(time_part) >= 2:
                    hours = time_part[0]
                    minutes = time_part[1]
                    # Spell out the time
                    time_spelled = ' '.join(hours + minutes) + ' zulu'
                    preamble_parts.append(time_spelled)
    
    # Active runway and color code
    runway_info_parts = []
    if runway:
        runway_info_parts.append(f"Runway {runway}")
    if color_code:
        runway_info_parts.append(f"colour code {color_code}")
    
    if runway_info_parts:
        preamble_parts.append(', '.join(runway_info_parts))
    
    # Add preamble to ATIS
    if preamble_parts:
        atis_parts.extend(preamble_parts)
    
    # WEATHER INFORMATION
    # Wind information
    if metar_data.get('wind_dir') is not None and metar_data.get('wind_speed') is not None:
        wind_dir = spell_number(metar_data['wind_dir'])
        wind_speed = spell_number(metar_data['wind_speed'])
        wind_msg = f"Wind {wind_dir} at {wind_speed} knots"
        
        if metar_data.get('wind_gust'):
            wind_gust = spell_number(metar_data['wind_gust'])
            wind_msg += f", gusting {wind_gust} knots"
        
        atis_parts.append(wind_msg)
    elif metar_data.get('wind_speed') == 0 or metar_data.get('wind_dir') is None:
        atis_parts.append("Wind calm")
    
    # Visibility
    if metar_data.get('visibility') is not None:
        vis = metar_data['visibility']
        if vis >= 10:
            atis_parts.append("Visibility one zero or greater")
        else:
            vis_spelled = spell_number(vis)
            atis_parts.append(f"Visibility {vis_spelled} statute miles")
    
    # Weather phenomena
    if metar_data.get('weather'):
        weather_str = ', '.join(metar_data['weather'])
        atis_parts.append(f"Weather: {weather_str}")
    
    # Sky conditions
    if metar_data.get('sky_conditions'):
        sky_parts = []
        for condition in metar_data['sky_conditions']:
            # Parse the condition string (e.g., "FEW at 2500.0 ft")
            parts = condition.split(' at ')
            if len(parts) == 2:
                cover = parts[0]
                height_str = parts[1].replace(' ft', '').replace('.0', '')
                try:
                    height = int(float(height_str))
                    height_spelled = spell_number(height)
                    sky_parts.append(f"{cover} at {height_spelled} feet")
                except ValueError:
                    sky_parts.append(condition)
        
        if sky_parts:
            atis_parts.append(', '.join(sky_parts))
    else:
        atis_parts.append("Sky clear")
    
    # Temperature and dew point
    if metar_data.get('temp') is not None:
        temp = metar_data['temp']
        temp_spelled = spell_number(temp)
        temp_msg = f"Temperature {temp_spelled}"
        
        if metar_data.get('dewpt') is not None:
            dewpt = metar_data['dewpt']
            dewpt_spelled = spell_number(dewpt)
            temp_msg += f", dew point {dewpt_spelled}"
        
        atis_parts.append(temp_msg)
    
    # Altimeter setting
    if metar_data.get('pressure') is not None:
        # Convert hectopascals/millibars to inches of mercury (standard for US ATIS)
        pressure_mb = metar_data['pressure']
        pressure_inhg = pressure_mb * 0.02953
        
        # Format as 4 digits (e.g., 30.12 becomes "3 0 1 2")
        pressure_str = f"{pressure_inhg:.2f}".replace('.', '')
        pressure_spelled = ' '.join(pressure_str)
        
        atis_parts.append(f"Altimeter {pressure_spelled}")
    
    # Join all parts
    atis_message = ". ".join(atis_parts) + "."
    
    return atis_message

def date_and_time_to_string_and_letter(date_and_time: dict, utc_difference: int) -> tuple[str, str, str]:
    """
    Convert a date and time dictionary into a timestamp string, top of the hour string, and phonetic letter for the hour.
    Args:
        date_and_time: Dictionary with keys 'h', 'm', 's' for hours, minutes, seconds.
        utc_difference: Integer offset to apply to the hours for UTC conversion.
    Returns:
        Tuple of (timestamp string, top of the hour string, phonetic hour letter).
    """
    hours = date_and_time.get("h", 0)
    minutes = date_and_time.get("m", 0)
    seconds = date_and_time.get("s", 0)

    # Adjust for UTC difference
    hours = (hours + utc_difference) % 24

    # Generate a timestamp string
    timestamp = f"{hours:02}{minutes:02}{seconds:02}Z"

    # Generate a top of the hour string
    timestamp_top_of_hour = f"{hours:02}0000Z"

    # Generate a phonetic letter for the current hour
    phonetic_letters = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima",
                        "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu"]
    phonetic_hour = phonetic_letters[hours % 26]

    return timestamp, timestamp_top_of_hour, phonetic_hour

def pick_runway_from_wind_direction(wind_direction: float, runways: list):
    """
    Given a wind direction and a list of runways, pick the runway that is closest to the wind direction.
    Args:
        wind_direction: Wind direction in degrees.
        runways: List of Runway objects.
    Returns:
        The Runway object that is closest to the wind direction.
    """

    # Find the closest runway to the wind direction
    closest_runway = None
    smallest_diff = 360  # Maximum possible difference
    for runway in runways:
        runway_heading = runway.get_heading()
        diff = abs(runway_heading - wind_direction)
        
        # Normalize difference
        if diff > 180:
            diff = 360 - diff
        
        if diff < smallest_diff:
            smallest_diff = diff
            closest_runway = runway

    return closest_runway
