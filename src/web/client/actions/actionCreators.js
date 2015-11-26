import * as consts from './consts';

export function addPlace(place) {
    return {
        type: consts.ADD_PLACE,
        place: place
    }
}
