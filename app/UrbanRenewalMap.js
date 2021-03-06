import canUseDOM from "can-use-dom";
import React from 'react';
import ReactDOM from 'react-dom';
import DataManager from './DataManager';
import ChatDialog from './ChatDialog';
import UrbanRenewalUnitInfo from './UrbanRenewalUnitInfo';
import { ModalContainer, ModalDialog } from 'react-modal-dialog';
import {
    withGoogleMap,
    GoogleMap,
    Marker,
    InfoWindow,
    TrafficLayer,
    Circle,
    Polygon,
    Geojson
} from '../react-google-maps.myfork';
import SearchBox from '../react-google-maps.myfork/places/SearchBox';
import renewal_units from '../data/renewal_units_geojson.js';
import private_renewal_units_info from '../data/private_renewal_units_info_dictionary.js';

let dataMgr = new DataManager();

const geolocation = (
    canUseDOM && navigator.geolocation ?
        navigator.geolocation :
        ({
            getCurrentPosition(success, failure) {
                failure(`Your browser doesn't support geolocation.`);
            },
        })
);

let renewal_units_land_coords = renewal_units.features.map((land, i) => {
    let coords = [];
    let geo = land.geometry;
    if (geo && geo.coordinates[0] && geo.coordinates[0][0]) {
        coords = geo.coordinates[0][0].map((coord) => {
            return {
                lat: coord[1],
                lng: coord[0],
            };
        });
    }
    return coords;
});

const INPUT_STYLE = {
    boxSizing: `border-box`,
    MozBoxSizing: `border-box`,
    border: `1px solid transparent`,
    width: `240px`,
    height: `32px`,
    marginTop: `9px`,
    padding: `0 12px`,
    borderRadius: `1px`,
    boxShadow: `0 5px 6px rgba(0, 0, 0, 0.5)`,
    fontSize: `14px`,
    outline: `none`,
    textOverflow: `ellipses`,
    top: `100px`
};

const ECO_STYLE = {
    fillColor: 'grey',
    strokeWeight: 2.5,
    visible: true,
    zIndex: 0
};

class Lands extends React.PureComponent {
    constructor(props) {
        super(props);
        this._onClick = this._onClick.bind(this);
    }

    _onClick(e) {
        console.log(JSON.stringify(e));
        this.props.onClick(e, this.props.index);
    }

    render() {
        //console.log(renewal_units.features[this.props.index].properties.status);
        let color;
        if (renewal_units.features[this.props.index].properties.type == '自行劃定') {
            // 自行劃定
            color = 'red';
            if (renewal_units.features[this.props.index].properties.status == '失效') {
                color = 'grey';
            }
        }
        else {
            // 政府劃定
            color = 'blue';
        }

        return (
            <Polygon
                paths={renewal_units_land_coords[this.props.index]}
                options={{
                    fillColor: color,
                    fillOpacity: 0.40,
                    strokeColor: color,
                    strokeOpacity: 1,
                    strokeWeight: 1.5,
                    zIndex: 100,
                }}
                onClick={this._onClick}
                key={'poly' + this.props.index}
            />
        );
    }
}

const UserLocationGoogleMap = withGoogleMap(props => (
    <GoogleMap
        ref={props.onMapLoad}
        defaultZoom={16}
        defaultCenter={{ lat: 0, lng: 0 }}
        center={props.center}
    /*onClick={props.onMapClick}*/
    >

        {props.markers.map(marker => (
            <Marker {...marker}>
                <div>{marker.content}</div>
            </Marker>
        ))}

        {props.infos.map(info => (
            <InfoWindow {...info}>
                <div>{info.content}</div>
            </InfoWindow>
        ))}

        {renewal_units.features.map((land, i) => {

            {/*console.log(JSON.stringify(coords));*/ }


            return (
                <Lands onClick={props.onPolygonClick} index={i} key={'land' + i}></Lands>
            );
        })}

        {props.landInfoWindow.position != null && (
            <InfoWindow
                position={props.landInfoWindow.position}
                onCloseClick={() => props.onPolygonCloseClick()}
                key={'polyInfo'}
            >
                <div>
                    <h3>單元名稱</h3>
                    <div className="btn-toolbar">
                        <button className='btn btn-primary' onClick={() => props.onChatClick()}>聊聊</button>
                        <button className='btn btn-primary' onClick={() => props.onLandDetailClick(props.landInfoWindow.landIndex)}>詳細</button>
                    </div>
                </div>
            </InfoWindow>
        )}

        {props.popupDetail != null && (
            /*
            <ModalContainer onClose={() => props.onLandDetailCloseClick()}>
                <ModalDialog onClose={() => props.onLandDetailCloseClick()} style={{ left: '50%' }}>
                    <h2>詳細資料</h2>
                    <p className="panel-body pre-scrollable" style={{ width: '500px', height: '600px' }}>
                        區域座標: <br />
                        {JSON.stringify(props.popupDetail, null, 2)}
                    </p>
                </ModalDialog>
            </ModalContainer>*/
            <ModalDialog onClose={() => props.onLandDetailCloseClick()} style={{ left: '50%', top: '80px' }}>
                <UrbanRenewalUnitInfo popupDetail={props.popupDetail}></UrbanRenewalUnitInfo>
            </ModalDialog>
        )}

        {props.popupChat == true && (
            <ModalContainer onClose={() => props.onChatCloseClick()}>
                <ModalDialog onClose={() => props.onChatCloseClick()} style={{ width: '800px', backgroundColor: '#EEEEEE' }}>
                    <ChatDialog></ChatDialog>
                </ModalDialog>
            </ModalContainer>
        )}

        {/*<Circle
            center={{ lat: 24.94, lng: 121.52 }}
            radius={500}
            options={{
                fillColor: 'red',
                fillOpacity: 0.20,
                strokeColor: 'red',
                strokeOpacity: 1,
                strokeWeight: 0.5,
            }}
        />*/}
        <SearchBox
            ref={props.onSearchBoxMounted}
            bounds={props.bounds}
            controlPosition={google.maps.ControlPosition.TOP_LEFT}
            onPlacesChanged={props.onPlacesChanged}
            inputPlaceholder="來去看看我家?"
            inputStyle={INPUT_STYLE} />


        {props.additionalMayLayer.type == 1 &&
            <Geojson url={'https://raw.githubusercontent.com/Pentatonic/GoogleVisionOCR/master/TPE/admin_area_taipei.geojson'}
                style={ECO_STYLE} />
        }
        {props.additionalMayLayer.type == 2 &&
            <Geojson url={'https://raw.githubusercontent.com/Pentatonic/GoogleVisionOCR/master/TPE/code1.geojson'}
                style={ECO_STYLE} />
        }
        {props.additionalMayLayer.type == 3 &&
            <Geojson url={'https://raw.githubusercontent.com/Pentatonic/GoogleVisionOCR/master/TPE/code2.geojson'}
                style={ECO_STYLE} />
        }
        {props.additionalMayLayer.type == 4 &&
            <Geojson url={'https://raw.githubusercontent.com/Pentatonic/GoogleVisionOCR/master/TPE/code3.geojson'}
                style={ECO_STYLE} />
        }
    </GoogleMap>
));

export default class ChatMap extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            bounds: null,
            markers: [
                /*
                {
                    position: {
                        lat: 25.0112183,
                        lng: 121.52067570000001,
                    },
                    key: `Taiwan`,
                    defaultAnimation: 3,
                },
                {
                    position: {
                        lat: 30.0112183,
                        lng: 121.52067570000001,
                    },
                    key: `Taiwan2`,
                    defaultAnimation: 3,
                },
                */
            ],
            infos: [],
            center: { lat: 25.038357847174, lng: 121.54770626982 },
            // polygons: renewal_units.features,
            popupDetail: null,
            popupChat: false,
            landInfoWindow: {
                position: null,
                landIndex: 0
            },
            additionalMayLayer: {
                enable: false,
                type: 0
            },
        };

        this.handleLocationUpdate = this.handleLocationUpdate.bind(this);
        this.handleMapLoad = this.handleMapLoad.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
        this.handlePolygonClick = this.handlePolygonClick.bind(this);
        this.handlePolygonCloseClick = this.handlePolygonCloseClick.bind(this);

        this.handleLandDetailClick = this.handleLandDetailClick.bind(this);
        this.handleLandDetailCloseClick = this.handleLandDetailCloseClick.bind(this);
        this.handleChatClick = this.handleChatClick.bind(this);
        this.handleChatCloseClick = this.handleChatCloseClick.bind(this);

        this.handleMapMounted = this.handleMapMounted.bind(this);
        this.handleBoundsChanged = this.handleBoundsChanged.bind(this);
        this.handleSearchBoxMounted = this.handleSearchBoxMounted.bind(this);
        this.handlePlacesChanged = this.handlePlacesChanged.bind(this);
    }

    handleMapMounted(map) {
        this._map = map;
    }

    handleBoundsChanged() {
        this.setState({
            bounds: this._map.getBounds(),
            center: this._map.getCenter(),
        });
    }

    handleSearchBoxMounted(searchBox) {
        this._searchBox = searchBox;
        this.setState({
            additionalMayLayer: {
                enable: true,
                type: 0
            }
        });
    }

    handlePlacesChanged() {
        const places = this._searchBox.getPlaces();

        // Add a marker for each place returned from search bar
        const markers = places.map(place => ({
            position: place.geometry.location,
        }));

        // Set markers; set map center to first search result
        const mapCenter = markers.length > 0 ? markers[0].position : this.state.center;

        this.setState({
            center: mapCenter,
            markers,
        });
    }


    componentDidMount() {
        // Send current position to server
        geolocation.getCurrentPosition((position) => {
            console.log(position);
            dataMgr.connect();
            dataMgr.registerCbUpdateLocations(this.handleLocationUpdate);
            dataMgr.sendLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        }, (reason) => {
            console.log(reason);
        });
    }

    handleLocationUpdate(data) {
        let newCenter = this.state.center;
        let nextMarkers = data.map((d, i) => {
            if (d) {
                if (d.username == dataMgr.getUsername() && d.location != null) {
                    newCenter = d.location;
                }
                return {
                    position: d.location,
                    key: 'key' + i,
                    defaultAnimation: 3,
                    title: d.username,
                };
            }
        });
        console.log(JSON.stringify(nextMarkers));
        console.log(JSON.stringify(newCenter));
        this.setState({
            markers: nextMarkers,
            center: newCenter
        });
    }

    handleMapLoad(map) {
        this._mapComponent = map;
        if (map) {
            console.log('zoom:' + map.getZoom());
        }
    }

    /*
     * This is called when you click on the map.
     * Go and try click now.
     */
    handleMapClick(event) {
        const nextMarkers = [
            ...this.state.markers,
            {
                position: event.latLng,
                defaultAnimation: 2,
                key: Date.now(), // Add a key property for: http://fb.me/react-warning-keys
            },
        ];
        this.setState({
            markers: nextMarkers,
        });

        if (nextMarkers.length === 3) {
            //alert("right click to remove");
            return;
            this.props.toast(
                `Right click on the marker to remove it`,
                `Also check the code!`
            );
        }
    }

    handleMarkerRightClick(targetMarker) {
        /*
         * All you modify is data, and the view is driven by data.
         * This is so called data-driven-development. (And yes, it's now in
         * web front end and even with google maps API.)
         */
        const nextMarkers = this.state.markers.filter(marker => marker !== targetMarker);
        //const nextMarkers = this.state.markers.filter(function(marker){return  marker === targetMarker});
        this.setState({
            markers: nextMarkers,
        });
    }

    handlePolygonClick(event, i) {
        // this.setState({
        //     landInfoWindow: {
        //         position: event.latLng,
        //         landIndex: i
        //     }
        // });

        console.log(JSON.stringify(event.latLng));
        let id = renewal_units.features[i].properties.id;
        this.setState({
            markers: [{
                position: event.latLng,
            }],
            popupDetail: private_renewal_units_info[id],
        });
    }

    handlePolygonCloseClick() {
        this.setState({
            landInfoWindow: {
                position: null,
                landIndex: 0
            }
        });
    }

    handleLandDetailClick(targetPolygon) {
        this.setState({
            popupDetail: renewal_units.features[this.state.landInfoWindow.landIndex].properties
        });
    }

    handleLandDetailCloseClick() {
        this.setState({
            popupDetail: null
        });
    }

    handleChatClick(targetPolygon) {
        this.setState({
            popupChat: true
        });
    }

    handleChatCloseClick() {
        this.setState({
            popupChat: false
        });
    }

    render() {
        return (
            <div style={{ height: `100%`, width: '100%' }}>
                <UserLocationGoogleMap
                    containerElement={
                        <div style={{ height: `100%`, width: '100%' }} />
                    }
                    mapElement={
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: -1,
                        }} />
                    }
                    onMapLoad={this.handleMapLoad}
                    //onMapClick={this.handleMapClick}
                    //onMarkerRightClick={this.handleMarkerRightClick}
                    onPolygonClick={this.handlePolygonClick}
                    onPolygonCloseClick={this.handlePolygonCloseClick}
                    onLandDetailClick={this.handleLandDetailClick}
                    onLandDetailCloseClick={this.handleLandDetailCloseClick}
                    onChatClick={this.handleChatClick}
                    onChatCloseClick={this.handleChatCloseClick}
                    center={this.state.center}
                    markers={this.state.markers}
                    infos={this.state.infos}
                    //polygons={this.state.polygons}
                    popupDetail={this.state.popupDetail}
                    popupChat={this.state.popupChat}
                    landInfoWindow={this.state.landInfoWindow}
                    onMapMounted={this.handleMapMounted}
                    onBoundsChanged={this.handleBoundsChanged}
                    onSearchBoxMounted={this.handleSearchBoxMounted}
                    bounds={this.state.bounds}
                    onPlacesChanged={this.handlePlacesChanged}
                    markers={this.state.markers}
                    additionalMayLayer={this.state.additionalMayLayer}
                />
                {this.state.additionalMayLayer.enable && (

                    <div style={{ position: `absolute`, top: `130px`, left: `10px` }}>
                        <select
                            className='form-control'
                            style={{ width: `200px`, boxShadow: `0 5px 6px rgba(0, 0, 0, 0.5)`, backgroundColor: `white` }}
                            onChange={(event) => {
                                console.log(event.target.value);
                                this.setState({
                                    additionalMayLayer: {
                                        enable: true,
                                        type: event.target.value
                                    }
                                });
                            }}
                        >
                            <option value={0}>無（加值圖層）</option>
                            <option value={1}>臺北市行政區</option>
                            <option value={2}>一級經濟發布區</option>
                            <option value={3}>二級經濟發布區</option>
                            <option value={4}>三級經濟發布區</option>
                        </select>
                    </div>
                )}
                <div style={{
                    position: `absolute`,
                    bottom: `50px`,
                    left: `10px`,
                    backgroundColor: `white`,
                    textAlign: `center`,
                    boxShadow: `5px 5px 6px rgba(0, 0, 0, 0.5)`,
                    borderRadius: `4px`,
                    padding: `12px 2px`
                }}>
                    <b>圖例</b><br />
                    <font color="blue">　■ 政府劃定更新地區　</font><br />
                    <font color="red">　■ 自行劃定更新單元　</font><br />
                    <font color="grey">　■ 已失效之更新單元　</font><br />
                </div>
            </div>
        );
    }
}
