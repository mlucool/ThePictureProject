__author__ = "Marc Udoff"
__license__ = "LGPL"
__version__ = "0.1"

import json, sys, os
import pprint
from datetime import datetime
import exifread # https://pypi.python.org/pypi/ExifRead
from dstk.dstk import DSTK
from mercator import mercator

dstk = DSTK() # data science tool kit - for geolocation info
PoliticTypesToCollect = ["city", "country"]

def add(self):
    """Read the contents of all pictures in a directory and save the output to data.json.
    Note: Only jpgs supported. Output file is not a pure JSON file, but one easy to load via javascript
    """

# EXIF string to google style lat,lng
def toCoordToDecimal(coord, invert):
    if coord is None:
        return None
    values = coord[1:-1].split(",")
    lastValue = values[2].split("/")
    if len(lastValue) > 2:
        print "Error in toCoordToDecimal: lastValue is unhandled: " + str(lastValue)
    ret = float(values[0]) + float(values[1])/60 + (float(lastValue[0])/float(lastValue[1] if len(lastValue) == 2 else 1))/3600
    if invert:
        ret *= -1
    return ret

# Get one tag from EXIF as string
def getTag(string, tags):
    val = tags.get(string, None)
    return str(val) if val is not None else None

# Helper function to debug issues
def printAllTags(tags):
    for tag in tags.keys():
        if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
            print "Key: %s, value %s" % (tag, tags[tag])
            
def createRecords(path, maxRecords):
    pp = pprint.PrettyPrinter(indent=3)

    skipped = 0
    data = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        i = 0
        for filename in filenames:      
            if not filename.lower().endswith("jpg"):
                continue
            if (i % 100) != 0:
                i += 1
                #continue
            i += 1
            dirname = os.path.basename(os.path.abspath(dirpath))
            print "Processing: " + dirname + " -> " + filename
            # Open image file for reading (binary mode)
            f = open(dirpath + "\\" + filename, 'rb')

            # Return Exif tags
            tags = exifread.process_file(f, details=False) # Ignore MarketNotes

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
            record = {"file": filename, "date": date.isoformat(), "lat": latDec, "lng": lngDec, "text": dirname}
            if alt is not None:
                record["alt"] = alt

            data.append(record)
            if(len(data) == maxRecords):
                break

        if(len(data) == maxRecords):
            break
            
    print "Found " + str(skipped + len(data)) + " pictures, of which " + str(len(data)) + " have gps coordinates\n"

    return data

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
                print "Could not find name in politic " + str(politic) + " for " +  filename
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
        print "getPolitics: for "  + filename + ". Unexpected error: " + sys.exc_info()[0]

    return info

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
        
        print mercator.get_lat_lng_tile(record["lat"], record["lng"], 20)
    
    # Print some summary info
    for nameType, names in politicNameSummary.iteritems():
        print str(len(names)) + " " + nameType
##        names = sorted([(value,key) for (key,value) in names.items()], reverse=True)
##        for nameVal in names:
##            print "  " + str(nameVal[1].encode('utf-8')) + ": " + str(nameVal[0])
        keys = sorted(names.keys())
        for key in keys:
            print "  " + str(key.encode('utf-8')) + ": " + str(names[key])
            
def cleanRecords(data):
    cleanRecords = []
    for record in data:
        # Get rid of some things that break JSON when loading in javascript
        cleanRecord = {key : item.translate(None, '\'\"') if type(item) is str else item for key, item in record.items()}
        cleanRecords.append(cleanRecord)
        
    # Sort in place by date
    cleanRecords.sort(key=lambda x: x["date"], reverse=False)
    
    return cleanRecords
     
if __name__ == '__main__':
    outputFile = "data.json"
##    if len(sys.argv) != 2:
##        print "Expected one agruement, got " + str(len(sys.argv)-1)
##        exit(1)
##    path = sys.argv[1]
    path = "C:\\Users\\Marc\\Desktop\\Cruise"
    #path = "F:\\Pictures\\Downloaded Albums\\115131001558224338921"
    print "Finding jpgs in all subdirs of " + path + "\n"
    maxRecords = sys.maxint
    #maxRecords = 10
    data = createRecords(path, maxRecords)
    supplementRecords(data)
    
    data = cleanRecords(data)
    
    # Write outfile as a json file wrapped with data =
    print "\nSaving " + str(len(data)) + " records to " + outputFile
    with open(outputFile, 'w') as outfile:
      outfile.write("data = \'" + json.dumps(data) + "\';")

