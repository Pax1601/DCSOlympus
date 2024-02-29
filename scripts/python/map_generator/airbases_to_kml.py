import sys
from fastkml import kml
from pygeoif.geometry import Polygon
import json
import math

# constants
C = 40075016.686                # meters, Earth equatorial circumference
R = C / (2 * math.pi)           # meters, Earth equatorial radius
W = 10000                       # meters, size of the square around the airbase

if len(sys.argv) == 1:
    print("Please provide a json file as first argument. You can also drop the json file on this script to run it.")
else:
    input_file = sys.argv[1]
    k = kml.KML()
    ns = '{http://www.opengis.net/kml/2.2}'

    d = kml.Document(ns, 'docid', 'doc name', 'doc description')
    k.append(d)

    with open(input_file) as jp:
        j = json.load(jp)
        
        for point in j['airbases'].values():
            p = kml.Placemark(ns, 'id', 'name', 'description')
            lat = point['latitude']
            lng = point['longitude']

            latDelta = math.degrees(W / R)
            lngDelta = math.degrees(W / (R * math.cos(math.radians(lat))))

            p.geometry = Polygon([(lng - lngDelta, lat - latDelta), (lng - lngDelta, lat + latDelta), (lng + lngDelta, lat + latDelta), (lng + lngDelta, lat - latDelta)])
            d.append(p)

        with open(input_file.removesuffix('.json')+'.kml', 'w') as kp:
            kp.writelines(k.to_string(prettyprint=True))