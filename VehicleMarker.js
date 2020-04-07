import React from 'react';
// import { StyleSheet, Dimensions } from 'react-native';
import MapView, { AnimatedRegion } from 'react-native-maps';
import vehicleIcon from './assets/bus.png';

export default class VehicleMarker extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // coordinate: this.props.coordinate
            coordinate: new AnimatedRegion({
                latitude: this.props.coordinate.latitude,
                longitude: this.props.coordinate.longitude,
                latitudeDelta: 0,
                longitudeDelta: 0
            }),
        };
    }

    animateToNewCoordinate(newCoordinate) {
        const { coordinate } = this.state;
        // Perform animation
        // if (Platform.OS === 'android') {
          // console.log(this.vehicleMarkersOnMap[vehicleKey]._component);
        //   this.marker._component.animateMarkerToCoordinate(newCoordinate, 500);
        // } else {
          coordinate.timing(newCoordinate).start();
        // }
    }

    render(){
        return (
            <MapView.Marker.Animated
                key={'vehicle' + this.props.vehicleId}
                title={this.props.title}
                description={this.props.description}
                vehicleId={this.props.vehicleId}
                coordinate={this.state.coordinate}
                // onPress={this.props.onPress}
                // onCalloutPress={this.props.onCalloutPress}
                flat={true}
                icon={vehicleIcon}
                ref={_marker => {
                    this.marker = _marker;
                }}
            ></MapView.Marker.Animated>
        );
    }
}

// VehicleMarker.propTypes = {
//     provider: ProviderPropType,
// };