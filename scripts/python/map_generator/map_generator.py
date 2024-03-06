import math
import requests
import pyautogui
import time
import os
import yaml
import json
import numpy

from fastkml import kml
from shapely import wkt, Point
from PIL import Image
from concurrent import futures
from os import listdir
from os.path import isfile, isdir, join

# global counters
fut_counter = 0
tot_futs = 0

# constants
C = 40075016.686                # meters, Earth equatorial circumference
R = C / (2 * math.pi)			# meters, Earth equatorial radius
                      
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

def extract_tiles(n, screenshots_XY, params):
	f = params['f']
	zoom = params['zoom']
	output_directory = params['output_directory']
	n_width = params['n_width']
	n_height = params['n_height']

	XY = screenshots_XY[n]
	if (os.path.exists(os.path.join(output_directory, "screenshots", f"{f}_{n}_{zoom}.jpg"))):
		# Open the source screenshot
		img = Image.open(os.path.join(output_directory, "screenshots", f"{f}_{n}_{zoom}.jpg"))

		# Compute the Web Mercator Projection position of the top left corner of the most centered tile
		X_center, Y_center = XY[0], XY[1]

		# Compute the position of the top left corner of the top left tile
		start_x = img.width / 2 - n_width / 2 * 256
		start_y = img.height / 2 - n_height / 2 * 256

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
						# Ignore this error, it means one other thread has already created the folder
						pass
					except Exception as e: 
						raise e
				img.crop(box).convert('RGBA').save(os.path.join(output_directory, "tiles", str(zoom), str(X), f"{Y}.png"))
		n += 1

	else:
		raise Exception(f"{os.path.join(output_directory, 'screenshots', f'{f}_{n}_{zoom}.jpg')} missing")
	
def merge_tiles(base_path, zoom, tile):
	X = tile[0]
	Y = tile[1]

	# If the image already exists, open it so we can paste the higher quality data in it
	if os.path.exists(os.path.join(base_path, str(zoom - 1), str(X), f"{Y}.png")):
		dst = Image.open(os.path.join(base_path, str(zoom - 1), str(X), f"{Y}.png"))
	else:
		dst = Image.new('RGBA', (256, 256), (0, 0, 0, 0))

	# Loop on all the 4 subtiles in the tile
	positions = [(0, 0), (0, 1), (1, 0), (1, 1)]
	for i in range(0, 4):
		# Open the subtile, if it exists, and resize it down to 128x128
		if os.path.exists(os.path.join(base_path, str(zoom), str(2*X + positions[i][0]), f"{2*Y + positions[i][1]}.png")):
			im = Image.open(os.path.join(base_path, str(zoom), str(2*X + positions[i][0]), f"{2*Y + positions[i][1]}.png")).resize((128, 128))
			dst.paste(im, (positions[i][0] * 128, positions[i][1] * 128), im)

	# Create the output folder if it exists
	if not os.path.exists(os.path.join(base_path, str(zoom - 1), str(X))):
		try:
			os.mkdir(os.path.join(base_path, str(zoom - 1), str(X)))
		except FileExistsError:
			# Ignore this error, it means one other thread has already created the folder
			pass
		except Exception as e: 
			raise e
	
	# Save the image
	dst.save(os.path.join(base_path, str(zoom - 1), str(X), f"{Y}.png"), quality=98)

def computeCorrectionFactor(XY, n_width, n_height, map_config, zoom, output_directory, port):
	# Take screenshots at the given position, then east and south of it
	takeScreenshot(XY, 0, 0, map_config, zoom, output_directory, "calib", "ref", port)
	takeScreenshot((XY[0] + n_width, XY[1]), 0, 0, map_config, zoom, output_directory, "calib", "lng", port)
	takeScreenshot((XY[0], XY[1] + n_height), 0, 0, map_config, zoom, output_directory, "calib", "lat", port)
	
	calib_ref = Image.open(os.path.join(output_directory, "screenshots", f"calib_ref_{zoom}.jpg"))
	calib_lat = Image.open(os.path.join(output_directory, "screenshots", f"calib_lat_{zoom}.jpg"))
	calib_lng = Image.open(os.path.join(output_directory, "screenshots", f"calib_lng_{zoom}.jpg"))

	# These calibration boxes are located at the edge of the interest region
	box1 = (calib_ref.width / 2 + n_width / 2 * 256 - 50, calib_ref.height / 2 - n_height / 2 * 256 + 10,
	    	calib_ref.width / 2 + n_width / 2 * 256 + 50, calib_ref.height / 2 + n_height / 2 * 256 - 10)
	box2 = (calib_ref.width / 2 - n_width / 2 * 256 - 50, calib_ref.height / 2 - n_height / 2 * 256 + 10,
	    	calib_ref.width / 2 - n_width / 2 * 256 + 50, calib_ref.height / 2 + n_height / 2 * 256 - 10)
	
	box3 = (calib_ref.width / 2 - n_width / 2 * 256 + 10, calib_ref.height / 2 + n_height / 2 * 256 - 50,
	    	calib_ref.width / 2 + n_width / 2 * 256 - 10, calib_ref.height / 2 + n_height / 2 * 256 + 50)
	box4 = (calib_ref.width / 2 - n_width / 2 * 256 + 10, calib_ref.height / 2 - n_height / 2 * 256 - 50,
	    	calib_ref.width / 2 + n_width / 2 * 256 - 10, calib_ref.height / 2 - n_height / 2 * 256 + 50)

	# Find the best correction factor to bring the two images to be equal on the longitude direction
	best_err = None
	best_delta_width = 0
	for delta_width in range(-5, 6):
		calib_box1 = calib_ref.resize((calib_ref.width + delta_width, calib_ref.height)).crop(box1).convert('L')
		calib_box2 = calib_lng.resize((calib_ref.width + delta_width, calib_ref.height)).crop(box2).convert('L')
		err = computeDifference(calib_box1, calib_box2)
		if best_err is None or err < best_err:
			best_delta_width = delta_width
			best_err = err

	# Find the best correction factor to bring the two images to be equal on the latitude direction
	best_err = None
	best_delta_height = 0
	for delta_height in range(-5, 6):
		calib_box3 = calib_ref.resize((calib_ref.width, calib_ref.height + delta_height)).crop(box3).convert('L')
		calib_box4 = calib_lat.resize((calib_ref.width, calib_ref.height + delta_height)).crop(box4).convert('L')
		err = computeDifference(calib_box3, calib_box4)
		if best_err is None or err < best_err:
			best_delta_height = delta_height
			best_err = err

	return (best_delta_width, best_delta_height)

def computeDifference(imageA, imageB):
	err = numpy.sum((numpy.array(imageA).astype('float') - numpy.array(imageB).astype('float')) ** 2)
	err /= float(imageA.width * imageA.height)
	return err

def takeScreenshot(XY, n_width, n_height, map_config, zoom, output_directory, f, n, port, correction = (0, 0)):
	# Making PUT request
	# If the number of rows or columns is odd, we need to take the picture at the CENTER of the tile!
	lat, lng = num_to_deg(XY[0] + (n_width % 2) / 2, XY[1] + (n_height % 2) / 2, zoom)
	data = json.dumps({'lat': lat, 'lng': lng, 'alt': 1350 + map_config['zoom_factor'] * (25000 - 1350), 'mode': 'map'})
	r = requests.put(f'http://127.0.0.1:{port}', data = data)

	geo_data = json.loads(r.text)

	time.sleep(0.2)

	# Take and save screenshot. The response to the put request contains data, among which there is the north rotation at that point.
	screenshot = pyautogui.screenshot()

	# Scale the screenshot to account for Mercator Map Deformation
	lat1, lng1 = num_to_deg(XY[0], XY[1], zoom)
	lat2, lng2 = num_to_deg(XY[0] + 1, XY[1] + 1, zoom)

	deltaLat = abs(lat2 - lat1)
	deltaLng = abs(lng2 - lng1)

	# Compute the height and width each tile should have
	m_height = math.radians(deltaLat) * R 
	m_width = math.radians(deltaLng) * R * math.cos(math.radians(lat1))

	# Compute the height and width the tile has
	s_height = map_config['mpps'] * 256
	s_width = map_config['mpps'] * 256
	
	# Compute the scaling required to achieve that
	sx = s_width / m_width
	sy = s_height / m_height

	# Rotate, resize and save the screenshot
	screenshot.rotate(math.degrees(geo_data['northRotation'])).resize((int(sx * screenshot.width) + correction[0], int(sy * screenshot.height)+ correction[1] )).save(os.path.join(output_directory, "screenshots", f"{f}_{n}_{zoom}.jpg"), quality=98)

def run(map_config, port):
	global tot_futs, fut_counter

	with open('configs/screen_properties.yml', 'r') as sp:
		screen_config = yaml.safe_load(sp)

		# Create output folders
		output_directory = map_config['output_directory']
		if not os.path.exists(output_directory):
			os.mkdir(output_directory)

		skip_screenshots = False
		replace_screenshots = True
		if not os.path.exists(os.path.join(output_directory, "screenshots")):
			os.mkdir(os.path.join(output_directory, "screenshots"))
		else: 
			skip_screenshots = (input("Raw screenshots already found for this config, do you want to skip directly to tiles extraction? Enter y to skip: ") == "y")
			replace_screenshots = (input("Do you want to replace the existing screenshots? Enter y to replace: ") == "y")

		if not os.path.exists(os.path.join(output_directory, "tiles")):
			os.mkdir(os.path.join(output_directory, "tiles"))

		# Compute the optimal zoom level
		usable_width = screen_config['width'] - 400 	# Keep a margin around the center
		usable_height = screen_config['height'] - 400	# Keep a margin around the center

		existing_zoom_levels = [int(f) for f in listdir(os.path.join(output_directory, "tiles")) if isdir(join(output_directory, "tiles", f))]
		if len(existing_zoom_levels) == 0:
			final_level = 1
		else:
			final_level = max(existing_zoom_levels)

		with open(map_config['boundary_file'], 'rt', encoding="utf-8") as bp:
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
				########### Take screenshots
				geo = feature.geometry

				# Define the boundary rect around the area
				start_lat = geo.bounds[3]
				start_lng = geo.bounds[0]
				end_lat = geo.bounds[1]
				end_lng = geo.bounds[2]

				# Find the zoom level that better approximates the provided resolution
				mpps_delta = [abs(compute_mpps((start_lat + end_lat) / 2, z) - map_config['mpps']) for z in range(0, 21)]
				zoom = mpps_delta.index(min(mpps_delta))
				
				print(f"Feature {f} of {len(features)}, using zoom level {zoom}")
				
				# Find the maximum dimension of the tiles at the given resolution
				mpps = compute_mpps(end_lat, zoom)
				d = 256 * mpps / map_config['mpps']

				n_height = math.floor(usable_height / d)
				n_width = math.floor(usable_width / d)

				print(f"Feature {f} of {len(features)}, each screenshot will provide {n_height} tiles in height and {n_width} tiles in width")

				# Find the starting and ending points
				start_X, start_Y = deg_to_num(start_lat, start_lng, zoom)
				end_X, end_Y = deg_to_num(end_lat, end_lng, zoom)

				# Find all the X, Y coordinates inside of the provided area
				screenshots_XY = []
				for X in range(start_X, end_X, n_width):
					for Y in range(start_Y, end_Y, n_height):
						lat, lng = num_to_deg(X, Y, zoom)
						p = Point(lng, lat)
						if p.within(wkt.loads(geo.wkt)):
							screenshots_XY.append((X, Y))

				print(f"Feature {f} of {len(features)}, {len(screenshots_XY)} screenshots will be taken")

				# Start looping
				correction = None
				if not skip_screenshots:
					print(f"Feature {f} of {len(features)}, taking screenshots...")
					n = 0
					for XY in screenshots_XY:
						if not os.path.exists(os.path.join(output_directory, "screenshots", f"{f}_{n}_{zoom}.jpg")) or replace_screenshots:
							if n % 10 == 0 or correction is None:
								correction = computeCorrectionFactor(XY, n_width, n_height, map_config, zoom, output_directory, port)
							takeScreenshot(XY, n_width, n_height, map_config, zoom, output_directory, f, n, port, correction)
						
						printProgressBar(n + 1, len(screenshots_XY))
						n += 1

				########### Extract the tiles
				if not os.path.exists(os.path.join(output_directory, "tiles", str(zoom))):
					os.mkdir(os.path.join(output_directory, "tiles", str(zoom)))

				params = {
					"f": f,
					"zoom": zoom,
					"output_directory": output_directory,
					"n_width": n_width,
					"n_height": n_height,
				}

				# Extract the tiles with parallel thread execution
				with futures.ThreadPoolExecutor() as executor:
					print(f"Feature {f} of {len(features)}, extracting tiles...")
					futs = [executor.submit(extract_tiles, n, screenshots_XY, params) for n in range(0, len(screenshots_XY))]
					tot_futs = len(futs)
					fut_counter = 0
					[fut.add_done_callback(done_callback) for fut in futs]
					[fut.result() for fut in futures.as_completed(futs)]

				# Increase the feature counter
				print(f"Feature {f} of {len(features)} completed!")	
				f += 1

		if zoom <= final_level:
			final_level = int(input(f"Zoom level already exists. Starting from level {zoom}, please enter desired final zoom level: "))
		
		########### Assemble tiles to get lower zoom levels
		for current_zoom in range(zoom, final_level, -1):
			Xs = [int(d) for d in listdir(os.path.join(output_directory, "tiles", str(current_zoom))) if isdir(join(output_directory, "tiles", str(current_zoom), d))]
			existing_tiles = []
			for X in Xs:
				Ys = [int(f.removesuffix(".png")) for f in listdir(os.path.join(output_directory, "tiles", str(current_zoom), str(X))) if isfile(join(output_directory, "tiles", str(current_zoom), str(X), f))]
				for Y in Ys:
					existing_tiles.append((X, Y))

			tiles_to_produce = []
			for tile in existing_tiles:
				if (int(tile[0] / 2), int(tile[1] / 2)) not in tiles_to_produce:
					tiles_to_produce.append((int(tile[0] / 2), int(tile[1] / 2)))
			
			# Merge the tiles with parallel thread execution
			with futures.ThreadPoolExecutor() as executor:
				print(f"Merging tiles for zoom level {current_zoom - 1}...")

				if not os.path.exists(os.path.join(output_directory, "tiles", str(current_zoom - 1))):
					os.mkdir(os.path.join(output_directory, "tiles", str(current_zoom - 1)))

				futs = [executor.submit(merge_tiles, os.path.join(output_directory, "tiles"), current_zoom, tile) for tile in tiles_to_produce]
				tot_futs = len(futs)
				fut_counter = 0
				[fut.add_done_callback(done_callback) for fut in futs]
				[fut.result() for fut in futures.as_completed(futs)]

				





