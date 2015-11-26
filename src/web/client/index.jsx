/**
 * Created by Marc on 11/15/2015.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {PlacesList} from './components/PlacesList';
import {YearFilter} from './components/YearFilter';
import {PlaceSummary} from './components/PlaceSummary';
import {PictureMap} from './components/PictureMap';
import {Map, fromJS} from 'immutable';
import reducer from './stores/reducer';
import {createStore, compose} from 'redux';
import {Provider, connect} from 'react-redux';
import * as actionCreator from './actions/actionCreators'
// Redux DevTools store enhancers
import { devTools, persistState } from 'redux-devtools';
// React components for Redux DevTools
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';

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

const PlacesListContainer = connect(function (state) {
    return {
        places: state.get('places', Map())
    }
})(PlacesList);

const PlaceSummaryContainer = connect(function (state) {
    return {
        places: state.get('places', Map())
    }
})(PlaceSummary);

const PictureMapContainer = connect(function (state) {
    return {
        // Need a center or it will not render
        // Can't ever change so  state.get('center',  will not work :/
        // center: state.get('center', Map({lat: 40.7127840, lng: -74.0059410})),
        zoom: state.get('zoom', 9),
        places: state.get('places', Map())
    }
})(PictureMap);

let timeoutCt = 0;
let id = setInterval(function () {
    ++timeoutCt;
    if (timeoutCt === 3) {
        clearInterval(id);
    }
    let name = 'p' + timeoutCt;
    let diff = timeoutCt / 1000;
    let place = {name: name, lat: 40.7527840 + diff, lng: -74.0059410 + diff};
    store.dispatch(actionCreator.addPlace(fromJS(place)));
}, 1000);


ReactDOM.render(
    <div>
        <Provider store={store}>
            <div>
                <YearFilterContainer/>
                <PlacesListContainer />
                <PlaceSummaryContainer />
                <PictureMapContainer />
            </div>
        </Provider>
        <DebugPanel top right bottom>
            <DevTools store={store} monitor={LogMonitor}/>
        </DebugPanel>
    </div>,
    document.getElementById('app')
);