/**
 * Created by Marc on 12/13/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {List, Map, fromJS} from 'immutable';
import Griddle from 'griddle-react';
import moment from 'moment';
import {isShown} from '../helpers';
import _ from 'underscore';
import * as consts from '../consts';
import {ModalPicture} from './ModalPicture';

let aBadHackForData = {};
const style = {
    width: '50px',
    height: '50px'
};


// This is a poor way to do it, but it's getting by for now...
class ImageComp extends React.Component {
    static propTypes = {
        data: PropTypes.number.isRequired
    };
    static defaultProps = fromJS({}).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
        this.state = {};
        this.state.modalIsOpen = false;
    }

    _openModel = () => {
        this._setModalOpen(true);
    };

    _setModalOpen = (open) => {
        this.setState({modalIsOpen: open});
    };

    // FIXME: This should be a smarter element with a next/prev to see other pictures in the list
    render() {
        const that = this;

        const id = this.props.data;
        const picture = aBadHackForData.get(id, Map());
        const file = picture.get('file');
        const album = picture.get('album');
        const location = consts.PICTURE_PATH + album + '/' + file;
        return <div>
            <img src={location} alt={file} style={style} onClick={that._openModel}/>
            <ModalPicture picture={picture}
                          isOpen={that.state.modalIsOpen}
                          setOpen={that._setModalOpen}/>
        </div>;
    }
}

export class ScrollingPictureList extends React.Component {
    static propTypes = {
        zoom: PropTypes.number.isRequired,
        albums: PropTypes.instanceOf(Map),
        inView: PropTypes.instanceOf(Map),
        data: PropTypes.instanceOf(List).isRequired,
        filters: PropTypes.instanceOf(Map).isRequired
    };
    // Makes defaults work with all immutable functions
    static defaultProps = fromJS({}).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    render() {
        const that = this;

        aBadHackForData = that.props.data;

        const columnMetadata = [
            {
                'columnName': 'album',
                'order': 1,
                'locked': false,
                'visible': true,
                'displayName': 'Album'
            },
            {
                'columnName': 'date',
                'order': 2,
                'locked': false,
                'visible': true,
                'displayName': 'Date'
            },
            {
                'columnName': 'politics',
                'order': 3,
                'locked': false,
                'visible': true,
                'displayName': 'Country'
            },
            {
                'columnName': 'id',
                'order': 4,
                'locked': false,
                'visible': true,
                'displayName': 'Picture',
                'customComponent': ImageComp
            }
        ];
        const columns = {};
        columnMetadata.forEach(v => columns[v['columnName']] = true);
        // Array of arrays
        const inBoundsAlbums = that.props.inView.get('albums', List());
        const pictures = _.flatten(inBoundsAlbums.map((albumName) => {
            const album = this.props.albums.get(albumName);
            const zoomIdx = Math.min(that.props.zoom, album.get('zoomCache').count() - 1);

            return album.get('zoomCache').get(zoomIdx, List()).filter((val) => {
                const data = that.props.data.get(val, Map());
                return isShown(this.props.filters, data);
            }).map(function (val) {
                // FIXME: I know this is very inefficient but with griddle 1.0 I should rethink
                // Just pulling out the columns we need
                const picture = that.props.data.get(val, Map());
                let row = Map();
                for (let metadata in columns) {
                    if (picture.has(metadata)) {
                        let data = picture.get(metadata);
                        switch (metadata) {
                        case 'date': {
                            data = moment(data).format('YYYY');
                            break;
                        }
                        case 'politics': {
                            data = data.get('country', '??');
                            break;
                        }
                        case 'album': {
                            data = that.props.filters.get('selected') === val ? data + '<--' : data;
                        }
                        }
                        row = row.set(metadata, data);
                    }
                }
                return row;
            }).toJS();
        }).toJS());

        return <div className='scrollingPictureList'>
            <Griddle results={pictures} useFixedHeader={true} resultsPerPage={10} bodyHeight={300}
                     enableInfiniteScroll={true} columnMetadata={columnMetadata}/>
        </div>;
    }
}

