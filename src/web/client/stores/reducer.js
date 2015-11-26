/* eslint-disable no-console*/
// FIXME: The above rule is jus for now and should be removed
import * as consts from '../actions/consts'
import {fromJS} from 'immutable';

let mydata = require('json!../../../data/data2.json');

function defaultState() {
    const albums = {};
    const places = {};
    mydata.data.forEach(function (element, index) {
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
        text: ''
    };
    if (mydata.data && mydata.data.length > 0) {
        filters.date.min = mydata.data[0].date;
        filters.date.max = mydata.data[mydata.data.length - 1].date;
    }
    return fromJS({
        googlemap: {
            center: {lat: 40.7127840, lng: -74.0059410},
            zoom: 9
        },
        data: mydata.data,
        albums: albums,
        zoomCache: mydata.zoomCache,
        filters: filters,
        places: places,
        stats: {date: filters.date}
        /*
         places: {
         foo: {lat: 40.7127840, lng: -74.0059410},
         baz: {lat: 40.7527840, lng: -74.0059410}
         },
         years: {'1/2/1924': {}, '9/5/1992': {}}
         */
    });
}

function ADD_PLACE(state, place) {
    let newState = state.setIn(['places', place.get('name')], place);
    return newState;
}

export default function (state = defaultState(), action) {
    switch (action.type) {
    case consts.ADD_PLACE:
        return ADD_PLACE(state, action.place);
    }
    return state;
}
