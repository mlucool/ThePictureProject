/**
 * Created by Marc on 11/14/2015.
 */
/*global google*/
function loadScript(url, callback) {

    var script = document.createElement("script");
    script.type = "text/javascript";

    if (script.readyState) {//IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {//Others
        script.onload = function () {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

var map;
var gpsData, zoomCache; // Loaded JSON file of data
var dataLoaded;
var year;

var i;
var pinColors; // List of pin colors
var pinImage, pinShadow;

var infowindow;
var dropPinTimeout; // How often to drop next pin

function initialize() {
    var myLatlng = new google.maps.LatLng(28.4100805556, -80.6151741667);

    dataLoaded = false;
    year = 0;

    var mapOptions = {
        zoom: 2,
        center: myLatlng
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    google.maps.event.addListener(map, "bounds_changed", function () {
        // Reset plotting new points
        i = 0;
        window.clearInterval(dropPinTimeout);
        dropPinTimeout = setInterval(function () {
            dropPins2();
        }, timeout);
    });

    pinColors = ["FF0000", "E42CF5", "9E1AEB", "441AEB", "1AACEB", "13D695", "27D613", "FFF782", "F5A822", "FA5D2D", "FFFFFF"];

    infowindow = new google.maps.InfoWindow({
        content: "placeholder..."
    });

    var timeout = 500;
    loadScript("../data/data.json", function () {
        i = 0;
        // Ugly how we use data :(
        gpsData = JSON.parse(data); /*global data*/
        zoomCache = JSON.parse(zoomCache);
        dataLoaded = true;
        dropPinTimeout = setInterval(function () {
            dropPins2();
        }, timeout);
    });
}

function nextColor() {
    var pinColor = pinColors[year % pinColors.length];
    pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor, new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34));
    pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow", new google.maps.Size(40, 37), new google.maps.Point(0, 0), new google.maps.Point(12, 35));
}

function addPin(obj) {
    var myLatlng = new google.maps.LatLng(obj["lat"], obj["lng"]);
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        animation: google.maps.Animation.DROP,
        title: obj["album"] + ":" + obj["file"],
        icon: pinImage,
        shadow: pinShadow,
        gpsIndex: obj["idx"]
    });
    google.maps.event.addListener(marker, 'click', function () {
        var data = gpsData[this.gpsIndex];
        var date = new Date(data["date"]);
        infowindow.setContent(date.toDateString() + ": " + data["album"] + ": " + obj["file"] + "   " + obj["idx"]);
        infowindow.open(map, this);
    });
}

function dropPins2() {
    if (!dataLoaded) {
        return;
    }

    var idx;
    var zoom = map.getZoom();
    var useCache = zoom < zoomCache.length;
    var len = useCache ? zoomCache[zoom].length : gpsData.length;

    // Drop pins per year
    year = 0;
    if (i < len) {
        idx = useCache ? zoomCache[zoom][i] : i;
        year = new Date(gpsData[idx]["date"]).getFullYear();
    }

    nextColor();

    var bounds = map.getBounds();
    while (i < len) {
        idx = useCache ? zoomCache[zoom][i] : i;
        var obj = gpsData[idx];
        var date = new Date(obj["date"]);
        if (year != date.getFullYear()) {
            break;
        }
        if (!obj["added"]) {
            var myLatlng = new google.maps.LatLng(obj["lat"], obj["lng"]);
            if (bounds.contains(myLatlng)) {
                obj["idx"] = idx;
                addPin(obj);
                obj["added"] = true;
            }
        }
        // console.log(obj);
        i += 1;
    }
    if (i >= zoomCache[zoom].length) {
        window.clearInterval(dropPinTimeout);
    }
}

google.maps.event.addDomListener(window, 'load', initialize);