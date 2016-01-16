__author__ = "Marc Udoff"
__license__ = "LGPL"
__version__ = "0.1"

import json, sys, os
import pprint
from math import sqrt
from datetime import datetime, timedelta
import exifread  # https://pypi.python.org/pypi/ExifRead
from dstk.dstk import DSTK
from mercator import mercator

import ast

dstk = DSTK()  # data science tool kit - for geolocation info
PoliticTypesToCollect = ["city", "country"]

def add(self):
    """Read the contents of all pictures in a directory and save the output to data.json.
    Note: Only jpgs supported. Output file is not a pure JSON file, but one easy to load via javascript
    There are two fields in the output, data, the raw data, and zoomCache - a precomputed cache to figure out which points to draw
    
    
    WARNING: This mostly works, but there is a known bug where not all data points are showing up when zoomed all the way in.
    If you do not care about preformace, you can just remove anything that uses the cache in the javascript
    """

""" EXIF string to google style lat,lng """
def toCoordToDecimal(coord, invert):
    if coord is None:
        return None
    values = coord[1:-1].split(",")
    lastValue = values[2].split("/")
    if len(lastValue) > 2:
        print "Error in toCoordToDecimal: lastValue is unhandled: " + str(lastValue)
    ret = float(values[0]) + float(values[1]) / 60 + (float(lastValue[0]) / float(lastValue[1] if len(lastValue) == 2 else 1)) / 3600
    if invert:
        ret *= -1
    return ret

""" Get one tag from EXIF as string """
def getTag(string, tags):
    val = tags.get(string, None)
    return str(val) if val is not None else None

""" Helper function to debug issues """
def printAllTags(tags):
    for tag in tags.keys():
        if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
            print "Key: %s, value %s" % (tag, tags[tag])
            
def createRecords(path, maxRecords, sampleEvery):
    pp = pprint.PrettyPrinter(indent=3)

    skipped = 0
    data = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        i = 0
        for filename in filenames:      
            if not filename.lower().endswith("jpg"):
                continue
            if (i % sampleEvery) != 0:
                i += 1
                continue
            i += 1
            dirname = os.path.basename(os.path.abspath(dirpath))
            print "Processing: " + dirname + " -> " + filename
            # Open image file for reading (binary mode)
            f = open(dirpath + "\\" + filename, 'rb')

            # Return Exif tags
            tags = exifread.process_file(f, details=False)  # Ignore MarketNotes

            # printAllTags(tags)

            # Load tags from EXIF
            lat = getTag("GPS GPSLatitude", tags)
            latRef = getTag("GPS GPSLatitudeRef", tags)
            lng = getTag("GPS GPSLongitude", tags)
            lngRef = getTag("GPS GPSLongitudeRef", tags)
            alt = getTag("GPS GPSAltitude", tags)
            date = getTag("EXIF DateTimeOriginal", tags)
            
            if date is not None:
                try:
                    # e.g. 2014:02:16 12:50:15
                    date = datetime.strptime(date, "%Y:%m:%d %H:%M:%S")
                except ValueError:
                    print "Error parsing date: " + date
                    date = None
            # No EXIF or failed to parse
            if date is None:
                # Use modified date
                date = datetime.fromtimestamp(os.path.getctime(dirpath + "\\" + filename))
                if date is not None:
                    print "Using creation date (no EXIF date)"
                else:
                    print "Error finding date for " + filename + " skipping!"
                    printAllTag(tags)
                    skipped += 1

            # EXIF to google style lat,lng
            latDec = toCoordToDecimal(lat, latRef == "S")
            lngDec = toCoordToDecimal(lng, lngRef == "W")
            if latDec is None or lngDec is None:
                print "No GPS data"
                skipped += 1
                continue
            
            print date.isoformat() + " (" + str(latDec) + "," + str(lngDec) + ")"
            record = {"file": filename, "date": date, "lat": latDec, "lng": lngDec, "album": dirname}
            if alt is not None:
                record["alt"] = alt

            data.append(record)
            if(len(data) == maxRecords):
                break

        if(len(data) == maxRecords):
            break
            
    print "Found " + str(skipped + len(data)) + " pictures, of which " + str(len(data)) + " have gps coordinates\n"

    return data

""" Get some intresting info about each datapoint """
def getPolitics(filename, lat, long):
    info = {}
    try:
        politics = dstk.coordinates2politics([lat, long])
        if len(politics) == 0:
            print "Found no politics in " + filename + "!"
        if len(politics) > 1:
            print "Found multiple politics, using first in array for " + filename
        politics = politics[0].get("politics", {})
        if politics is None:
            print "Could not find any politics for " + filename
            return info
        for politic in politics:
            nameType = politic.get("friendly_type")
            if nameType is None:
                print "Could not find friendly_type in politic " + str(politic) + " for " + filename 
                continue
            if nameType not in PoliticTypesToCollect:
                continue
            name = politic.get("name")
            if name is None:
                print "Could not find name in politic " + str(politic) + " for " + filename
                continue

            # So this is ugly since the logic is fuzzy. To clean up bad cities, we use less spaces is likely more accurate (cities are often 1 word)
            # This may be slighly worse for coutnries though :/
            if nameType in info:
                oldName = info[nameType]
                print "Found second name " + name + " as well as " + oldName + " for " + filename
                if name.count(' ') < oldName.count(' '):
                    info[nameType] = name
            else:
                info[nameType] = name

        if len(info) == 0:
            print "Could not find any useful politics for " + filename
    except IOError as e:
            print "IOError with dstk.coordinates2politics.Maybe too many requests? You can try setting up your own host. Filename: {0}. I/O error({1}): {2}".format(filename, e.errno, e.strerror)
    except:
        print "getPolitics: for " + filename + ". Unexpected error: " + sys.exc_info()[0]

    return info

""" Add useful information based off the gps data to each datapoint """
def supplementRecords(records):
    politicNameSummary = {}
    for nameType in PoliticTypesToCollect:
        politicNameSummary[nameType] = {}
        
    for record in records:
        politics = getPolitics(record["file"], record["lat"], record["lng"])
        if len(politics) > 0:
            record["politics"] = politics
            
        for nameType, name in politics.iteritems():
            num = politicNameSummary[nameType].get(name, 0)
            politicNameSummary[nameType][name] = num + 1
        
        record["world"] = mercator.get_lat_lng_world(record["lat"], record["lng"])
    
    print "\nFound:"
    # Print some summary info
    for nameType, names in politicNameSummary.iteritems():
        print str(len(names)) + " " + nameType
        keys = sorted(names.keys())
        for key in keys:
            print "  " + str(key.encode('utf-8')) + ": " + str(names[key])

def sortRecords(data):
    # Sort in place by date
    data.sort(key=lambda x: x["date"], reverse=False)
    
""" Get rid of some things that break JSON when loading in javascript """
def cleanRecord(record):
    if type(record) is unicode:
        return record.encode('utf-8').translate(None, '\'\"')
    elif type(record) is str:
        return record.translate(None, '\'\"')
    elif type(record) is dict:
        return {key : cleanRecord(item) for key, item in record.items()}
    
    return record
                 
def toJavascriptSafeRecords(data):
    cleanRecords = []
    for record in data:
        record["date"] = record["date"].isoformat()
        cleanRecords.append(cleanRecord(record))
    
    return cleanRecords

def dist(p1, p2):
    return sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

"""This function is what makes having 10s or 100s of thousands of pictures (pins) on the map still be scalable
It uses the mercator projection to figure out if two points are close enough on the google map to coalesce into one pin
We project to a world pixel and if its the same, we can use just one pin (assuming asme album)
This uses the huriestic that pictures in the same album are likely taken very close together
For a deeper understanding see: https://developers.google.com/maps/documentation/javascript/maptypes#MapCoordinates """
def precreateZoomData(data):
    MAX_ZOOM = 17
    MAX_TIME_DELTA = timedelta(days=365)
    zoomCache = [None] * MAX_ZOOM
        
    for i in range(0, len(data)):
        record = data[i]
        world = record["world"]
        for zoom in range(0, MAX_ZOOM):
            if i == 0:
                zoomCache[zoom] = [0]
                continue

            pixels = mercator.world_to_pixel(world[0], world[1], zoom)
            prev = data[zoomCache[zoom][-1]]
            prevPixels = mercator.world_to_pixel(prev["world"][0], prev["world"][1], zoom)
            d = dist(pixels, prevPixels)
            if d > 10 or prev["album"] != record["album"] or record["date"] - prev["date"] > MAX_TIME_DELTA:
                zoomCache[zoom].append(i)        

    return zoomCache

"""Reload a file to help debug or add more data later"""
def loadDataJson(filename):
    with open("data.json", 'r') as f:
        line = f.readline()
        data = json.loads(line[len("data = \'"):-len(" \';")])
        line = f.readline()
        zoomCache = ast.literal_eval(line[len("zoomCache = \'"):-len("\';")])
        
        for datum in data:
            # Parse dates back in
            if "date" in datum:
                datum["date"] = datetime.strptime(datum["date"], "%Y-%m-%dT%H:%M:%S")

        # Return all data
        return (data, zoomCache)
    return (None, None)

if __name__ == '__main__':
    # TODO: Add code to ArgParse this all via commandline
    # Use this to debug/not parse all your picutres again
    filename = None
    # Use this to hard code a path to parse
    path = "F:\\Pictures\\Downloaded Albums\\115131001558224338921"

    outputFile = "data.json"
    if path is None and filename is None:
        if len(sys.argv) != 2:
            print "Expected one agruement, got " + str(len(sys.argv) - 1)
            exit(1)
            path = sys.argv[1]
    
    if filename is None:
        # TODO: Make this settable via command line
        maxRecords = sys.maxint
        sampleEvery = 1  # Sample every sampleEvery per folder
    
        # Parse data from files
        data = createRecords(path, maxRecords, sampleEvery)
        
        # Now that we have the basic data, let's enrich it
        # These are done before the records are cleaned so that we don't have to convert the data types twice
        # Also we may need to clean these up too
        supplementRecords(data)
        sortRecords(data)
        zoomCache = precreateZoomData(data)
    else:
        (data, zoomCache) = loadDataJson(filename)
        print len(data)
        # Do something here to update or fix records

    data = toJavascriptSafeRecords(data)

    # Write outfile as a file wrapped two json objects data and zoomCache
    print "\nSaving " + str(len(data)) + " records to " + outputFile
    with open(outputFile, 'w') as outfile:
      outfile.write("data = \'" + json.dumps(data) + "\';")
      outfile.write("\n")
      outfile.write("zoomCache = \'" + json.dumps(zoomCache) + "\';")

