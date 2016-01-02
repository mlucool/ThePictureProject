/**
 * Created by Marc on 11/15/2015.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {PlacesList} from './components/PlacesList';
import {YearFilter} from './components/YearFilter';
import {PictureMap} from './components/PictureMap';
import {PictureInfo} from './components/PictureInfo';
import {ScrollingPictureList} from './components/ScrollingPictureList';
import {Map, List} from 'immutable';
import reducer from './stores/reducer';
import {createStore, compose, applyMiddleware} from 'redux';
import {Provider, connect} from 'react-redux';
import DevTools from './components/DevTools';
import { persistState } from 'redux-devtools';
import {setAlbum, setPlace, setDateRange} from './actions/actionCreators';
import fsaValidateMiddleware from 'redux-validate-fsa';

/*

REDESIGN DATA STRUCTURE - STUDY OTHER APP! THIS IS THE MOST IMPORANT THING TO DO!!! Then test if it scales at all...
Rewrite python piece in JS too
Filter on lat/lng and visible
Logic is broken for when to show things at a given zoom. e.g. if you delect others that were covering it it should show. So we need to do something like per filter have something precached.
    Code is sloppy - clean up
Test with scaling up
When griddle gets to 1.0, really update the picture table - infinate scroll, paging in data,
Think about how to make this come from the web
*/



// FIXME: Wrap with if development + if window
window.React = React;
const finalCreateStore = compose(
    // Enables your middleware:
    // applyMiddleware(m1, m2, m3), // any Redux middleware, e.g. redux-thunk
    // Provides support for DevTools:
    applyMiddleware(fsaValidateMiddleware([] /*ignored actions*/)),
    DevTools.instrument(),
    // Lets you write ?debug_session=<name> in address bar to persist debug sessions
    persistState(getDebugSessionKey())
)(createStore);
function getDebugSessionKey() {
    // You can write custom logic here!
    // By default we try to read the key from ?debug_session=<key> in the address bar
    const matches = window.location.href.match(/[?&]debug_session=([^&]+)\b/);
    return (matches && matches.length > 0)? matches[1] : null;
}

const store = finalCreateStore(reducer);

function setDateFilter(startDate, endDate) {
    store.dispatch(setDateRange(startDate, endDate));
}

const YearFilterContainer = connect(function (state) {
    return {
        years: state.getIn(['stats', 'date'], Map()),
        dateFilter: state.getIn(['filters', 'date'], Map()),
        setDateFilter: setDateFilter
    }
})(YearFilter);

function onPlaceSelected(name) {
    store.dispatch(setPlace(name));
}
const PlacesListContainer = connect(function (state) {
    return {
        header: 'Countries',
        places: state.get('places', Map()),
        filtered: state.getIn(['filters', 'places'], Map()),
        onSelection: onPlaceSelected
    }
})(PlacesList);

function onAlbumSelected(name) {
    store.dispatch(setAlbum(name));
}
const AlbumListContainer = connect(function (state) {
    return {
        header: 'Albums',
        places: state.get('albums', Map()),
        filtered: state.getIn(['filters', 'albums'], Map()),
        onSelection: onAlbumSelected
    }
})(PlacesList);

const PictureMapContainer = connect(function (state) {
    return {
        // Need a center/zoom or it will not render
        center: state.getIn(['googlemap', 'center'], Map({lat: 39.725242779009, lng: -104.976973874})),
        zoom: state.getIn(['googlemap', 'zoom'], 11),
        places: state.get('places', Map()),
        zoomCache: state.get('zoomCache', List()),
        data: state.get('data', List()),
        filters: state.get('filters', Map())
    }
})(PictureMap);

const PictureInfoContainer = connect(function (state) {
    const selected = state.getIn(['filters', 'selected']);
    const picture = Number.isInteger(selected) ? state.get('data', List()).get(selected) : Map();
    return {
        picture: picture
    }
})(PictureInfo);

const ScrollingPictureListContainer = connect(function(state) {
    return {
        zoom: state.getIn(['googlemap', 'zoom'], 11),
        zoomCache: state.get('zoomCache', List()),
        data: state.get('data', List()),
        filters: state.get('filters', Map())
    }
})(ScrollingPictureList);

ReactDOM.render(
    <div>
        <Provider store={store}>
            <div>
                <div style={{position: 'absolute', left: 0, top: 0, width: '30%', height: '100%'}}>
                    <YearFilterContainer />
                    <PlacesListContainer />
                    <AlbumListContainer />
                    <ScrollingPictureListContainer/>
                    <PictureInfoContainer />
                </div>
                <PictureMapContainer />
                <DevTools></DevTools>
            </div>
        </Provider>
    </div>,
    document.getElementById('app')
);
