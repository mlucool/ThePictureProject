/**
 * Created by Marc on 11/15/2015.
 */

import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {PlaceSummary} from './PlaceSummary';
import {Set, Map, fromJS} from 'immutable';

export class PlacesList extends React.Component {
    static propTypes = {
        header: PropTypes.string,
        places: PropTypes.instanceOf(Map),
        filtered: PropTypes.instanceOf(Set), // If its in here, it is filtered in!
        onSelection: PropTypes.func
    };
    static defaultProps = fromJS({places: {}, header: '', onSelection: f=>f}).toObject();
    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);

        // React components using ES6 classes no longer autobind this to non React methods.
        this._getOnChildClick = this._getOnChildClick.bind(this);
    }

    _getOnChildClick(name) {
        const that = this;
        return function () {
            that.props.onSelection(name);
        }
    }

    render() {
        const that = this;
        return <div className="PlacesList">
            {this.props.header} ({this.props.places.count()}):
            {this.props.places.map(function mapPlaces(place, name) {
                const isFiltered =  that.props.filtered.count() === 0 ||that.props.filtered.has(name);
                return <div>
                    <PlaceSummary name={name} pictures={place} isFiltered={isFiltered}
                                  onClick={that._getOnChildClick(name)}/>
                </div>;
            })}
        </div>;
    }
}
