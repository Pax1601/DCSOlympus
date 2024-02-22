import sys
import yaml
from pyproj import Geod
from fastkml import kml
from shapely import wkt
from datetime import timedelta

import capture_screen

if len(sys.argv) == 1:
    print("Please provide a configuration file as first argument. You can also drop the configuration file on this script to run it.")
else:
    config_file = sys.argv[1]
    print(f"Using config file: {config_file}")
    
    with open('configs/screen_properties.yml', 'r') as sp:
        with open(config_file, 'r') as cp:
            screen_config = yaml.safe_load(sp)
            map_config = yaml.safe_load(cp)

            print("#################################################################################################################################################")
            print("# IMPORTANT NOTE: the screen properties must be configured according to your screen and desired zoom level. Make sure you set them accordingly. #")
            print("#################################################################################################################################################")

            print("Screen parameters:")
            print(f"-> Screen width: {screen_config["width"]}px")
            print(f"-> Screen height: {screen_config["height"]}px")
            print(f"-> Geographic resolution: {screen_config["geo_resolution"]} meters/pixel")
            
            print("Map parameters:")
            print(f"-> Output directory: {map_config["output_directory"]}")
            print(f"-> Boundary file: {map_config["boundary_file"]}")

            with open(map_config["boundary_file"], 'rt', encoding="utf-8") as bp:
                # Read the config file and compute the total area of the covered map
                doc = bp.read()
                k = kml.KML()
                k.from_string(doc)

                geod = Geod(ellps="WGS84")
                features = [f for f in list(k.features()) if not f.isopen]
                print(f"Found {len(features)} closed features in the provided kml file")

                area = 0
                for feature in features:
                    for sub_feature in list(feature.features()):
                        geo = sub_feature.geometry
                        area += abs(geod.geometry_area_perimeter(wkt.loads(geo.wkt))[0])

                tile_size = 256 * screen_config["geo_resolution"] # meters
                tiles_per_screenshot = int(screen_config["width"] / 256) * int(screen_config["height"] / 256)
                tiles_num = int(area / (tile_size * tile_size))
                screenshots_num = int(tiles_num / tiles_per_screenshot)
                total_time = int(screenshots_num / 1.0)
                
                print(f"Total area: {int(area / 1e6)} square kilometers")
                print(f"Estimated number of tiles: {tiles_num}")
                print(f"Estimated number of screenshots: {screenshots_num}")
                print(f"Estimated time to complete: {timedelta(seconds=total_time)} (hh:mm:ss)")
                print("The script is ready to go. After you press any key, it will wait for 5 seconds, and then it will start.")

                input("Press any key to continue...")
                capture_screen.run(map_config)
    


