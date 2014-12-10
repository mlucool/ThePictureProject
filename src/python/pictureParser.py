__author__ = "Marc Udoff"
__license__ = "LGPL"
__version__ = "0.1"

import json, sys, os
from datetime import datetime
import exifread # https://pypi.python.org/pypi/ExifRead

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
def printAll(tags):
    for tag in tags.keys():
        if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
            print "Key: %s, value %s" % (tag, tags[tag])
                    
def createRecords(path):
    skipped = 0
    data = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:      
            if not filename.lower().endswith("jpg"):
                continue
            dirname = os.path.basename(os.path.abspath(dirpath))
            print "Processing: " + dirname + " -> " + filename
            # Open image file for reading (binary mode)
            f = open(dirpath + "\\" + filename, 'rb')

            # Return Exif tags
            tags = exifread.process_file(f, details=False) # Ignore MarketNotes

            # printAll(tags)

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
                    printAll(tags)
                    skipped += 1

            # EXIF to google style lat,lng
            latDec = toCoordToDecimal(lat, latRef == "S")
            lngDec = toCoordToDecimal(lng, lngRef == "W")
            if latDec is None or lngDec is None:
                print "No GPS data"
                skipped += 1
                continue
            
            print date.isoformat() + " (" + str(latDec) + "," + str(lngDec) + ")"
            record = {"file": filename, "date": date.isoformat(), "lat": latDec, "lng": lngDec, "alt": alt, "text": dirname}
            # Get rid of some things that break JSON when loading in javascript
            cleanRecord = {key : item.translate(None, '\'\"') if type(item) is str else item for key, item in record.items()}
            data.append(cleanRecord)
    print "Found " + str(skipped + len(data)) + " pictures, of which " + str(len(data)) + " have gps coordinates"
    return data

if __name__ == '__main__':
    outputFile = "data.json"
    if len(sys.argv) != 2:
        print "Expected one agruement, got " + str(len(sys.argv)-1)
        exit(1)
    path = sys.argv[1]
    print "Finding jpgs in all subdirs of " + path + "\n"
    data = createRecords(path)
    # Sort in place by date
    data.sort(key=lambda x: x["date"], reverse=False)
    # Write outfile as a json file wrapped with data =
    print "\nSaving " + str(len(data)) + " records to " + outputFile
    with open(outputFile, 'w') as outfile:
      outfile.write("data = \'" + json.dumps(data) + "\';")

