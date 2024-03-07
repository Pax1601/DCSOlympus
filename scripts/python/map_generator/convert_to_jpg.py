import sys
import os
import numpy

from PIL import Image
from concurrent import futures
from os import listdir
from os.path import isfile, isdir, join

# global counters
fut_counter = 0
tot_futs = 0

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

def remove_black_areas(im):
	data = numpy.array(im)  
	red, green, blue = data.T

	# If present, remove any "black" areas
	background_areas = (red < 10) & (blue < 10) & (green < 10)
	data[..., :][background_areas.T] = (221, 221, 221) 

	return Image.fromarray(data)
        
def convert_tiles(source, dest, tile):
    zoom = tile[0]
    X = tile[1]
    Y = tile[2]

    if not os.path.exists(os.path.join(dest, str(zoom))):
        try:
            os.mkdir(os.path.join(dest, str(zoom)))
        except FileExistsError:
            # Ignore this error, it means one other thread has already created the folder
            pass
        except Exception as e: 
            raise e
        
    if not os.path.exists(os.path.join(dest, str(zoom), str(X))):
        try:
            os.mkdir(os.path.join(dest,  str(zoom), str(X)))
        except FileExistsError:
            # Ignore this error, it means one other thread has already created the folder
            pass
        except Exception as e: 
            raise e

    remove_black_areas(Image.open(os.path.join(source, str(zoom), str(X), f"{Y}.png")).convert('RGB')).save(os.path.join(dest, str(zoom), str(X), f"{Y}.jpg"))

if len(sys.argv) < 3:
    print("Please provide a source and a destination folder")
else:
    source = sys.argv[1]
    dest = sys.argv[2]

    if not os.path.exists(dest):
        try:
            os.mkdir(dest)
        except FileExistsError:
            # Ignore this error, it means one other thread has already created the folder
            pass
        except Exception as e: 
            raise e

    print(f"Listing source tiles...")
    existing_tiles = []
    zooms = [int(f) for f in listdir(source) if isdir(join(source, f))]
    for zoom in zooms:
        Xs = [int(f) for f in listdir(join(source, str(zoom))) if isdir(join(source, str(zoom), f))]
        for X in Xs:
            Ys = [int(f.removesuffix(".png")) for f in listdir(os.path.join(source, str(zoom), str(X))) if isfile(join(source, str(zoom), str(X), f))]
            for Y in Ys:
                existing_tiles.append((zoom, X, Y))
    
    print(f"{len(existing_tiles)} tiles will be converted")

    # Merge the tiles with parallel thread execution
    with futures.ThreadPoolExecutor() as executor:
        print(f"Converting tiles to jpg...")
        print(f"Initializing exectuion pool")
        futs = [executor.submit(convert_tiles, source, dest, tile) for tile in existing_tiles]
        tot_futs = len(futs)
        fut_counter = 0
        [fut.add_done_callback(done_callback) for fut in futs]
        [fut.result() for fut in futures.as_completed(futs)]
