/**
 * Created by Marc on 11/15/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {fromJS} from 'immutable';
import classNames from 'classnames';

import './PlaceSummary.css';

export class PlaceSummary extends React.Component {
    static propTypes = {
        name: PropTypes.string.isRequired,
        pictures: PropTypes.object.isRequired,
        onClick: PropTypes.func.isRequired,
        isFiltered: PropTypes.bool
    };
    static defaultProps = fromJS({isFiltered: false}).toObject(); // Makes everything but the middle props themselves immutable (simplifies things later)

    shouldComponentUpdate = shouldPureComponentUpdate;

    getNumPictures() {
        return this.props.pictures.reduce(function (previousValue, currentValue) {
            // If it is an integer, we assume it's a picture id...although would be nicer
            // to split this for albums and places in the future
            const count = Number.isInteger(currentValue) ? 1 : currentValue.count();
            return previousValue + count;
        }, 0);
    }

    constructor(props) {
        super(props);
    }

    render() {
        const classes = classNames('PlaceSummary', {'filtered': this.props.isFiltered});

        return <div className={classes}>
            <p onClick={this.props.onClick}>{this.props.name} ({this.getNumPictures()})</p>
        </div>;
    }
}
