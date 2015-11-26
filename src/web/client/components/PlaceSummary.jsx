/**
 * Created by Marc on 11/15/2015.
 */
import React from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {fromJS} from 'immutable';

export class PlaceSummary extends React.Component {
    static propTypes = {
        name: React.PropTypes.string.isRequired,
        pictures: React.PropTypes.object
    };
    static defaultProps = fromJS({
        name: 'unknown',
        pictures: []
    }).toObject(); // Makes everything but the middle props themselves immutable (simplifies things later)

    shouldComponentUpdate = shouldPureComponentUpdate;

    getNumPictures() {
        return this.props.pictures.count();
    }

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="PlaceSummary">
            <p>{this.props.name} ({this.getNumPictures()})</p>
        </div>;
    }
}
