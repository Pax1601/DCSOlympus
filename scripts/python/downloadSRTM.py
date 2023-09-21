import math
import urllib.request 
import os
import multiprocessing

try:
    os.mkdir("hgt")
except Exception as e:
    print(e)

def download_file(latlng):
    lat = latlng[0]
    lng = latlng[1]

    if lat < 0:
        lat = f"S{abs(lat):02}"
    else:
        lat = f"N{lat:02}"

    if lng < 0:
        lng = f"W{abs(lng):03}"
    else:
        lng = f"E{lng:03}"

    url = f"https://srtm.fasma.org/{lat}{lng}.SRTMGL3S.hgt.zip"
    urllib.request.urlretrieve(url, f"hgt/{lat}{lng}.SRTMGL3S.hgt.zip")
    print(f"{url} downloaded")

boundaries = [ 
    [    # NTTR
       39.7982463, -119.985425,
       34.4037128, -119.7806729,
       34.3483316, -112.4529351,
       39.7372411, -112.1130805,
       39.7982463, -119.985425
    ],
    [   # Syria
       37.3630556, 29.2686111,
       31.8472222, 29.8975,
       32.1358333, 42.1502778,
       37.7177778, 42.3716667,
       37.3630556, 29.2686111
    ],
    [   # Caucasus
       39.6170191, 27.634935,
       38.8735863, 47.1423108,
       47.3907982, 49.3101946,
       48.3955879, 26.7753625,
       39.6170191, 27.634935
    ],
    [   # Persian Gulf
       32.9355285, 46.5623682,
       21.729393, 47.572675,
       21.8501348, 63.9734737,
       33.131584, 64.7313594,
       32.9355285, 46.5623682
    ],
    [   # Marianas
       22.09, 135.0572222,
       10.5777778, 135.7477778,
       10.7725, 149.3918333,
       22.5127778, 149.5427778,
       22.09, 135.0572222
    ]
]

latlngs = []
if __name__ == '__main__':
    pool = multiprocessing.Pool(32)
    for boundary_set in boundaries:
        lats = [boundary_set[i] for i in range(0, len(boundary_set), 2)]
        lngs = [boundary_set[i] for i in range(1, len(boundary_set), 2)]
        minLat = math.floor(min(lats))
        minLng = math.floor(min(lngs))
        maxLat = math.ceil(max(lats))
        maxLng = math.ceil(max(lngs))

        index = 1
        for lat in range(minLat, maxLat + 1):
            for lng in range(minLng, maxLng + 1):
                latlngs.append((lat, lng))

    print(len(latlngs))
    #pool.map(download_file, latlngs)
    
            