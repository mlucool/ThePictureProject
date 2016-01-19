/* eslint-disable no-console */
/**
 * Created by Marc on 1/2/2016.
 */

import 'babel-polyfill';

import Promise from 'bluebird';
import path from 'path';
import walk from 'walk';
import EXIF from 'exif-parser';
import mercator from 'mercator-projection';
import NodeGeocoder from 'node-geocoder';
import _ from 'underscore';
import co from 'co';

const fs = Promise.promisifyAll(require('fs'));

// FIXME: Move back to 17!
const MAX_ZOOM = 20; // Used for zoomCache
// Only need first 65635 bytes of file - EXIF data will be there
const MAX_READ_SIZE = 65635;

const GEOCODE_PROVIDER = 'google';
const geocoder = NodeGeocoder(GEOCODE_PROVIDER, 'https');
const records = [];
const MERCATOR_EXPONENTS = createMercatorExponentCache(MAX_ZOOM);
const totals = {
    reverseGeocoded: {success: 0, rejected: 0},
    missingCities: 0,
    missingCountries: 0,
    missingGPS: 0,
    missingDate: 0,
    albums: 0
};
const picturesRootPath = '../../../assets/data/pictures';
// Use one of these two
start();
//updateData(require('../../../assets/data/data.json').records);

function start() { // eslint-disable-line no-unused-vars
    const walker = walk.walk(picturesRootPath, {followLinks: false});
    walker.on('file', maybeAddFile);
    walker.on('errors', errorsHandler); // plural
    walker.on('end', postProcess.bind(this, {}));
}

// Create this once, its ok since we know this will wait till next before being called again
const buffer = new Buffer(65635);
function maybeAddFile(root, fileStat, next) {
    if (path.extname(fileStat.name).toUpperCase() === '.JPG') {
        const fileName = path.resolve(root, fileStat.name);
        let fileDescriptor = undefined;
        fs.openAsync(fileName, 'r')
            .then((fd) => {
                fileDescriptor = fd;
                const bytesToRead = Math.min(fileStat.size, MAX_READ_SIZE);
                return fs.readAsync(fd, buffer, 0, bytesToRead, null);
            })
            .then(function createRecord(/* bytesRead */) {
                // There is other cool data in here I might want to parse one day
                // e.g. ISO, GPSSatellites, etc.
                const exifData = EXIF.create(buffer).parse();
                const tags = exifData.tags;
                const record = {};
                record.album = path.relative(picturesRootPath, root);
                record.file = fileStat.name;
                let date = tags.DateTimeOriginal;
                if (date > 0) {
                    // s -> ms
                    record.date = new Date(date * 1000);
                } else {
                    if (!fileStat.mtime) {
                        totals.missingDate += 1;
                        throw new Error('Missing date!');
                    }
                    record.date = fileStat.mtime;
                }
                record.alt = tags.GPSAltitude;
                record.lat = tags.GPSLatitude;
                record.lng = tags.GPSLongitude;
                if (!record.lat || !record.lng) {
                    totals.missingGPS += 1;
                } else {
                    const {x, y} = mercator.fromLatLngToPoint({lat: record.lat, lng: record.lng});
                    record.world = [x, y];
                }
                records.push(record);
                if (records.length % 100 === 0) {
                    updateParsedLog();
                }

                return fs.closeAsync(fileDescriptor);
            })
            .catch((error) => {
                console.log('Error processing ' + fileName + ': ' + error);
            })
            .finally(()=> next());
    } else {
        return next();
    }
}

function errorsHandler(root, nodeStatsArray, next) {
    nodeStatsArray.forEach(function (n) {
        console.error('[ERROR] ' + n.name);
        console.error(n.error.message || (n.error.code + ': ' + n.error.path));
    });
    next();
}

function reverseGeocode(forceGetGeo = false) {
    // We need to do this because otherwise we spawn
    // records.length http requests, which is very bad
    return co(function *() {
        const geoResults = [];
        for (let i = 0; i < records.length; ++i) {
            const record = records[i];
            if (!forceGetGeo && Object.keys(record.politics || {}).length !== -0) {
                continue;
            }
            try {
                const res = yield geocoder.reverse({lat: record.lat, lon: record.lng});
                totals.reverseGeocoded.success += 1;
                if (totals.reverseGeocoded.success % 100 === 0) {
                    console.log('Got GPS data for ' + totals.reverseGeocoded.success + ' pictures');
                }
                geoResults.push({data: res});
            } catch (err) {
                totals.reverseGeocoded.rejected += 1;
                console.log('Error finding data for: ' + description(record) + ': ' + err);
                geoResults.push({error: err});
            }
        }
        return geoResults;
    });
}

function parseReverseGeocode(georesults) {
    const TODAY = new Date();
    georesults.forEach((georesult, i) => {
        let result = georesult.data || {};
        result = result[0] || {};
        const record = records[i];
        if (!result.country) {
            totals.missingCountries += 1;
            console.log('Could not find country for ' + description(record));
        }
        if (!result.city) {
            totals.missingCities += 1;
            console.log('Could not find city for ' + description(record));
        }
        record.politics = {country: result.country, city: result.city};

        record.reverseGeocode = {
            provider: GEOCODE_PROVIDER,
            processed: TODAY,
            ...georesult // Expected data: or error:
        }
    });
}

function getSummaryStore(base = {}) {
    return _.extend({
        zoomCache: _.range(MAX_ZOOM).map(()=> []),
        noGPS: [],
        boundingBox: {},
        records: []
    }, base);
}
function makeUsefulCaches(albums, countries) {
    // This is the final ordering
    records.sort(function byDate(a, b) {
        return a.date - b.date;
    });

    // Add to album
    records.forEach(function createAlbums(record, idx) {
        record.id = idx;

        // Update Album
        let album = albums[record.album];
        if (!album) {
            album = getSummaryStore();
            albums[record.album] = album;
        }
        album.records.push(idx);
        updateBoundingBox(album.boundingBox, record);

        // Update politics
        if (record.politics) {
            if (record.politics.country) {
                let country = countries[record.politics.country] || getSummaryStore();
                let city = record.politics.city || 'nocity';
                if (country[city]) {
                    country[city].push(idx);
                } else {
                    country[city] = [idx];
                }
                country.records.push(idx);
                updateBoundingBox(country.boundingBox, record);
                countries[record.politics.country] = country;
            } else {
                console.log('makeUsefulCaches ERROR: no country found for something with politics '
                    + JSON.stringify(record));
            }
        }
    });

    // Create zoomCache
    _.values(albums).forEach(album => album.records.forEach(maybeAddToCache(album)));
    _.values(countries).forEach(country => country.records.forEach(maybeAddToCache(country)));
}

function logAndWriteData(albums, countries) {
    totals.totalRecords = records.length;
    totals.albums = Object.keys(albums).length;
    totals.countries = Object.keys(countries).length;
    const data = {records: records.map(r => _.omit(r, 'reverseGeocode')), albums, countries};
    fs.writeFileSync('records.json', JSON.stringify(records, null, 2), 'utf8');
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('Finished!\n' + JSON.stringify(totals, null, 2));
}


function postProcess({skipGeo = false, forceGetGeo = false}) {
    updateParsedLog();

    const albums = {};
    const countries = {};

    if (skipGeo) {
        makeUsefulCaches(albums, countries);
        logAndWriteData(albums, countries);
    } else {
        reverseGeocode(forceGetGeo).then((georesults) => {
            parseReverseGeocode(georesults);
            makeUsefulCaches(albums, countries);
            logAndWriteData(albums, countries);
        }).catch(error => {
            console.log(error.stack || error);
        })
    }
}

function updateData(recordsToUse) { // eslint-disable-line no-unused-vars
    _.forEach(recordsToUse, record => records.push(record));

    postProcess({forceGetGeo: false});
}

function maybeAddToCache(owner) {
    return function (idx) {
        const record = records[idx];
        if (!record.world) {
            owner.noGPS.push(idx);
            return;
        }
        for (let zoom = 0; zoom < MAX_ZOOM; ++zoom) {
            if (owner.zoomCache[zoom].length === 0) {
                owner.zoomCache[zoom].push(idx);
                continue;
            }
            const pixel = mercatorToPixel(record.world, zoom);
            const prevRecord = records[_.last(owner.zoomCache[zoom])];
            const prevPixel = mercatorToPixel(prevRecord.world, zoom);
            const d = dist(pixel, prevPixel);
            // Decide if we should add here, for now 10px min between points
            if (d > 10) {
                owner.zoomCache[zoom].push(idx);
            }
        }
    }
}

function createMercatorExponentCache() {
    const exp = [];
    for (let zoom = 0; zoom < MAX_ZOOM; ++zoom) {
        exp.push(Math.pow(2, zoom));
    }
    return exp;
}
function dist(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}
function mercatorToPixel(world, zoom) {
    // [2^zoom * x, 2^zoom * y]
    return [world[0] * MERCATOR_EXPONENTS[zoom], world[1] * MERCATOR_EXPONENTS[zoom]];
}
function description(record) {
    return '"' + record.album + '/' + record.file + '"';
}
function updateParsedLog() {
    console.log('Parsed ' + records.length + ' pictures');
}
function updateBoundingBox(box, record) {
    const lat = record.lat;
    const lng = record.lng;
    if (!lat || !lng) {
        return;
    }
    if (!box.minLng) {
        box.minLat = lat;
        box.maxLat = lat;

        box.minLng = lng;
        box.maxLng = lng;
    } else {
        box.minLat = Math.min(box.minLat, lat);
        box.maxLat = Math.max(box.maxLat, lat);

        box.minLng = Math.min(box.minLng, lng);
        box.maxLng = Math.max(box.maxLng, lng);
    }
}
