/**
 * Created by Marc on 12/6/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {fromJS} from 'immutable';

export class PictureInfo extends React.Component {
    static propTypes = {
        picture: PropTypes.object
    };
    // Makes defaults work with all immutable functions
    static defaultProps = fromJS({picture: {}}).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    render() {
        const str = 'Picture Selected:\n' + JSON.stringify(this.props.picture.toJS(), undefined, 2);
        return <div className="pictureInfo">
            <pre>{str}</pre>
        </div>;
    }
}

