/* eslint-disable no-console*/
// FIXME: The above rule is just for now and should be removed
import * as consts from '../actions/consts'
import {Set, fromJS} from 'immutable';
import moment from 'moment';
import rbush from 'rbush'; // Helps with performance when there is lots of data
import _ from 'underscore';
import mercator from 'mercator-projection';

const mydata = require('json!../../../data/data.json');

function defaultState() {
    const NOTSET = 'NOT SET';
    mydata.countries[NOTSET] = {nocity: []};
    mydata.records.forEach(function (element, index) {
        if (element.date) {
            element.date = new Date(element.date);
        }
        if (!element.politics.country) {
            element.politics.country = NOTSET;
            mydata.countries[NOTSET].nocity.push(index);
        }
    });

    const filters = {
        date: {min: undefined, max: undefined},
        selected: undefined,
        albums: new Set(Object.keys(mydata.albums)), // Strings
        countries: new Set(Object.keys(mydata.countries)), // Strings
        text: ''
    };

    if (mydata.records && mydata.records.length > 0) {
        filters.date.min = moment(mydata.records[0].date).startOf('day').toDate();
        filters.date.max = moment(mydata.records[mydata.records.length - 1].date).endOf('day').toDate();
    }
    // We store the mercator projections: it helps simplify the world wrapping problem by making it easy to reason about
    // Only positive numbers, y won't wrap because of google maps, so only worry about x
    const boundsTree = rbush(9, ['.minX', '.minY', '.maxX', '.maxY']);
    const data =
        _.filter(_.keys(mydata.albums), function hasLatLngBounding(name) {
            return mydata.albums[name].boundingBox && mydata.albums[name].boundingBox.minLng;
        }).map(function getRecord(name) {
            const boundingBox = mydata.albums[name].boundingBox;
            const minWorld = mercator.fromLatLngToPoint({lat: boundingBox.minLat, lng: boundingBox.minLng});
            const maxWorld = mercator.fromLatLngToPoint({lat: boundingBox.maxLat, lng: boundingBox.maxLng});
            const bounds = getBounds(minWorld, maxWorld);
            return {name: name, ...bounds};
        });
    boundsTree.load(data); // Loading all at once makes later searches faster

    const state = fromJS({
        googlemap: {
            center: {lat: 39.725242779009, lng: -104.976973874}, // Denver
            zoom: 11,
            bounds: undefined
        },
        records: mydata.records,
        albums: mydata.albums,
        filters: filters,
        countries: mydata.countries,
        stats: {date: filters.date},
        inView: {albums: []}
    });
    return state.set('boundsTree', boundsTree);
}

function getBounds(w1, w2) {
    return {
        minX: Math.min(w1.x, w2.x), minY: Math.min(w1.y, w2.y),
        maxX: Math.max(w1.x, w2.x), maxY: Math.max(w1.y, w2.y)
    };
}
// We precomputed the bounding box, so we can easily skip a lot of computation of what should be shown
// FIXME: Consider moving marking which is visible???? Change colors of albumns shown
// We can than do the same for years and places...
function GetViewedAlbums(state) {
    let nw = state.getIn(['googlemap', 'bounds', 'nw']);
    let se = state.getIn(['googlemap', 'bounds', 'se']);
    // No bounds, return nothing
    if (!nw || !se) {
        return [];
    }
    nw = nw.toJS();
    se = se.toJS();
    const nwWorld = mercator.fromLatLngToPoint({lat: nw.lat, lng: nw.lng});
    const seWorld = mercator.fromLatLngToPoint({lat: se.lat, lng: se.lng});

    // Y must be ok because of the projection:
    // https://developers.google.com/maps/documentation/javascript/maptypes#WorldCoordinates
    if (nwWorld.x > seWorld.x) {
        // We need to do two searches, nwWorld->256 and 0->seWorld
        const tmpX = seWorld.x;
        seWorld.x = 256; // 256 is the projection max
        const results1 = doBoundsSearch(state, getBounds(nwWorld, seWorld));
        nwWorld.x = 0;
        seWorld.x = tmpX;
        const results2 = doBoundsSearch(state, getBounds(nwWorld, seWorld));
        return results1.concat(results2);
    } else {
        // Normal search
        return doBoundsSearch(state, getBounds(nwWorld, seWorld));
    }
    // I *think* this handles wrapping cases where lat/lng reset better
    /*const bounds = {
     minLng: Math.min(nw.lng, se.lng), minLat: Math.min(nw.lat, se.lat),
     maxLng: Math.max(nw.lng, se.lng), maxLat: Math.max(nw.lat, se.lat)
     }; */
}

function doBoundsSearch(state, bounds) {
    const search = [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY];
    return state.get('boundsTree').search(search).map((entry) => entry.name);
}

function SetMapBounds(state, {center, zoom, bounds}) {
    // We assume this is the only place bounds changes and albums once loaded are never added
    state = state.update('googlemap', mapInfo => mapInfo.merge({center, zoom, bounds}));

    return state.setIn(['inView', 'albums'], fromJS(GetViewedAlbums(state)));
}

function SetSelected(state, {id}) {
    return state.setIn(['filters', 'selected'], id);
}

function SetFilterGroup(state, {filter, name}) {
    return state.updateIn(['filters', filter], function (albums) {
        return albums.clear().add(name); // Easy for multi-select soon
    });
}

function SetDateRange(state, {startDate, endDate}) {
    const startDateStart = moment(startDate).startOf('day').toDate();
    const endDateEnd = moment(endDate).endOf('day').toDate();
    return state.setIn(['filters', 'date'], fromJS({min: startDateStart, max: endDateEnd}));
}

export default function (state = defaultState(), action) {
    switch (action.type) {
    case consts.SET_MAP_BOUNDS:
        return SetMapBounds(state, action.payload);
    case consts.SET_SELECTED:
        return SetSelected(state, action.payload);
    case consts.SET_FILTER_GROUP:
        return SetFilterGroup(state, action.payload);
    case consts.SET_DATE_RANGE:
        return SetDateRange(state, action.payload);
    }
    return state;
}
