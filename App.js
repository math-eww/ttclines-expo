import React from 'react';
import { StyleSheet, View, Text, StatusBar, Button, Dimensions, AsyncStorage } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';

import StopMarker from './StopMarker';
const API = require('./API');
import stopIcon from './assets/stop.png';
import IconButton from './IconButton';

export default class App extends React.Component {
  state = {
    mapRegion: {
      latitude: 43.6532,
      longitude: -79.3832,
      latitudeDelta: 0.00922,
      longitudeDelta: 0.00421,
    },
    mapBoundaries: null,
    zoomLevel: null,
    hasLocationPermissions: false,
    locationResult: null,
    isLoading: true,
    stopsData: [],
  };

  dataApi = new API();
  stopMarkersOnMap = {};
  map = null;


  async fetchMarkerData() {
    let savedStopsData = await this.getCachedData("stopsCache");
    if (savedStopsData != null) {
      console.log("Loaded cached stops list");
      this.setState({ 
        stopsData: JSON.parse(savedStopsData),
        isLoading: true, //Why does this work when set to true but not false like it should be? Clearly trying to render markers before the map bounds are set is causing an issue but wtf?
      });
      let savedDirectionsData = await this.getCachedData("directionsData");
      if (savedDirectionsData != null) {
        this.directionsData = JSON.parse(savedStopsData);
      }
    } else {
      this.refreshCachedData();
    }
  }
  
  async refreshCachedData() {
    console.log("Refreshing API");
    let response = await this.dataApi.loadAllStops();
    console.log("Loaded API stops list");
    this.setState({ 
      stopsData: response['stops'],
      isLoading: false,
    });
    this.directionsData = response['directions'];
    this.cacheData("stopsCache", JSON.stringify(response['stops']));  
    this.cacheData("directionsData", JSON.stringify(response['directions']));
    // console.log(JSON.stringify(response));
  }

  async cacheData(key, data) {
    try {
      await AsyncStorage.setItem(key, data);
    } catch (error) {
      console.log("Error caching data", error)
    }
  }

  async getCachedData(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        // console.log(value);
        return value
      }
      return null
    } catch (error) {
      // Error retrieving data
      console.log("Error getting cached data", error);
      return null
    }
  }

  async componentDidMount() {
    this.getLocationAsync();
    this.fetchMarkerData();
  }

  handleMapRegionChangeComplete = newMapRegion => {
    this.setState({ 
      mapRegion: newMapRegion,
      mapBoundaries: this.getBoundingBox(newMapRegion),
      zoomLevel: Math.round(Math.log(360 / newMapRegion.longitudeDelta) / Math.LN2) 
    });
  };

  getBoundingBox = (region) => ([
    region.longitude - region.longitudeDelta/2, // westLng - min lng
    region.latitude - region.latitudeDelta/2, // southLat - min lat
    region.longitude + region.longitudeDelta/2, // eastLng - max lng
    region.latitude + region.latitudeDelta/2 // northLat - max lat
  ]);

  async getLocationAsync () {
    // permissions returns only for location permissions on iOS and under certain conditions, see Permissions.LOCATION
    const { status, permissions } = await Permissions.askAsync(
      Permissions.LOCATION
    );
    if (status === 'granted') {
      this.setState({ hasLocationPermissions: true });
      //  let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
      let location = await Location.getCurrentPositionAsync({});
      // Center the map on the location we just fetched.
      console.log("Got first user location. Centering map on user...");
      this.setState({
        locationResult: JSON.stringify(location),
        mapRegion: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.00922,
          longitudeDelta: 0.00421,
        },
      });
      if (this.map !== null) {
        this.map.animateToRegion(this.state.mapRegion);
      } else {
        setTimeout(() => {this.map.animateToRegion(this.state.mapRegion)}, 10);
      }
      // Continually update user location
      Location.watchPositionAsync({
        accuracy: Location.Accuracy.Low,
        timeInterval: 5000,
      }, locationUpdate => {
        this.setState({
          locationResult: JSON.stringify(locationUpdate),
        });
      });
    } else {
      alert('Location permission not granted');
    }
  };

  async centerOnUserLocation() {
    console.log("Centering map on user location");
    if (this.state.hasLocationPermissions) {
      Location.getLastKnownPositionAsync().then(
        location => {
          this.setState({
            locationResult: JSON.stringify(location),
            mapRegion: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.00922,
              longitudeDelta: 0.00421,
            },
          });
          this.map.animateToRegion(this.state.mapRegion);
        },
        error => {
          console.log(error);
        }
      )
    } else {
      alert('Location permission not granted');
    }
  }

  
  async onStopClicked(stop) {
    console.log("Stop Marker pressed", stop);
    this.updateDescriptionPredictionText(stop);
  }

  async onPredictionClicked(stop) {
    console.log("Prediction pressed", stop);
    this.updateDescriptionPredictionText(stop);
  }

  async updateDescriptionPredictionText(stop) {
    let prediction = await this.dataApi.loadPredictionString(stop);
    let stopClicked = this.stopMarkersOnMap[stop];
    stopClicked.setState({
      prediction: prediction
    });
    stopClicked.redrawCallout();
  }

  render() {
    Platform.OS === 'ios' ? StatusBar.setBarStyle('dark-content', true) : null;
    // StatusBar.setTranslucent(true);
    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapStyle}
          initialRegion={this.state.mapRegion}
          onRegionChangeComplete={this.handleMapRegionChangeComplete}
          showsUserLocation={true}
          // showsMyLocationButton={true} // Doesn't work on android - see issues https://github.com/react-native-community/react-native-maps/issues/2010 https://github.com/react-native-community/react-native-maps/issues/1033
          customMapStyle={customStyle}
          ref={ _map => { this.map = _map }}
        >
        {
          // If isLoading, return null, if zoom level is 13 or lower, return null
          this.state.isLoading && !(this.state.zoomLevel > 13) ? null : 
          // Else load a list of stopsData on the map
          Object.keys(this.state.stopsData).map((stopDataIndex) => {
            let stop = this.state.stopsData[stopDataIndex];
            //Check if within bounds
            if (stop.lat > this.state.mapBoundaries[1] && //greater than min latitude
                  (stop.lat < this.state.mapBoundaries[3]) && //less than max latitude
                  (stop.lon > this.state.mapBoundaries[0]) &&
                  (stop.lon < this.state.mapBoundaries[2])) {    
              const coords = {
                latitude: stop.lat,
                longitude: stop.lon,
              };
              const stopMarkerToAdd = 
              <StopMarker
                  key={stop.stopId}
                  dataIndex={stopDataIndex}
                  title={stop.title}
                  description={"Loading predictions..."}
                  stopId={stop.stopId}
                  coordinate={coords}
                  onPress={() => this.onStopClicked(stop.stopId, stopDataIndex)}
                  onCalloutPress={() => this.onPredictionClicked(stop.stopId, stopDataIndex)}
                  ref={ref => {
                    this.stopMarkersOnMap[stop.stopId] = ref;
                  }}
                  flat={true}
                  icon={stopIcon}
                  >
              </StopMarker>
              return (
                stopMarkerToAdd
              );
            }
          })
        }
        </MapView>

        <View
          style={styles.refreshButtonViewStyle}
        >
          <IconButton
            onPress={e => this.refreshCachedData(e)}
            name={"refresh"}
            backgroundColor={"#777777"}
            text={""}
            size={60}
          ></IconButton>
        </View>

        <View
          style={styles.myLocationButtonViewStyle}
        >
          <IconButton
            onPress={e => this.centerOnUserLocation(e)}
            name={"location-arrow"}
            backgroundColor={"#777777"}
            text={""}
            size={60}
          ></IconButton>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapStyle: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: -1,
  },
  refreshButtonViewStyle: {
    marginTop: Expo.Constants.statusBarHeight,
    position: 'absolute',
    top: 5,
    left: 5,
    alignSelf: 'flex-start',
    zIndex: 10
  },
  myLocationButtonViewStyle: {
    marginTop: Expo.Constants.statusBarHeight,
    position: 'absolute',
    // top: 5,
    bottom: 5,
    right: 5,
    alignSelf: 'flex-end',
    zIndex: 10
  }
});

const customStyle = [
  {
      "stylers": [
          {
              "visibility": "on"
          },
          {
              "saturation": -100
          },
          {
              "gamma": 0.54
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "water",
      "stylers": [
          {
              "color": "#4d4946"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels.text",
      "stylers": [
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#ffffff"
          }
      ]
  },
  {
      "featureType": "road.local",
      "elementType": "labels.text",
      "stylers": [
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#ffffff"
          }
      ]
  },
  {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
          {
              "gamma": 0.48
          }
      ]
  },
  {
      "featureType": "transit.station",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "gamma": 7.18
          }
      ]
  }
];