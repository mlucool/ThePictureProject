/**
 * Created by Marc on 1/11/2016.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Map, List, fromJS} from 'immutable';
import * as consts from '../consts';
import Modal from 'react-modal';
import moment from 'moment';

// FIXME: issue with full screen
const customStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.75)'
    },
    content: {
        position: 'absolute',
        top: '40px',
        left: '40px',
        right: '40px',
        bottom: '40px',
        border: '1px solid #ccc',
        background: '#fff',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '4px',
        outline: 'none',
        padding: '20px'

    }
};

const fullStyle = {
    maxHeight: '90%',
    maxWidth: '95%',
    display: 'block'
};

export class ModalPicture extends React.Component {
    static propTypes = {
        picture: PropTypes.instanceOf(Map),
        isOpen: PropTypes.bool,
        albums: PropTypes.instanceOf(Map),
        data: PropTypes.instanceOf(List),
        setOpen: PropTypes.func
    };
    // Makes defaults work with all immutable functions
    static defaultProps = fromJS({
        pictures: [],
        isOpen: true,
        setOpen: f=>f
    }).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
        this.state = {currentIdx: 0, currentAlbum: 0};
    }

    componentWillReceiveProps = (nextProps) => { // eslint-disable-line
        let albumIndex = 0;
        const picture = nextProps.picture || Map();
        const currentAlbum = nextProps.albums && nextProps.albums.get(picture.get('album'));
        const records = currentAlbum && currentAlbum.get('records');
        if (records) {
            albumIndex = records.indexOf(picture.id);
        }
        this.setState({
            albumIndex: albumIndex,
            currentAlbum: currentAlbum
        });

    };

    openModal = () => {
        this.props.setOpen(true);
    };

    closeModal = () => {
        this.props.setOpen(false);
    };

    nextPicture = () => {
        const nextIndex = this.state.currentAlbum ?
        (this.state.albumIndex + 1) % this.state.currentAlbum.get('records').size : 0;
        this.setState({
            albumIndex: nextIndex
        });
    };

    prevPicture = () => {
        let nextIndex = this.state.albumIndex - 1;
        if (nextIndex < 0) {
            nextIndex = this.state.currentAlbum ? this.state.currentAlbum.get('records').size - 1 : 0;
        }
        this.setState({
            albumIndex: nextIndex
        });
    };

    render() {
        const that = this;
        const pictureIndex = that.state.currentAlbum ? that.state.currentAlbum.getIn(['records', that.state.albumIndex], -1) : -1;
        const numRecords = that.state.currentAlbum ? this.state.currentAlbum.get('records').size : 0;
        const picture = pictureIndex === -1 ? this.props.picture : that.props.data.get(pictureIndex);
        const file = picture.get('file');
        const album = picture.get('album');
        return <div className="ModalPicture">
            <Modal
                isOpen={that.props.isOpen}
                onRequestClose={this.closeModal}
                style={customStyles}
            >
                <div className="row">
                    <p className="col-sm-3 col-lg-2">
                        File: {file}<br/>
                        Album: {album} ({that.state.albumIndex + 1}/{numRecords})<br/>
                        Date: {moment(picture.get('date')).format('MMMM Do YYYY, h:mm:ss a')}<br/>
                        This was {moment(picture.get('date')).fromNow()}<br/>
                        <a onClick={that.prevPicture}>prev</a>&nbsp;&nbsp;&nbsp;<a onClick={that.nextPicture}>next</a>
                    </p>
                    <img src={consts.PICTURE_PATH + album + '/' + file} alt={file} onClick={that.closeModal}
                         style={fullStyle} className="col-sm-9 col-lg-10"/>
                </div>
            </Modal>
        </div>;
    }
}

