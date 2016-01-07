/* eslint-disable no-console*/
// FIXME: The above rule is just for now and should be removed
import * as consts from '../actions/consts'
import {Set, fromJS} from 'immutable';
import moment from 'moment';
import rbush from 'rbush'; // Helps with performance when there is lots of data
import _ from 'underscore';

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

    const boundsTree = rbush(9, ['.minLng', '.minLat', '.maxLng', '.maxLat']);
    const data =
        _.filter(_.keys(mydata.albums), function hasLatLngBounding(name) {
            return mydata.albums[name].boundingBox && mydata.albums[name].boundingBox.minLng;
        }).map(function getRecord(name) {
            const boundingBox = mydata.albums[name].boundingBox;
            return {name: name, ...boundingBox};
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

function getBounds(p1, p2) {
    return {
        minLng: Math.min(p1.lng, p2.lng), minLat: Math.min(p1.lat, p2.lat),
        maxLng: Math.max(p1.lng, p2.lng), maxLat: Math.max(p1.lat, p2.lat)
    };
}

// We precomputed the bounding box, so we can easily skip a lot of computation of what should be shown
// FIXME: Consider moving marking which is visible???? Change colors of albums shown
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
    // We started counting over...
    if (nw.lng > se.lng) {
        // We need to do two searches, lat->180 and -180->lat
        // This is because lat/lng is cyclic
        const tmpLng = se.lng;
        se.lng = 180; // 256 is the projection max
        const results1 = doBoundsSearch(state, getBounds(nw, se));
        nw.lng = -180;
        se.lng = tmpLng;
        const results2 = doBoundsSearch(state, getBounds(nw, se));
        return results1.concat(results2);
    } else {
        // Normal search
        return doBoundsSearch(state, getBounds(nw, se));
    }
}

function doBoundsSearch(state, bounds) {
    const search = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat];
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
