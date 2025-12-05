from api import API

# Setup a logger for the module
import logging
import xml.etree.ElementTree as ET
import re
import json
import random
from typing import List, Dict

from atc.clearance import ClearanceDeliveryATC
from atc.tower import TowerATC
from atc.ground import GroundATC
from atc.base import BaseOPSATC
from atc.atis import ATISATC
from atc.approach import ApproachATC
from atc.radar import RadarATC

logger = logging.getLogger("olympus_ATC")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
# Prevent double logging by not propagating to parent loggers
logger.propagate = False

def parse_kml_polygons(kml_file_path: str) -> List[Dict]:
    """
    Parse a KML file and extract all polygons with their descriptions and coordinates.
    
    The descriptions contain HTML-encoded JSON data which is cleaned and parsed.
    
    Args:
        kml_file_path (str): Path to the KML file
        
    Returns:
        List[Dict]: List of dictionaries containing:
            - 'name': Name of the placemark
            - 'data': Parsed JSON data from the description
            - 'coordinates': List of [longitude, latitude, altitude] coordinate tuples
    """
    # Parse the KML file
    tree = ET.parse(kml_file_path)
    root = tree.getroot()
    
    # KML namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    polygons = []
    
    # Find all Placemark elements
    for placemark in root.findall('.//kml:Placemark', ns):
        # Check if this placemark contains a polygon
        polygon = placemark.find('.//kml:Polygon', ns)
        if polygon is None:
            continue
        
        # Extract the name
        name_elem = placemark.find('kml:name', ns)
        name = name_elem.text if name_elem is not None else "Unnamed"
        
        # Extract the description
        desc_elem = placemark.find('kml:description', ns)
        description_html = desc_elem.text if desc_elem is not None else ""
        
        # Clean HTML from description to extract JSON
        json_data = None
        if description_html:
            # Remove CDATA wrapper if present
            cleaned = description_html.strip()
            if cleaned.startswith('<![CDATA[') and cleaned.endswith(']]>'):
                cleaned = cleaned[9:-3].strip()
            
            # First, decode HTML entities
            cleaned = re.sub(r'&nbsp;', ' ', cleaned)
            cleaned = re.sub(r'&lt;', '<', cleaned)
            cleaned = re.sub(r'&gt;', '>', cleaned)
            cleaned = re.sub(r'&amp;', '&', cleaned)
            cleaned = re.sub(r'&quot;', '"', cleaned)
            
            # Remove ALL HTML tags (including those with attributes and inline styles)
            # This also removes <br>, <div>, <span> etc.
            cleaned = re.sub(r'<[^>]+>', '', cleaned)
            
            # Clean up whitespace - replace multiple spaces/newlines with single space
            cleaned = re.sub(r'\s+', ' ', cleaned)
            cleaned = cleaned.strip()
            
            # Try to parse as JSON
            try:
                json_data = json.loads(cleaned)
                logger.debug(f"Successfully parsed JSON from '{name}': {json_data}")
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from description in '{name}': {e}")
                logger.debug(f"Raw description: {description_html[:200]}")
                logger.debug(f"Cleaned text: {cleaned[:200]}")
                json_data = {"raw_description": cleaned}
        
        # Extract coordinates from the polygon
        coordinates_elem = polygon.find('.//kml:coordinates', ns)
        coordinates = []
        if coordinates_elem is not None and coordinates_elem.text:
            # Parse coordinate string
            coord_text = coordinates_elem.text.strip()
            coord_pairs = coord_text.split()
            
            for pair in coord_pairs:
                parts = pair.split(',')
                if len(parts) >= 2:
                    try:
                        lon = float(parts[0])
                        lat = float(parts[1])
                        alt = float(parts[2]) if len(parts) > 2 else 0.0
                        coordinates.append([lon, lat, alt])
                    except ValueError:
                        logger.warning(f"Invalid coordinate in '{name}': {pair}")
        
        # Add to results
        polygons.append({
            'name': name,
            'data': json_data,
            'coordinates': coordinates
        })
    
    logger.info(f"Extracted {len(polygons)} polygons from {kml_file_path}")
    return polygons

def group_polygons_by_airport(polygons: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Group polygons by their airport identifier.
    
    Args:
        polygons (List[Dict]): List of polygon dictionaries from parse_kml_polygons
        
    Returns:
        Dict[str, List[Dict]]: Dictionary where keys are airport names and values are lists of polygons
    """
    grouped = {}
    ungrouped = []
    
    for polygon in polygons:
        # Try to find the airport identifier in the data
        airport_name = None
        
        if polygon['data'] and 'airport' in polygon['data']:
            airport_name = polygon['data']['airport']
        
        # If no airport key found, add to ungrouped
        if airport_name is None:
            ungrouped.append(polygon)
        else:
            if airport_name not in grouped:
                grouped[airport_name] = []
            grouped[airport_name].append(polygon)
    
    # Add ungrouped items if any
    if ungrouped:
        grouped['_ungrouped'] = ungrouped
    
    # Log grouping summary
    for group_name, group_polygons in grouped.items():
        logger.info(f"Airport '{group_name}': {len(group_polygons)} polygons")
    
    return grouped

def update_atc(api: API, agencies: list):
    """
    Update all ATC agencies.
    This function should be called periodically to allow each ATC agency to process
    incoming messages and perform necessary actions.
    
    Args:
        api (API): The API instance.
        agencies (list): List of ATC agency instances.
    """
    for agency in agencies:
        try:
            agency.update()
        except Exception as e:
            logger.error(f"Error updating ATC agency {agency}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    # Initialize the API
    api = API(load_kokoro=True, load_whisper=True)
    logger.info("API initialized")

    # Read the atc configuration file
    import json
    with open("atc.json", "r") as f:
        atc_config = json.load(f)
    logger.info("ATC configuration loaded")

    # Load the kml file defined in the atc configuration
    kml_file = atc_config.get("airspace", None)

    if kml_file:
        # Read and parse the KML file
        airspace_polygons = parse_kml_polygons(kml_file)
        logger.info(f"KML file '{kml_file}' loaded with {len(airspace_polygons)} polygons")
        
        # Group polygons by airport
        grouped_polygons = group_polygons_by_airport(airspace_polygons)
        
        # Log some examples
        for airport_name, airport_polygons in list(grouped_polygons.items())[:2]:  # Show first 2 airports
            logger.debug(f"Airport '{airport_name}': {len(airport_polygons)} polygons")
            for polygon in airport_polygons[:2]:  # Show first 2 polygons per airport
                logger.debug(f"  - '{polygon['name']}': {polygon['data']}")
    else: 
        raise ValueError("No 'airspace' key found in atc.json configuration")

    # Define available voices for random assignment
    voice_american_female = ["af_heart","af_bella","af_aoede","af_kore","af_sarah","af_nova","af_sky","af_alloy","af_jessica","af_river"]
    voice_american_male = ["am_michael","am_fenrir","am_puck","am_echo","am_eric","am_liam","am_onyx","am_adam"]
    voice_american = voice_american_male + voice_american_female
    voice_british_female = ["bf_emma","bf_isabella","bf_alice","bf_lily"]
    voice_british_male = ["bm_george","bm_fable","bm_lewis","bm_daniel"]
    voices_british = voice_british_male + voice_british_female
    voices = voice_american + voices_british
    
    available_voices = voices.copy()  # Create a copy to avoid modifying the original list

    agencies = []
    radar_zones = []  # Collect radar zones from ungrouped polygons

    # First, extract radar zones from ungrouped polygons
    ungrouped = grouped_polygons.get("_ungrouped", [])
    for polygon in ungrouped:
        if polygon['data'] and isinstance(polygon['data'], dict):
            polygon_type = polygon['data'].get('type')
            logger.debug(f"Ungrouped polygon '{polygon['name']}' has type: {polygon_type}, data: {polygon['data']}")
            if polygon_type == "radar":
                radar_zones.append(polygon)
                logger.info(f"Found radar zone: {polygon['name']}")
        else:
            logger.debug(f"Ungrouped polygon '{polygon['name']}' has no valid data: {polygon['data']}")

    # Iterate over all the airports from the grouped polygons
    for airport_name, airport_polygons in grouped_polygons.items():
        if airport_name == "_ungrouped":
            # Already processed radar zones
            continue
            
        logger.info(f"Setting up ATC for airport: {airport_name}")
        
        # Build airport configuration from polygons
        airport_config = {
            "runways": {},
            "frequencies": {},
            "hold_short_boxes": []  # Collect all hold short boxes
        }
        
        # Process each polygon for this airport
        for polygon in airport_polygons:
            polygon_type = polygon['data'].get('type') if polygon['data'] else None
            
            if polygon_type == "ATZ":
                # Extract frequencies from ATZ polygon
                frequencies = polygon['data'].get('frequencies', {})
                airport_config['frequencies'].update(frequencies)
                airport_config['active_runway'] = polygon['data'].get('preferred')
                # Store ATZ data in a structure
                airport_config['atz'] = {
                    'coordinates': polygon['coordinates'],
                    'vertical': polygon['data'].get('vertical')
                }
            elif polygon_type == "runway":
                # Extract runway information
                runway_name = polygon['data'].get('runways', [None])[0]
                if runway_name:
                    airport_config['runways'][runway_name] = {
                        'runwayBox': polygon['coordinates'],
                        'elevation': polygon['coordinates'][0][2] if polygon['coordinates'] else 0
                    }
            elif polygon_type == "hold short":
                # Collect hold short boxes
                airport_config['hold_short_boxes'].append(polygon['coordinates'])
            elif polygon_type == "approach":
                # Store approach coordinates and data
                approach_frequency = polygon['data'].get('frequency')
                airport_config['approach'] = {
                    'coordinates': polygon['coordinates'],
                    'frequency': approach_frequency,
                    'transitions': polygon['data'].get('transitions'),
                    'vertical': polygon['data'].get('vertical')
                }
                # Add approach frequency to the frequencies list for agency initialization
                if approach_frequency:
                    airport_config['frequencies']['approach'] = approach_frequency
        
        # Share hold short boxes across all runways
        for runway_name in airport_config['runways'].keys():
            airport_config['runways'][runway_name]['holdShortBoxes'] = airport_config['hold_short_boxes']
        
        # Create ATC agencies based on frequencies found
        for agency_name, frequency in airport_config.get("frequencies", {}).items():
            logger.info(f"  Setting up agency: {agency_name}")
            
            # Assign a random voice and remove it from available voices
            if available_voices:
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
            else:
                # If we run out of voices, reset the list and pick again
                available_voices = voices.copy()
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
                logger.warning("Ran out of unique voices, reusing voices for remaining agencies")
            
            if agency_name.lower() == "tower":
                tower_atc = TowerATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Tower ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(tower_atc)
            elif agency_name.lower() == "ground":
                ground_atc = GroundATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Ground ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(ground_atc)
            elif agency_name.lower() == "base":
                base_ops_atc = BaseOPSATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Base Ops ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(base_ops_atc)
            elif agency_name.lower() == "atis":
                atis_atc = ATISATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    ATIS ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(atis_atc)
            elif agency_name.lower() == "clearance":
                clearance_atc = ClearanceDeliveryATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Clearance Delivery ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(clearance_atc)
            elif agency_name.lower() == "approach":
                approach_atc = ApproachATC(airport_name, api, airport_config, frequency * 1e6, voice=assigned_voice)
                logger.info(f"    Approach ATC initialized for {airport_name} with voice {assigned_voice}")
                agencies.append(approach_atc)
            else:
                logger.warning(f"    Unknown agency '{agency_name}' for airport '{airport_name}'")

        # Link agencies together
        tower_agency = next((a for a in agencies if isinstance(a, TowerATC) and a.airport_name == airport_name), None)
        ground_agency = next((a for a in agencies if isinstance(a, GroundATC) and a.airport_name == airport_name), None)
        approach_agency = next((a for a in agencies if isinstance(a, ApproachATC) and a.airport_name == airport_name), None)
        
        if tower_agency is not None and ground_agency is not None:
            ground_agency.set_tower(tower_agency)
            tower_agency.set_ground(ground_agency)
            logger.info(f"    Linked Ground ATC to Tower ATC for {airport_name}")
        
        if tower_agency is not None and approach_agency is not None:
            approach_agency.set_tower(tower_agency)
            tower_agency.set_approach(approach_agency)
            logger.info(f"    Linked Approach ATC to Tower ATC for {airport_name}")

    logger.info("All airport ATC agencies set up successfully")
    
    # Create radar ATCs from KML radar zones
    if radar_zones:
        logger.info(f"Setting up {len(radar_zones)} radar zone(s)")
        
        for radar_polygon in radar_zones:
            radar_data = radar_polygon['data']
            # Try to get radar name from data, fallback to polygon name
            radar_name = radar_data.get('name', radar_polygon['name']) if radar_data else radar_polygon['name']
            
            # Get frequency from radar polygon data
            radar_frequency = radar_data.get('frequency', None)
            if not radar_frequency:
                logger.warning(f"Radar zone '{radar_name}' has no frequency, skipping")
                continue
            
            # Assign a voice for this radar
            if available_voices:
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
            else:
                available_voices = voices.copy()
                assigned_voice = random.choice(available_voices)
                available_voices.remove(assigned_voice)
            
            # Build radar config from polygon
            radar_config = {
                'coordinates': radar_polygon['coordinates'],
                'vertical': radar_data.get('vertical', {}),
                'frequency': radar_frequency
            }
            
            radar_atc = RadarATC(radar_name, api, radar_config, radar_frequency * 1e6, voice=assigned_voice)
            logger.info(f"    Radar ATC '{radar_name}' initialized with voice {assigned_voice}")
            agencies.append(radar_atc)
        
        # Now that all radars are created, give each radar access to all agencies (including other radars)
        for agency in agencies:
            if isinstance(agency, RadarATC):
                # Filter out self from the list
                other_agencies = [a for a in agencies if a != agency]
                agency.set_agencies(other_agencies)
                logger.info(f"    Radar ATC '{agency.area_name}' linked to {len(other_agencies)} other agencies")
    else:
        logger.info("No radar zones found in KML")

    logger.info("All ATC agencies (including radar) set up successfully")

    # Register the update callback to be called periodically
    api.register_on_update_callback(lambda api=api, agencies=agencies: update_atc(api, agencies))

    api.run()


