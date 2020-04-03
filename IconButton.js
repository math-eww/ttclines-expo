import React from 'react';
import { StyleSheet, View, } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default class IconButton extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    styles = StyleSheet.create({
        button: {
            borderRadius: this.props.size/2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            color: 'transparent'
        },
        icon: {
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: 'transparent',
            color: 'white',
            marginRight: 0,
        },
        container: {
            width: this.props.size,
            height: this.props.size,
            borderRadius: this.props.size/2,
            backgroundColor: this.props.backgroundColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }
    });

    render(){
        return (
            <View style={this.styles.container}>
                <FontAwesome.Button 
                    name={this.props.name} 
                    backgroundColor={'transparent'}
                    onPress={this.props.onPress}
                    style={this.styles.button}
                    iconStyle={this.styles.icon}
                >
                    {this.props.text}
                </FontAwesome.Button>
            </View>
        );
    }
}