import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import StopPredictionText from './StopPredictionText'

export default class StopCallout extends React.PureComponent {
    constructor(props) {
        super(props);
        // console.log("StopCallout constructor fired");
    }
    render() {
        return (
            <MapView.Callout style={styles.callout}>
                <View style={styles.container}>
                    <Text style={styles.title}>{this.props.title}</Text>
                    <StopPredictionText prediction={this.props.prediction}>Loading...</StopPredictionText>
                </View>
            </MapView.Callout>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: Dimensions.get('window').width * 0.80
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        alignSelf: 'baseline'
    },
    callout: {
        backgroundColor: '#fff',
        width: Dimensions.get('window').width * 0.80
    }
});