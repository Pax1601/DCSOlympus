import math
import re

from data.data_types import LatLng


NATO_TO_LETTER = {
    "alpha": "A", "bravo": "B", "charlie": "C", "delta": "D", "echo": "E", "foxtrot": "F",
    "golf": "G", "hotel": "H", "india": "I", "juliett": "J", "kilo": "K", "lima": "L",
    "mike": "M", "november": "N", "oscar": "O", "papa": "P", "quebec": "Q", "romeo": "R",
    "sierra": "S", "tango": "T", "uniform": "U", "victor": "V", "whiskey": "W", "xray": "X",
    "yankee": "Y", "zulu": "Z"
}
LETTER_TO_NATO = {value: key for key, value in NATO_TO_LETTER.items()}
WORD_TO_DIGIT = {
    "zero": "0", "oh": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "niner": "9"
}

MGRS_COLUMN_SETS = ("ABCDEFGH", "JKLMNPQR", "STUVWXYZ")
MGRS_ROW_LETTERS = "ABCDEFGHJKLMNPQRSTUV"

WGS84_A = 6378137.0
WGS84_F = 1 / 298.257223563
WGS84_E2 = WGS84_F * (2 - WGS84_F)
WGS84_E2_PRIME = WGS84_E2 / (1 - WGS84_E2)
UTM_K0 = 0.9996


def format_grid_for_readback(text: str) -> str:
    match = re.search(r"\b([A-Za-z]{2})\s*(\d{4})\s*(\d{4})\b", text.strip())
    if not match:
        return ""

    letters, easting, northing = match.groups()
    phonetic_letters = [LETTER_TO_NATO[letter] for letter in letters.upper()]
    digits = list(easting + northing)
    return " ".join(phonetic_letters + digits)


def extract_mgrs_100k(text: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", text.lower())

    normalized = []
    for token in tokens:
        if token in NATO_TO_LETTER:
            normalized.append(NATO_TO_LETTER[token])
        elif token in WORD_TO_DIGIT:
            normalized.append(WORD_TO_DIGIT[token])
        elif token.isdigit():
            normalized.append(token)

    merged = "".join(normalized)
    match = re.search(r"([A-Z]{2})(\d{4})(\d{4})", merged)
    if not match:
        return ""

    letters, easting, northing = match.groups()
    return f"{letters} {easting} {northing}"


def utm_zone_from_longitude(longitude: float) -> int:
    return int((longitude + 180) // 6) + 1


def latlng_to_utm(lat: float, lng: float, zone_number: int):
    lat_rad = math.radians(lat)
    lng_rad = math.radians(lng)
    central_meridian = math.radians((zone_number - 1) * 6 - 180 + 3)

    sin_lat = math.sin(lat_rad)
    cos_lat = math.cos(lat_rad)
    tan_lat = math.tan(lat_rad)

    n = WGS84_A / math.sqrt(1 - WGS84_E2 * sin_lat * sin_lat)
    t = tan_lat * tan_lat
    c = WGS84_E2_PRIME * cos_lat * cos_lat
    a = cos_lat * (lng_rad - central_meridian)

    m = WGS84_A * (
        (1 - WGS84_E2 / 4 - 3 * (WGS84_E2 ** 2) / 64 - 5 * (WGS84_E2 ** 3) / 256) * lat_rad
        - (3 * WGS84_E2 / 8 + 3 * (WGS84_E2 ** 2) / 32 + 45 * (WGS84_E2 ** 3) / 1024) * math.sin(2 * lat_rad)
        + (15 * (WGS84_E2 ** 2) / 256 + 45 * (WGS84_E2 ** 3) / 1024) * math.sin(4 * lat_rad)
        - (35 * (WGS84_E2 ** 3) / 3072) * math.sin(6 * lat_rad)
    )

    easting = UTM_K0 * n * (
        a
        + (1 - t + c) * (a ** 3) / 6
        + (5 - 18 * t + t * t + 72 * c - 58 * WGS84_E2_PRIME) * (a ** 5) / 120
    ) + 500000.0

    northing = UTM_K0 * (
        m
        + n * tan_lat * (
            (a ** 2) / 2
            + (5 - t + 9 * c + 4 * c * c) * (a ** 4) / 24
            + (61 - 58 * t + t * t + 600 * c - 330 * WGS84_E2_PRIME) * (a ** 6) / 720
        )
    )

    if lat < 0:
        northing += 10000000.0

    return easting, northing


def utm_to_latlng(zone_number: int, easting: float, northing: float, southern_hemisphere: bool):
    x = easting - 500000.0
    y = northing - (10000000.0 if southern_hemisphere else 0.0)

    central_meridian = math.radians((zone_number - 1) * 6 - 180 + 3)

    m = y / UTM_K0
    mu = m / (WGS84_A * (1 - WGS84_E2 / 4 - 3 * (WGS84_E2 ** 2) / 64 - 5 * (WGS84_E2 ** 3) / 256))

    e1 = (1 - math.sqrt(1 - WGS84_E2)) / (1 + math.sqrt(1 - WGS84_E2))

    j1 = 3 * e1 / 2 - 27 * (e1 ** 3) / 32
    j2 = 21 * (e1 ** 2) / 16 - 55 * (e1 ** 4) / 32
    j3 = 151 * (e1 ** 3) / 96
    j4 = 1097 * (e1 ** 4) / 512

    fp = mu + j1 * math.sin(2 * mu) + j2 * math.sin(4 * mu) + j3 * math.sin(6 * mu) + j4 * math.sin(8 * mu)

    sin_fp = math.sin(fp)
    cos_fp = math.cos(fp)
    tan_fp = math.tan(fp)

    c1 = WGS84_E2_PRIME * (cos_fp ** 2)
    t1 = tan_fp * tan_fp
    n1 = WGS84_A / math.sqrt(1 - WGS84_E2 * (sin_fp ** 2))
    r1 = WGS84_A * (1 - WGS84_E2) / ((1 - WGS84_E2 * (sin_fp ** 2)) ** 1.5)
    d = x / (n1 * UTM_K0)

    lat_rad = fp - (n1 * tan_fp / r1) * (
        (d ** 2) / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * (c1 ** 2) - 9 * WGS84_E2_PRIME) * (d ** 4) / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * (t1 ** 2) - 252 * WGS84_E2_PRIME - 3 * (c1 ** 2)) * (d ** 6) / 720
    )

    lon_rad = central_meridian + (
        d
        - (1 + 2 * t1 + c1) * (d ** 3) / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * (c1 ** 2) + 8 * WGS84_E2_PRIME + 24 * (t1 ** 2)) * (d ** 5) / 120
    ) / cos_fp

    return math.degrees(lat_rad), math.degrees(lon_rad)


def mgrs_100k_to_latlng(mgrs_grid: str, reference_position: LatLng):
    match = re.fullmatch(r"\s*([A-Za-z]{2})\s*(\d{4,5})\s*(\d{4,5})\s*", mgrs_grid)
    if not match:
        return None

    letters = match.group(1).upper()
    easting_digits = match.group(2)
    northing_digits = match.group(3)

    if len(easting_digits) != len(northing_digits):
        return None

    zone_number = utm_zone_from_longitude(reference_position.lng)
    set_number = zone_number % 6 or 6
    column_set = MGRS_COLUMN_SETS[(set_number - 1) % 3]

    col_index = column_set.find(letters[0])
    row_index_raw = MGRS_ROW_LETTERS.find(letters[1])
    if col_index < 0 or row_index_raw < 0:
        return None

    easting_100k = (col_index + 1) * 100000

    row_shift = 0 if set_number in (1, 3, 5) else 5
    row_index = (row_index_raw - row_shift) % 20
    northing_100k = row_index * 100000

    scale = 10 ** (5 - len(easting_digits))
    easting = easting_100k + int(easting_digits) * scale
    northing = northing_100k + int(northing_digits) * scale

    _, reference_northing = latlng_to_utm(reference_position.lat, reference_position.lng, zone_number)
    northing_candidates = [northing + 2000000 * idx for idx in range(0, 6)]
    best_northing = min(northing_candidates, key=lambda candidate: abs(candidate - reference_northing))

    southern_hemisphere = reference_position.lat < 0
    lat, lng = utm_to_latlng(zone_number, easting, best_northing, southern_hemisphere)
    return LatLng(lat, lng, reference_position.alt)