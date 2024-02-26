import sys
import yaml
import json
import requests
import time

from pyproj import Geod
from fastkml import kml
from shapely import wkt
from datetime import timedelta

import map_generator

if len(sys.argv) == 1:
    print("Please provide a configuration file as first argument. You can also drop the configuration file on this script to run it.")
else:
    config_file = sys.argv[1]
    print(f"Using config file: {config_file}")
    
    with open('configs/screen_properties.yml', 'r') as sp:
        with open(config_file, 'r') as cp:
            screen_config = yaml.safe_load(sp)
            map_config = yaml.safe_load(cp)

            print("Screen parameters:")
            print(f"-> Screen width: {screen_config['width']}px")
            print(f"-> Screen height: {screen_config['height']}px")
            
            print("Map parameters:")
            print(f"-> Output directory: {map_config['output_directory']}")
            print(f"-> Boundary file: {map_config['boundary_file']}")
            print(f"-> Zoom factor: {map_config['zoom_factor']}")

            if 'geo_width' in map_config:
                print(f"-> Geo width: {map_config['geo_width']}NM")

            with open(map_config['boundary_file'], 'rt', encoding="utf-8") as bp:
                # Read the config file and compute the total area of the covered map
                doc = bp.read()
                k = kml.KML()
                k.from_string(doc)

                geod = Geod(ellps="WGS84")
                features = []
                area = 0
                for feature in k.features():
                    for sub_feature in list(feature.features()):
                        geo = sub_feature.geometry
                        area += abs(geod.geometry_area_perimeter(wkt.loads(geo.wkt))[0])
                        features.append(sub_feature)

                print(f"Found {len(features)} features in the provided kml file")

                if 'geo_width' not in map_config:
                    # Let the user input the size of the screen to compute resolution
                    data = json.dumps({'lat': features[0].geometry.bounds[1], 'lng': features[0].geometry.bounds[0], 'alt': 1350 + map_config['zoom_factor'] * (25000 - 1350)})
                    r = requests.put('http://localhost:8080', data = data)
                    print("The F10 map in your DCS installation was setup. Please, use the measure tool and measure the width of the screen in Nautical Miles")
                    map_config['geo_width'] = input("Insert the width of the screen in Nautical Miles: ")
                
                map_config['mpps'] = float(map_config['geo_width']) * 1852 / screen_config['width']

                tile_size = 256 * map_config['mpps'] # meters
                tiles_per_screenshot = int(screen_config['width'] / 256) * int(screen_config['height'] / 256)
                tiles_num = int(area / (tile_size * tile_size))
                screenshots_num = int(tiles_num / tiles_per_screenshot)
                total_time = int(screenshots_num / 1.0)
                
                print(f"Total area: {int(area / 1e6)} square kilometers")
                print(f"Estimated number of tiles: {tiles_num}")
                print(f"Estimated number of screenshots: {screenshots_num}")
                print(f"Estimated time to complete: {timedelta(seconds=total_time * 0.15)} (hh:mm:ss)")
                input("Press enter to continue...")
                
                map_generator.run(map_config)

    


