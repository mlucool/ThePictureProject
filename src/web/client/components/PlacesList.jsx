/**
 * Created by Marc on 11/15/2015.
 */

import React from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {PlaceSummary} from './PlaceSummary';
import {fromJS} from 'immutable';

export class PlacesList extends React.Component {
    static propTypes = {
        places: React.PropTypes.object
    };
    static defaultProps = fromJS({places: {}}).toObject();
    shouldComponentUpdate = shouldPureComponentUpdate;

    getPlaces() {
        return this.props.places;
    }

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="PlacesList">
            {this.getPlaces().map((data, name) =>
            <div>
                <PlaceSummary name={name} pictures={data}/>
            </div>
                )}
        </div>;
    }
}
