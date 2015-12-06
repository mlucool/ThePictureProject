/**
 * Created by Marc on 11/15/2015.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {PlacesList} from './components/PlacesList';
import {YearFilter} from './components/YearFilter';
import {PictureMap} from './components/PictureMap';
import {PictureInfo} from './components/PictureInfo';
import {Map, List} from 'immutable';
import reducer from './stores/reducer';
import {createStore, compose} from 'redux';
import {Provider, connect} from 'react-redux';
// Redux DevTools store enhancers
import { devTools, persistState } from 'redux-devtools';
// React components for Redux DevTools
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';
import {setAlbum, setPlace} from './actions/actionCreators';

// FIXME: Wrap with if development + if window
window.React = React;
const finalCreateStore = compose(
    // Enables your middleware:
    // applyMiddleware(m1, m2, m3), // any Redux middleware, e.g. redux-thunk
    // Provides support for DevTools:
    devTools(),
    // Lets you write ?debug_session=<name> in address bar to persist debug sessions
    persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
)(createStore);
const store = finalCreateStore(reducer);

const YearFilterContainer = connect(function (state) {
    return {
        years: state.getIn(['stats', 'date'], Map()),
        dateFilter: state.getIn(['filters', 'date'], Map())
    }
})(YearFilter);

function onPlaceSelected(name) {
    store.dispatch(setPlace(name));
}
const PlacesListContainer = connect(function (state) {
    return {
        header: 'Countries',
        places: state.get('places', Map()),
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
        data: state.get('data', List())
    }
})(PictureMap);

const PictureInfoContainer = connect(function (state) {
    const selected = state.getIn(['filters', 'selected']);
    const picture = Number.isInteger(selected) ? state.get('data', List()).get(selected) : Map();
    return {
        picture: picture
    }
})(PictureInfo);

ReactDOM.render(
    <div>
        <Provider store={store}>
            <div>
                <div style={{position: 'absolute', left: 0, top: 0, width: '30%', height: '100%'}}>
                    <PictureInfoContainer />
                    <YearFilterContainer />
                    <PlacesListContainer />
                    <AlbumListContainer />
                </div>
                <PictureMapContainer />
            </div>
        </Provider>
        <DebugPanel top right bottom>
            <DevTools store={store} monitor={LogMonitor}/>
        </DebugPanel>
    </div>,
    document.getElementById('app')
);
