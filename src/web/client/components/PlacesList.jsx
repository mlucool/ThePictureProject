/**
 * Created by Marc on 11/15/2015.
 */

import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Set, Map, List, fromJS} from 'immutable';
import Select from 'react-select';
import _ from 'lodash';

export class PlacesList extends React.Component {
    static propTypes = {
        header: PropTypes.string,
        places: PropTypes.instanceOf(Map),
        filtered: PropTypes.instanceOf(Set), // If its in here, it is filtered in!
        onSelection: PropTypes.func,
        countOnly: PropTypes.string
    };
    static defaultProps = fromJS({places: {}, header: '', onSelection: f=>f}).toObject();
    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    _onSelection = (val) => {
        let selected = _.map(val, 'value');
        if (selected.length === 0) {
            selected = _.map(this._getOptions(), 'value');
        }
        this.props.onSelection(selected);
    };

    _getOptions = () => {
        const that = this;
        const options = this.props.places.map(function mapPlaces(place, name) {
            if (that.props.countOnly) {
                const counted = {};
                counted[that.props.countOnly] = place.get(that.props.countOnly, Map());
                place = fromJS(counted);
            }

            const pictures = place.get('records', List()).count();
            const label = name + ' (' + pictures + ')';
            return {value: name, label: label}
        }).toArray();
        return _.sortBy(options, 'value');
    };

    _getSelected = () => this.props.filtered.toJS().sort();

    render() {
        const that = this;
        const options = that._getOptions();
        let selected = that._getSelected();
        if (selected.length === options.length) {
            selected = [];
        }
        return <div className="PlacesList"> {this.props.header} ({this.props.places.count()}):
            <Select
                placeholder={'Showing ' + this.props.places.count() + ' ' + this.props.header}
                value={selected}
                options={options}
                multi={true}
                onChange={that._onSelection}
            />
        </div>;
    }
}
