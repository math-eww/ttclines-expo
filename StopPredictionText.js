import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default class StopPredictionText extends React.PureComponent {
    refreshText() {
        this.forceUpdate();
    }
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.predictionText}>{this.props.prediction}</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: 'baseline',
        justifyContent: 'center',
        alignItems: 'center',
    },
    predictionText: {
      backgroundColor: '#fff',
    //   flexShrink: 1,
    }
});