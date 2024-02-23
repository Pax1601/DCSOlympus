import math
import requests
import pyautogui
import time
import os
import yaml

from fastkml import kml
from shapely import wkt, Point
from PIL import Image
from concurrent import futures

# global counters
fut_counter = 0
tot_futs = 0

# constants
C = 40075016.686                # meters, Earth equatorial circumference
                      
def deg_to_num(lat_deg, lon_deg, zoom):
	lat_rad = math.radians(lat_deg)
	n = 1 << zoom
	xtile = int((lon_deg + 180.0) / 360.0 * n)
	ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
	return xtile, ytile

def num_to_deg(xtile, ytile, zoom):
  n = 1 << zoom
  lon_deg = xtile / n * 360.0 - 180.0
  lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
  lat_deg = math.degrees(lat_rad)
  return lat_deg, lon_deg

def compute_mpps(lat, z):
	return C * math.cos(math.radians(lat)) / math.pow(2, z + 8)

def printProgressBar(iteration, total, prefix = '', suffix = '', decimals = 1, length = 100, fill = '█', printEnd = "\r"):
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filledLength = int(length * iteration // total)
    bar = fill * filledLength + '-' * (length - filledLength)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end = printEnd)
    # Print New Line on Complete
    if iteration == total: 
        print()

def done_callback(fut):
	global fut_counter, tot_futs
	fut_counter += 1
	printProgressBar(fut_counter, tot_futs)

def extract_tiles(n, screenshots_coordinates, params):
	f = params["f"]
	zoom = params["zoom"]
	output_directory = params["output_directory"]
	n_width = params["n_width"]
	n_height = params["n_height"]
	screen_resolution = params["screen_resolution"]
	mpps = params["mpps"]

	coords = screenshots_coordinates[n]
	if (os.path.exists(os.path.join(output_directory, "screenshots", f"{f}_{n}.jpg"))):
		# Open the source screenshot
		img = Image.open(os.path.join(output_directory, "screenshots", f"{f}_{n}.jpg"))

		# Scale the image so that tiles are 256x256
		scale = screen_resolution / mpps
		w, h = img.size
		img = img.resize((int(w * scale), int(h * scale)))

		# Compute the Web Mercator Projection position of the top left corner of the most centered tile
		lat = coords[0]
		lng = coords[1]
		X_center, Y_center = deg_to_num(lat, lng, zoom)

		# Compute the position of the top left corner of the top left tile
		start_x = w / 2 - n_width / 2 * 256
		start_y = h / 2 - n_height / 2 * 256

		# Iterate on the grid
		for column in range(0, n_width):
			for row in range(0, n_height):
				# Crop the tile and compute its Web Mercator Projection position
				box = (start_x + column * 256, start_y + row * 256, start_x + (column + 1) * 256, start_y + (row + 1) * 256)
				X = X_center - math.floor(n_width / 2) + column
				Y = Y_center - math.floor(n_height / 2) + row

				# Save the tile
				if not os.path.exists(os.path.join(output_directory, "tiles", str(zoom), str(X))):
					try:
						os.mkdir(os.path.join(output_directory, "tiles", str(zoom), str(X)))
					except FileExistsError:
						continue
					except Exception as e: 
						raise e
				img.crop(box).save(os.path.join(output_directory, "tiles", str(zoom), str(X), f"{Y}.jpg"))
		n += 1

	else:
		raise Exception(f"{os.path.join(output_directory, "screenshots", f"{f}_{n}.jpg")} missing")

def run(map_config):
	with open('configs/screen_properties.yml', 'r') as sp:
		screen_config = yaml.safe_load(sp)

		# Create output folders
		output_directory = map_config["output_directory"]
		if not os.path.exists(output_directory):
			os.mkdir(output_directory)

		if not os.path.exists(os.path.join(output_directory, "screenshots")):
			os.mkdir(os.path.join(output_directory, "screenshots"))
		else: 
			skip_screenshots = (input("Raw screenshots already found for this config, do you want to skip directly to tiles extraction? Enter y to skip: ") == "y")

		if not os.path.exists(os.path.join(output_directory, "tiles")):
			os.mkdir(os.path.join(output_directory, "tiles"))

		# Compute the optimal zoom level
		usable_width = screen_config["width"] - 200 	# Keep a margin around the center
		usable_height = screen_config["height"] - 200	# Keep a margin around the center

		with open(map_config["boundary_file"], 'rt', encoding="utf-8") as bp:
			# Read the config file
			doc = bp.read()
			k = kml.KML()
			k.from_string(doc)

			# Extract the features
			features = []
			for feature in k.features():
				for sub_feature in list(feature.features()):
					features.append(sub_feature)

			# Iterate over all the closed features in the kml file
			f = 1
			for feature in features:
				geo = sub_feature.geometry

				# Define the boundary rect around the area
				start_lat = geo.bounds[3]
				start_lng = geo.bounds[0]
				end_lat = geo.bounds[1]
				end_lng = geo.bounds[2]

				# Find the zoom level that better approximates the provided resolution
				screen_resolution = screen_config['geo_resolution']
				mpps_delta = [abs(compute_mpps((start_lat + end_lat) / 2, z) - screen_resolution) for z in range(0, 21)]
				zoom = mpps_delta.index(min(mpps_delta))
				
				print(f"Feature {f} of {len(features)}, using zoom level {zoom}")
				
				# Find the maximum dimension of the tiles at the given resolution
				mpps = compute_mpps(end_lat, zoom)
				d = 256 * mpps / screen_resolution

				n_height = math.floor(usable_height / d)
				n_width = math.floor(usable_width / d)

				print(f"Feature {f} of {len(features)}, each screenshot will provide {n_height} tiles in height and {n_width} tiles in width")

				# Find the starting and ending points
				start_X, start_Y = deg_to_num(start_lat, start_lng, zoom)
				end_X, end_Y = deg_to_num(end_lat, end_lng, zoom)

				# Find all the X, Y coordinates inside of the provided area
				screenshots_coordinates = []
				for X in range(start_X, end_X, n_width):
					for Y in range(start_Y, end_Y, n_height):
						lat, lng = num_to_deg(X, Y, zoom)
						p = Point(lng, lat)
						if p.within(wkt.loads(geo.wkt)):
							screenshots_coordinates.append((lat, lng))

				print(f"Feature {f} of {len(features)}, {len(screenshots_coordinates)} screenshots will be taken")

				# Start looping
				if not skip_screenshots:
					print(f"Feature {f} of {len(features)}, taking screenshots...")
					n = 0
					for coords in screenshots_coordinates:
						# Making PUT request
						#data = json.dumps({'lat': coords[0], 'lng': coords[1]})
						#r = requests.put('http://localhost:8080', data = data)

						time.sleep(0.1)

						## Take and save screenshot
						screenshot = pyautogui.screenshot()
						screenshot.save(os.path.join(output_directory, "screenshots", f"{f}_{n}.jpg"))

						printProgressBar(n + 1, len(screenshots_coordinates))
						n += 1

				# Extract the tiles
				if not os.path.exists(os.path.join(output_directory, "tiles", str(zoom))):
					os.mkdir(os.path.join(output_directory, "tiles", str(zoom)))

				params = {
					"f": f,
					"zoom": zoom,
					"output_directory": output_directory,
					"n_width": n_width,
					"n_height": n_height,
					"screen_resolution": screen_resolution,
					"mpps": mpps
				}

				# Extract the tiles with parallel thread execution
				with futures.ThreadPoolExecutor() as executor:
					print(f"Feature {f} of {len(features)}, extracting tiles...")
					global tot_futs, fut_counter
					futs = [executor.submit(extract_tiles, n, screenshots_coordinates, params) for n in range(0, len(screenshots_coordinates))]
					tot_futs = len(futs)
					fut_counter = 0
					[fut.add_done_callback(done_callback) for fut in futs]
					[fut.result() for fut in futures.as_completed(futs)]

				# Increase the feature counter
				print(f"Feature {f} of {len(features)} completed!")	
				f += 1




