import math
import requests
import json
import pyautogui
import time
import os

from pyproj import Geod
from fastkml import kml
from shapely import wkt
                      
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

def run(map_config):
	with open(map_config["boundary_file"], 'rt', encoding="utf-8") as bp:
		# Read the config file
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

				start_lat = geo.bounds[1]
				start_lng = geo.bounds[0]
				end_lat = geo.bounds[3]
				end_lng = geo.bound[2]
				
				# Find the starting and ending points
				start_X, start_Y = deg_to_num(start_lat, start_lng, zoom)
				end_X, end_Y = deg_to_num(end_lat, end_lng, zoom)

				time.sleep(2)

				# Create output folder
				if not os.path.exists("output"):
					os.mkdir("output")

				# Start looping
				n = 1
				total = math.floor((end_X - start_X) / 2) * math.floor((end_Y - start_Y) / 2)
				for X in range(start_X, end_X, 2):
					for Y in range(start_Y, end_Y, 2):
						# Find the center of the screen
						center_lat, center_lng = num_to_deg(X + 1, Y + 1, zoom)
						center_alt = camera_altitude(center_lat)

						# Making PUT request
						data = json.dumps({'lat': center_lat, 'lng': center_lng, 'alt': center_alt})
						r = requests.put('http://localhost:8080', data = data)

						# Take and save screenshot
						screenshot = pyautogui.screenshot()
						screenshot.save(f"output/{X + 1}_{Y + 1}_{zoom}.png")

						time.sleep(0.5)

						print(f"Shot {n} of {total}")
						n = n + 1




