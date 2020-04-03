import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import stopIcon from './assets/stop.png';
import StopCallout from './StopCallout';
import StopPredictionText from './StopPredictionText'

export default class StopMarker extends React.PureComponent {
    constructor(props) {
        super(props);
        // console.log("StopMarker constructor fired");
        this.state = {
            prediction: "Loading estimates...",
            calloutVisible: false
        };
    }

    hideStopCallout() {
        this.marker.hideCallout();
    }

    showStopCallout() {
        this.marker.showCallout();
    }

    redrawCallout() {
        console.log("Redrawing callout");
        // this.hideStopCallout();
        // this.predictionText.refreshText();
        // this.callout.forceUpdate();
        // this.forceUpdate();
        this.showStopCallout();
        let timer = setTimeout(() => this.showStopCallout(), 1); //Unbelievable that this is the solution smh
        /**
         * https://github.com/react-native-community/react-native-maps/issues/2048
         * https://github.com/react-native-community/react-native-maps/issues/486
         */
    }


    render(){
        return (
            <MapView.Marker
                key={`'marker-actual-' + this.props.stopId`}
                dataIndex={this.props.dataIndex}
                title={this.props.title}
                description={this.state.prediction}
                stopId={this.props.stopId}
                coordinate={this.props.coordinate}
                onPress={this.props.onPress}
                onCalloutPress={this.props.onCalloutPress}
                flat={true}
                icon={stopIcon}
                ref={_marker => {
                    this.marker = _marker;
                }}
                // onPress={() => this.onStopClicked(this)}
            >
                <MapView.Callout 
                    style={styles.callout}
                    key={`'marker-callout-' + this.props.stopId`}
                    ref={_callout => {
                        this.callout = _callout;
                    }}
                    onPress={() => {return null}} //Hacky solution for iOS not triggering onCalloutPress in marker - clicking the callout fires the marker onpress for some reason https://stackoverflow.com/questions/57233394/react-native-maps-callout-press-not-triggering-on-ios
                >
                    <Text style={styles.title}>{this.props.title}</Text>
                    <StopPredictionText 
                        key={`'marker-callout-prediction-text-' + this.state.calloutVisible + this.props.stopId`}
                        prediction={this.state.prediction}
                        ref={_predictionText => {
                            this.predictionText = _predictionText;
                        }}
                    >
                        Loading...
                    </StopPredictionText>
                </MapView.Callout>
            </MapView.Marker>
        );
    }
    // render() {
    //     return (
    //         <MapView.Marker
    //               dataIndex={this.props.dataIndex}
    //               title={this.props.title}
    //               description={"Loading predictions..."}
    //               stopId={this.props.stopId}
    //               coordinate={this.props.coordinate}
    //               onPress={this.props.onPress}
    //               onCalloutPress={this.props.onCalloutPress}
    //               flat={true}
    //               icon={stopIcon}
    //               ref={_marker => {
    //                 this.marker = _marker;
    //               }}
    //               >
    //                 <StopCallout
    //                     title={this.props.title}
    //                     prediction={this.state.prediction}
    //                     ref={_callout => {
    //                         this.callout = _callout;
    //                     }}
    //                 >
    //                 </StopCallout>
    //           </MapView.Marker>
    //     )
    // }
}

const styles = StyleSheet.create({
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        width: Dimensions.get('window').width * 0.80,
    },
    callout: {
        backgroundColor: '#fff',
        width: Dimensions.get('window').width * 0.80,
        height: Dimensions.get('window').height * 0.15,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

/**
<MapView.Callout style={styles.callout}>
    <View>
        <Text>{this.props.title}</Text>
        <Text>{this.state.prediction}</Text>
    </View>
</MapView.Callout>
 */