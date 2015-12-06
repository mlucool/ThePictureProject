/**
 * Created by Marc on 11/15/2015.
 *
 * Waiting on: https://github.com/skratchdot/react-bootstrap-daterangepicker
 */

import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {fromJS} from 'immutable';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import moment from 'moment';

export class YearFilter extends React.Component {
    static propTypes = {
        years: PropTypes.object.isRequired,
        dateFilter: PropTypes.object
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

    constructor(props) {
        super(props);
    }

    render() {
        const range = this.getRange();
        const currentFilter = this.getCurrentFilter();
        return <div className="YearFilter">
            {this.isValid() ?
            <div>
                <DateRangePicker minDate={range.min} maxDate={range.max}
                                 startDate={currentFilter.min} endDate={currentFilter.max}
                                 showDropdowns={true}>
                    <p>Showing from: {this.formatDate(currentFilter.min)} to {this.formatDate(currentFilter.max)} </p>
                </DateRangePicker>
            </div> :
            <p>No Valid Data</p>
                }
        </div>;
    }
}
