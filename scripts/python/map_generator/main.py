import os
import yaml
import json
import requests
import argparse

from pyproj import Geod
from fastkml import kml
from shapely import wkt

import map_generator

parser = argparse.ArgumentParser(
            prog='DCS Olympus map generator',
            description='This script allows to automatically generate maps from DCS World',
            epilog='Hit the DCS Olympus Discord for more information')

parser.add_argument('config', help='map configuration yaml file')
parser.add_argument('-s', '--skip_screenshots', action='store_true', help='if screenshots are already present, this flag will cause the script to completely skip the screenshot loop.')   
parser.add_argument('-r', '--replace_screenshots', action='store_true', help='if screenshots are already present, this flag will cause the script to replace all screenshots, even those that already exist. Has no effect if -s or --skip_screenshots is present.')   
parser.add_argument('-l', '--final_level', type=int, default=1, help='if tiles are already present for the zoom level that the script will output, this number will instruct up to which zoom level tile merging will be run. Defaults to 1.')   
parser.add_argument('-f', '--screenshots_folder', help='if provided, will force the script to save the screenshots here. Defaults to output_directory/screenshots.')   
parser.add_argument('-t', '--tiles_folder', help='if provided, will force the script to save the tiles here. Defaults to output_directory/tiles.')   
parser.add_argument('-o', '--screenshots_only', action='store_true', help='if provided, the script will only run the screenshot acquisition algorithm.')   
parser.add_argument('-e', '--extraction_only', action='store_true', help='if provided, the script will only run the tiles extraction algorithm.')   
parser.add_argument('-m', '--merging_only', action='store_true', help='if provided, the script will only run the tiles merging algorithm.')   
parser.add_argument('-c', '--compression_only', action='store_true', help='if provided, the script will only run the compression algorithm.')  
parser.add_argument('-n', '--colors_number',  type=int, default=256, help='number of colors used by the png quantization algorithm. By default, 256. Must be less than 256.')  
parser.add_argument('-w', '--wait_period',  type=float, default=5.0, help='sleep time, in seconds, the algorithm will wait when a large jump is done in the map. To allow texture loading.')  
   
args = parser.parse_args()

# Port on which the camera control module is listening
port = 3003

config_file = args.config
if config_file is None:
    raise Exception("No configuration file provided as input. Please run script with -h argument for more info")

print(f"Using config file: {config_file}")
with open('configs/screen_properties.yml', 'r') as sp:
    with open(config_file, 'r') as cp:
        screen_config = yaml.safe_load(sp)
        map_config = yaml.safe_load(cp)

        map_config.update(vars(args))
        if map_config["screenshots_folder"] is None:
            map_config["screenshots_folder"] = os.path.join(map_config['output_directory'], "screenshots")
        if map_config["tiles_folder"] is None:
            map_config["tiles_folder"] = os.path.join(map_config['output_directory'], "tiles")

        print("Screen parameters:")
        print(f"-> Screen width: {screen_config['width']}px")
        print(f"-> Screen height: {screen_config['height']}px")
        
        print("Map parameters:")
        print(f"-> Output directory: {map_config['output_directory']}")
        print(f"-> Screenshots folder: {map_config['screenshots_folder']}")
        print(f"-> Tiles folder: {map_config['tiles_folder']}")
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
                data = json.dumps({'lat': features[0].geometry.bounds[1], 'lng': features[0].geometry.bounds[0], 'alt': 1350 + map_config['zoom_factor'] * (25000 - 1350), 'mode': 'map'})
                try:
                    r = requests.post(f'http://127.0.0.1:{port}', data = data)
                    print("The F10 map in your DCS installation was setup. Please, use the measure tool and measure the width of the screen in Nautical Miles")
                except:
                    print("No running DCS instance detected. You can still run the algorithm if you already took the screenshots, otherwise you will not be able to produce a map.")
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
            
            map_generator.run(map_config, port)