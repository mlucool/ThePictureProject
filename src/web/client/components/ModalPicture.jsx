/**
 * Created by Marc on 1/11/2016.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {Map, fromJS} from 'immutable';
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
        setOpen: PropTypes.func
    };
    // Makes defaults work with all immutable functions
    static defaultProps = fromJS({
        picture: {},
        isOpen: true,
        setOpen: f=>f
    }).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    openModal = () => {
        this.props.setOpen(true);
    };

    closeModal = () => {
        this.props.setOpen(false);
    };

    render() {
        const that = this;
        const file = that.props.picture.get('file');
        const album = that.props.picture.get('album');
        return <div className="ModalPicture">
            <Modal
                isOpen={that.props.isOpen}
                onRequestClose={this.closeModal}
                style={customStyles}
            >
                <div className="row">
                    <p className="col-sm-3 col-lg-2">
                        File: {file}<br/>
                        Album: {album}<br/>
                        Date: {moment(that.props.picture.get('date')).format('MMMM Do YYYY, h:mm:ss a')}<br/>
                        This was {moment(that.props.picture.get('date')).fromNow()}
                    </p>
                    <img src={consts.PICTURE_PATH + album + '/' + file} alt={file} onClick={that.closeModal}
                         style={fullStyle} className="col-sm-9 col-lg-10"/>
                </div>
            </Modal>
        </div>;
    }
}

