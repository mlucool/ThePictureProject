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

export function setAlbum(names) {
    return {
        type: consts.SET_FILTER_GROUP,
        payload: {
            filter: 'albums',
            names
        }
    }
}

export function setCountry(names) {
    return {
        type: consts.SET_FILTER_GROUP,
        payload: {
            filter: 'countries',
            names
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
