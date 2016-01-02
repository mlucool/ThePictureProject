/**
 * Created by Marc on 12/13/2015.
 */
import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import {List, Map, fromJS} from 'immutable';
import Griddle from 'griddle-react';
import moment from 'moment';
import {isShown} from '../helpers';
import Modal from 'react-modal';

let aBadHackForData = {};
const style = {
    width: '50px',
    height: '50px'
};

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)'
    }
};

const fullStyle = {
    'max-width': '100%',
    display: 'block'
};

// This is a poor way to do it, but it's getting by for now...
var ImageComp = React.createClass({
    getInitialState: function () {
        return {modalIsOpen: false};
    },
    openModal: function () {
        this.setState({modalIsOpen: true});
    },

    closeModal: function () {
        this.setState({modalIsOpen: false});
    },
    // FIXME: This should be a smarter element with a next/prev to see other pictures in the list
    render: function () {
        const id = this.props.data;
        const picture = aBadHackForData.get(id, Map());
        const file = picture.get('file');
        return <div>
            <img src={'/pictures/' + file} alt={file} style={style} onClick={this.openModal}/>
            <Modal
                isOpen={this.state.modalIsOpen}
                onRequestClose={this.closeModal}
                style={customStyles}
            >
                <img src={'/pictures/' + file} alt={file} onClick={this.closeModal} style={fullStyle}/>
            </Modal>
        </div>;
    }
});

export class ScrollingPictureList extends React.Component {
    static propTypes = {
        zoom: PropTypes.number.isRequired,
        zoomCache: PropTypes.instanceOf(List).isRequired,
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
        const zoomIdx = that.props.zoom < that.props.zoomCache.count()
            ? that.props.zoom : that.props.zoomCache.count() - 1;
        const pictures = that.props.zoomCache.get(zoomIdx, List())
            .filter((val) => {
                const data = that.props.data.get(val, Map());
                return isShown(this.props.filters, data);
            })
            .map(function (val) {
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
        return <div className='scrollingPictureList'>
            <Griddle results={pictures} useFixedHeader={true} resultsPerPage={10} bodyHeight={300}
                     enableInfiniteScroll={true} columnMetadata={columnMetadata}/>
        </div>;
    }
}

