/*global google*/
/**
 * Created by Marc on 12/6/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Map, List, fromJS} from 'immutable';
import {setSelected} from '../actions/actionCreators';
import {ModalPicture} from './ModalPicture';

const K_WIDTH = 35;
const K_HEIGHT = 35;

const PictureMarkerStyle = {
    // initially any map object has left top corner at lat lng coordinates
    // it's on you to set object origin to 0,0 coordinates
    position: 'absolute',
    width: K_WIDTH,
    height: K_HEIGHT,
    left: -K_WIDTH / 2,
    top: -K_HEIGHT / 2,
    backgroundRepeat: 'no-repeat',

    textAlign: 'right',
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 4
};

export default class PictureMarker extends React.Component {
    static propTypes = {
        picture: PropTypes.instanceOf(Map),
        data: PropTypes.instanceOf(List), // FIXME: Remove this after we refactor ModalDialog
        albums: PropTypes.instanceOf(Map), // FIXME: Remove this after we refactor ModalDialog
        dispatch: PropTypes.func
    };
    static defaultProps = fromJS({
        picture: {},
        dispatch: f=>f
    }).toObject();

    static ImageURLS = function getImages() {
        // 10 so it repeats on the same digit
        const pinColors = ['FF0000', 'E42CF5', '9E1AEB', '441AEB', '1AACEB', '13D695', '27D613', 'FFF782', 'F5A822', 'FA5D2D', 'FFFFFF'];
        return pinColors.map(function (pinColor) {
            return new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor,
                new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34)).url;
        });
    }();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
        this.state = {};
        this.state.modalIsOpen = false;
    }

    _onClick = () => {
        if (this.props.picture) {
            this.props.dispatch(setSelected(this.props.picture.get('id')));
            this._setModalOpen(true);
        }
    };

    _setModalOpen = (open) => {
        this.setState({modalIsOpen: open});
    };

    render() {
        const that = this;
        const imgIndex = that.props.picture.get('date').getFullYear() % PictureMarker.ImageURLS.length;
        return (
            <div className="pictureMarker"
                 style={{...PictureMarkerStyle, backgroundImage: 'url(' + PictureMarker.ImageURLS[imgIndex] + ')'}}
                 onClick={that._onClick}
            >
                <ModalPicture picture={that.props.picture}
                              albums={that.props.albums}
                              data={that.props.data}
                              isOpen={that.state.modalIsOpen}
                              setOpen={that._setModalOpen}/>
            </div>
        );
    }
}
