/**
 * Created by Marc on 12/19/2015.
 */

// JS Min and Max dates
const MIN_DATE = new Date(-8640000000000000);
const MAX_DATE = new Date(8640000000000000);

// FIXME: make these checks much more robust for missing data
export function isShown(filters, picture) {
    const pictureDate = picture.get('date');
    if (pictureDate === undefined) {
        throw new Error('Picture with no date found ' + picture.toJS());
    }
    // FIXME: rethink and organize these..
    return filters.get('albums').has(picture.get('album'))
        && filters.get('countries').has(picture.getIn(['politics', 'country']))
        && filters.getIn(['date', 'min'], MIN_DATE) <= pictureDate
        && filters.getIn(['date', 'max'], MAX_DATE) >= pictureDate;
}
