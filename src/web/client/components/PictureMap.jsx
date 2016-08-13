import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import GoogleMap from 'google-map-react';
import {List, Map, fromJS} from 'immutable';
import {setMapBounds} from '../actions/actionCreators';
import PictureMarker from './PictureMarker';
import {isShown} from '../helpers';

export class PictureMap extends React.Component {
    static propTypes = {
        center: PropTypes.instanceOf(Map),
        inView: PropTypes.instanceOf(Map),
        zoom: PropTypes.number,
        places: PropTypes.instanceOf(Map),
        albums: PropTypes.instanceOf(Map),
        data: PropTypes.instanceOf(List),
        filters: PropTypes.instanceOf(Map)
    };
    static defaultProps = fromJS({
        center: {lat: 39.725242779009, lng: -104.976973874},
        zoom: 9,
        places: {},
        inView: {},
        albums: {},
        data: [],
        filters: {}
    }).toObject();

    _onChange = ({center, zoom, bounds}) => {
        // FIXME: This should get refactored outside and be dumb
        this.props.dispatch(setMapBounds(zoom, center, bounds));
    };

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    render() {
        const that = this;
        const inBoundsAlbums = that.props.inView.get('albums', List());
        // Array of arrays
        const markers = inBoundsAlbums.map((albumName) => {
            const album = this.props.albums.get(albumName);
            const zoomIdx = Math.min(that.props.zoom, album.get('zoomCache').count() - 1);

            return album.get('zoomCache').get(zoomIdx, List()).filter((val) => {
                const data = that.props.data.get(val, Map());
                return data.has('lat') && data.has('lng') && isShown(this.props.filters, data);
            }).map(function (val) {
                const data = that.props.data.get(val, Map());
                // Strongly assumes that the that.props.data never reorders or shrinks
                // This makes the key easy!
                return <PictureMarker key={val}
                                      lat={data.get('lat')}
                                      lng={data.get('lng')}
                                      picture={data}
                                      data={that.props.data}
                                      albums={that.props.albums}
                                      dispatch={that.props.dispatch}
                />
            }).toArray();
        }).toArray();

        return (
            // FIXME: move style
            <div className="pictureMap" style={{position: 'absolute', right: 0, top: 0, width: '70%', height: '100%'}}>
                <GoogleMap
                    // Need a center or it will not render, but changing it causes issues
                    center={this.props.center.toJS()}
                    zoom={this.props.zoom}
                    onChange={this._onChange}
                >
                    {markers}
                </GoogleMap>
            </div>
        );
    }
}

