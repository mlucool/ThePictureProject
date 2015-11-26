import React from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import GoogleMap from 'google-map-react';
import {fromJS} from 'immutable';

const MARKER_SIZE = 400;
const greatPlaceStyle = {
    width: MARKER_SIZE,
    height: MARKER_SIZE
};

const K_WIDTH = 60;
const K_HEIGHT = 60;

const greatPlaceStyle2 = {
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

class SimplePlace extends React.Component {
    static defaultProps = {
        lat: 40.7127840,
        lng: -74.0059410,
        text: 'foobar'
    };

    constructor(props) {
        super(props);
    }

    render() {
        return <div style={greatPlaceStyle2}>
            {this.props.text}
        </div>
    }
}

// We can't change default center EVER so I'd have to think deeper about this
// Or just look at source
let center = {lat: 40.7127840, lng: -74.0059410};
export class PictureMap extends React.Component {
    static propTypes = {
        center: React.PropTypes.object,
        zoom: React.PropTypes.number,
        places: React.PropTypes.object
    };
    static defaultProps = fromJS({
        center: center,
        zoom: 9,
        places: {
            foo: {lat: 40.7127840, lng: -74.0059410},
            baz: {lat: 40.7527840, lng: -74.0059410}
        }
    }).toObject();

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    render() {
        const MARKERS = this.props.places.map((val, key) => <SimplePlace key={key} lat={val.get('lat')}
                                                                         lng={val.get('lng')} text={key}/>).toArray();
        return (
            <div style={greatPlaceStyle}>
                <GoogleMap
                    defaultCenter={center}
                    defaultZoom={this.props.zoom}>
                    {MARKERS}
                </GoogleMap>
            </div>
        );
    }
}
