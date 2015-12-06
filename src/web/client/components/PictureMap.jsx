import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import GoogleMap from 'google-map-react';
import {List, Map, fromJS} from 'immutable';
import {setMapBounds} from '../actions/actionCreators';
import PictureMarker from './PictureMarker';

export class PictureMap extends React.Component {
    static propTypes = {
        center: PropTypes.object,
        zoom: PropTypes.number,
        places: PropTypes.object,
        zoomCache: PropTypes.object
    };
    static defaultProps = fromJS({
        center: {lat: 39.725242779009, lng: -104.976973874},
        zoom: 9,
        zoomCache: [],
        data: []
    }).toObject();

    _onChange({center, zoom, bounds}) {
        // FIXME: This should get refactored outside and be dumb
        this.props.dispatch(setMapBounds(zoom, center, bounds));
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
        // React components using ES6 classes no longer autobind this to non React methods.
        this._onChange = this._onChange.bind(this);
    }

    render() {
        const that = this;
        const zoomIdx = that.props.zoom < that.props.zoomCache.count() ? that.props.zoom : that.props.zoomCache.count() - 1;
        const MARKERS = that.props.zoomCache.get(zoomIdx, List()).map(function (val) {
            const data = that.props.data.get(val, Map());
            if (data.has('lat') && data.has('lng')) {
                // Strongly assumes that the that.props.data never reorders or shrinks
                // This makes the key easy!
                return <PictureMarker key={val}
                                      lat={data.get('lat')}
                                      lng={data.get('lng')}
                                      picture={data}
                                      dispatch={that.props.dispatch}
                />
            }
            // We could have filtered, but no need because this should NEVER happen
            return <div></div>;
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
                    {MARKERS}
                </GoogleMap>
            </div>
        );
    }
}
