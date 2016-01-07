import * as consts from './consts';

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

export function setCountry(name) {
    return {
        type: consts.SET_FILTER_GROUP,
        payload: {
            filter: 'countries',
            name
        }
    }
}

export function setDateRange(startDate, endDate) {
    return {
        type: consts.SET_DATE_RANGE,
        payload: {
            filter: 'date',
            startDate,
            endDate
        }
    }
}
