import * as consts from './consts';

export function addPlace(place) {
    return {
        type: consts.ADD_PLACE,
        payload: {
            place
        }
    }
}

export function setMapBounds(zoom, center, bounds) {
    return {
        type: consts.SET_MAP_BOUNDS,
        payload: {
            zoom,
            center,
            bounds
        }
    }
}

export function setSelected(id) {
    return {
        type: consts.SET_SELECTED,
        payload: {
            id
        }
    }
}

export function setAlbum(name) {
    return {
        type: consts.SET_FILTER_GROUP,
        payload: {
            filter: 'albums',
            name
        }
    }
}

export function setPlace(name) {
    return {
        type: consts.SET_FILTER_GROUP,
        payload: {
            filter: 'places',
            name
        }
    }
}
