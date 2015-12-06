/**
 * Created by Marc on 12/6/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {fromJS} from 'immutable';
import {setSelected} from '../actions/actionCreators';

const K_WIDTH = 60;
const K_HEIGHT = 60;

const PictureMarkerStyle = {
    // initially any map object has left top corner at lat lng coordinates
    // it's on you to set object origin to 0,0 coordinates
    position: 'absolute',
    width: K_WIDTH,
    height: K_HEIGHT,
    left: -K_WIDTH / 2,
    top: -K_HEIGHT / 2,

    border: '5px solid #f44336',
    borderRadius: K_HEIGHT,
    backgroundColor: 'white',
    textAlign: 'center',
    color: '#3f51b5',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 4
};

export default class PictureMarker extends React.Component {
    static propTypes = {
        picture: PropTypes.object,
        dispatch: PropTypes.func
    };
    static defaultProps = fromJS({
        picture: {},
        dispatch: f=>f
    }).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
        this._onClick = this._onClick.bind(this);
    }

    _onClick() {
        if(this.props.picture) {
            this.props.dispatch(setSelected(this.props.picture.get('id')));
        }
    }

    render() {
        return(
        <div className="pictureMarker"
            style={PictureMarkerStyle}
            onClick={this._onClick}
        >
            {this.props.picture.get('file', 'unknown')}
        </div>
        );
    }
}
