import math

TILE_SIZE = 256

# Tested via: https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
#     print mercator.get_lat_lng_world(41.850033, -87.65005229999997)
#     print mercator.get_lat_lng_pixel(41.850033, -87.65005229999997, 11)
#     print mercator.get_lat_lng_tile(41.850033, -87.65005229999997, 11)

def get_tile_box(zoom, x, y):
    """convert Google-style Mercator tile coordinate to
    (minlat, maxlat, minlng, maxlng) bounding box"""

    minlat, minlng = get_tile_lat_lng(zoom, x, y + 1)
    maxlat, maxlng = get_tile_lat_lng(zoom, x + 1, y)

    return (minlat, maxlat, minlng, maxlng)

def get_tile_lat_lng(zoom, x, y):
    """convert Google-style Mercator tile coordinate to
    (lat, lng) of top-left corner of tile"""

    # "map-centric" latitude, in radians:
    lat_rad = math.pi - 2*math.pi*y/(2**zoom)
    # true latitude:
    lat_rad = gudermannian(lat_rad)
    lat = lat_rad * 180.0 / math.pi

    # longitude maps linearly to map, so we simply scale:
    lng = -180.0 + 360.0*x/(2**zoom)

    return (lat, lng)

def get_lat_lng_world(lat, lng):
    """convert lat/lng to Google-style Mercator world coordinate (x, y)"""

    lat_rad = lat * math.pi / 180.0
    # "map-centric" latitude, in radians:
    lat_rad = inv_gudermannian(lat_rad)

    x = TILE_SIZE*(lng + 180.0) / 360.0
    y = TILE_SIZE*(math.pi - lat_rad) / (2 * math.pi)
    
    return (x, y)

def world_to_pixel(x, y, zoom):
    x = 2**zoom * x
    y = 2**zoom * y

    return (x, y)

def get_lat_lng_pixel(lat, lng, zoom):
    """convert lat/lng to Google-style Mercator tile coordinate (x, y)
    at the given zoom level"""

    (x, y) = get_lat_lng_world(lat, lng)

    return world_to_pixel(x, y, zoom)

def pixel_to_tile(x, y):
    return (x/TILE_SIZE, y/TILE_SIZE)

def get_lat_lng_tile(lat, lng, zoom):
    """convert lat/lng to Google-style Mercator tile coordinate (x, y)
    at the given zoom level"""

    (x, y) = get_lat_lng_pixel(lat, lng, zoom)

    return pixel_to_tile(x, y)

def gudermannian(x):
    return 2*math.atan(math.exp(x)) - math.pi/2

def inv_gudermannian(y):
    return math.log(math.tan((y + math.pi/2) / 2))
