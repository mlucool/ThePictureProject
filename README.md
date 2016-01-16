# The Picture Project
A react project visualize/filter all your pictures on on google maps. It includes a parser to read EXIF GPS data then reverse geocode them to list countries. Clicking on the markers bring up the selected photo!

## Status
This works locally with many known bugs. Overall it does work enough. I have tested with ~25k pictures and it was slower than I would like, but worked.

## Running
Run the parser (```gulp build parser```) first. This is half the magic to making this scale. It  will pre-parse all your pictures EXIF data then generate a data.json.  The path is const picturesRootPath if you want to use your own pictures.  If you have too many pictures you won't get them all reverse-geoencoded as you'll voilate your provider's (default: google) limit. You can re-run reverse geoencoding with the updateData function over the course of a few days if you need to. Or pay for an API key. 

To use this in the project move the genrated data.json to ```assets/data``` along with your pictures (this assumes directories are albums and there are no sub-directories). 
Next copy the assets over ```gulp copy`` then run webpack-dev-server ```gulp webpack-dev-server``` and you're off!

## Known issues include
* No way to see multiple points at same location
* CSS issues
* Search could make some points that should appear not appear (due to agressive pre-data checks)
* Things without GPS data should be treated specially
* Lag on large data sets
* Testing on a real server
