import os
from PIL import Image
import concurrent.futures

zoom = 16
path = "output"

def crop_image(filename):
    img = Image.open(os.path.join(path, filename))
    center_X, center_Y = filename.removesuffix(".png").split("_")
    center_X = int(center_X)
    center_Y = int(center_Y)
    w, h = img.size

    box_top_left =      (w / 2 - 256,   h / 2 - 256,    w / 2,          h / 2)
    box_top_right =     (w / 2,         h / 2 - 256,    w / 2 + 256,    h / 2)
    box_bottom_left =   (w / 2 - 256,   h / 2,          w / 2,          h / 2 + 256)
    box_bottom_right =  (w / 2,         h / 2,          w / 2 + 256,    h / 2 + 256)

    if not os.path.exists(f"output/{zoom}/{center_X - 1}"):
        os.mkdir(f"output/{zoom}/{center_X - 1}")

    if not os.path.exists(f"output/{zoom}/{center_X}"):
        os.mkdir(f"output/{zoom}/{center_X}")

    img.crop(box_top_left).save(f"output/{zoom}/{center_X - 1}/{center_Y - 1}.png")
    img.crop(box_top_right).save(f"output/{zoom}/{center_X}/{center_Y - 1}.png")
    img.crop(box_bottom_left).save(f"output/{zoom}/{center_X - 1}/{center_Y}.png")
    img.crop(box_bottom_right).save(f"output/{zoom}/{center_X}/{center_Y}.png")

    return True

filenames = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]

# Create output folder
if not os.path.exists(f"output/{zoom}"):
	os.mkdir(f"output/{zoom}")

with concurrent.futures.ThreadPoolExecutor() as executor:
    futures = [executor.submit(crop_image, filename) for filename in filenames]
    results = [future.result() for future in concurrent.futures.as_completed(futures)]