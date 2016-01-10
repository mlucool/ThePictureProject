/**
 * Created by Marc on 11/15/2015.
 *
 * Waiting on: https://github.com/skratchdot/react-bootstrap-daterangepicker
 */

import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Map, fromJS} from 'immutable';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import moment from 'moment';

export class YearFilter extends React.Component {
    static propTypes = {
        years: PropTypes.instanceOf(Map).isRequired,
        setDateFilter: PropTypes.func.isRequired,
        dateFilter: PropTypes.instanceOf(Map)
    };
    static defaultProps = fromJS({dateFilter: {}}).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    static toDateRange(immutableRange) {
        let min = immutableRange.get('min');
        let max = immutableRange.get('max');
        return min && max ? {min, max} : undefined;
    }

    getRange() {
        return YearFilter.toDateRange(this.props.years) || {min: new Date(), max: new Date()}
    }

    getCurrentFilter() {
        return YearFilter.toDateRange(this.props.dateFilter) || this.getRange();
    }

    formatDate(date) {
        return moment(date).format('MMMM YYYY')
    }

    isValid() {
        return this.props.years.count() !== 0;
    }

    _dateSet = (event, picker) => {
        this.props.setDateFilter(picker.startDate.toDate(), picker.endDate.toDate());
    };

    _clearFilter = () => {
        const range = this.getRange();
        this.props.setDateFilter(range.min, range.max);
    };

    constructor(props) {
        super(props);
    }

    // move the x to the label
    render() {
        const range = this.getRange();
        const currentFilter = this.getCurrentFilter();
        return <div className='YearFilter'>
            {this.isValid() ?
                <div>
                    <span>Showing from:</span>
                    <DateRangePicker
                        minDate={moment(range.min)} maxDate={moment(range.max)}
                        startDate={moment(currentFilter.min)} endDate={moment(currentFilter.max)}
                        showDropdowns={true}
                        onApply={this._dateSet}>
                        <div className='input-group'>
                                <span className='input-group-btn'>
                                    <button className='btn btn-default' onClick={this._clearFilter}>
                                        <span className='glyphicon glyphicon-remove' aria-hidden='true'></span></button>
                                </span>
                            <span type='text' className='form-control'>{this.formatDate(currentFilter.min)}
                                to {this.formatDate(currentFilter.max)}</span>
                        </div>
                    </DateRangePicker>
                </div>
                :
                <p>No Valid Data</p>
            }
        </div>;
    }
}
