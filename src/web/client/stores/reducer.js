/* eslint-disable no-console*/
// FIXME: The above rule is just for now and should be removed
import * as consts from '../actions/consts'
import {Set, fromJS} from 'immutable';

let mydata = require('json!../../../data/data2.json');

function defaultState() {
    const albums = {};
    const places = {};
    mydata.data.forEach(function (element, index) {
        element.id = index;
        if (element.date) {
            element.date = new Date(element.date);
        }
        let album = element.album;
        if (album) {
            if (!albums[album]) {
                albums[album] = [index];
            } else {
                albums[album].push(index);
            }
        } else {
            console.log('defaultState ERROR: no album found ' + element);
        }
        if (element.politics) {
            if (element.politics.country) {
                let country = places[element.politics.country] || {};
                let city = element.politics.city || 'nocity';
                if (country[city]) {
                    country[city].push(index);
                } else {
                    country[city] = [index];
                }
                places[element.politics.country] = country;
            } else {
                console.log('defaultState ERROR: no country found for something with politics ' + element);
            }
        }
    });
    const filters = {
        date: {min: undefined, max: undefined},
        selected: undefined,
        albums: new Set(), // Strings
        places: new Set(), // Strings
        text: ''
    };
    if (mydata.data && mydata.data.length > 0) {
        filters.date.min = mydata.data[0].date;
        filters.date.max = mydata.data[mydata.data.length - 1].date;
    }
    return fromJS({
        googlemap: {
            center: {lat: 39.725242779009, lng: -104.976973874}, // Denver
            zoom: 11,
            bounds: undefined
        },
        data: mydata.data,
        albums: albums,
        zoomCache: mydata.zoomCache,
        filters: filters,
        places: places,
        stats: {date: filters.date}
    });
}

function ADD_PLACE(state, {place}) {
    return state.setIn(['places', place.get('name')], place);
}

function SET_MAP_BOUNDS(state, {center, zoom, bounds}) {
    return state
        .update('googlemap', mapInfo => mapInfo.merge({center, zoom, bounds}));
}

function SET_SELECTED(state, {id}) {
    return state.setIn(['filters', 'selected'], id);
}

function SET_FILTER_GROUP(state, {filter, name}) {
    return state.updateIn(['filters', filter], function(albums) {
        return albums.clear().add(name); // Easy for multi-select soon
    });
}

export default function (state = defaultState(), action) {
    switch (action.type) {
    case consts.ADD_PLACE:
        return ADD_PLACE(state, action.payload);
    case consts.SET_MAP_BOUNDS:
        return SET_MAP_BOUNDS(state, action.payload);
    case consts.SET_SELECTED:
        return SET_SELECTED(state, action.payload);
    case consts.SET_FILTER_GROUP:
        return SET_FILTER_GROUP(state, action.payload);
    }
    return state;
}
