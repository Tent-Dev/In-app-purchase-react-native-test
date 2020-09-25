import React from 'react';
import { StyleSheet, Text, View, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import RNIap from 'react-native-iap';
//import { TouchableOpacity } from 'react-native-gesture-handler';

class History extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            availableItemsMessage: '',
            receipt: [],
        }
    }

    componentDidMount() {
        this.getAvailablePurchases();
        this.props.navigation.addListener('focus', () => {
            console.log('Focus History screen.');
            this.getAvailablePurchases();
        });
    }

    clear = async () => {
        await RNIap.consumeAllItemsAndroid();
        await this.getAvailablePurchases();
        Alert.alert('Clear');
    }

    getAvailablePurchases = async () => {
        this.setState({ receipt: [] });
        try {
            console.info(
                'Get available purchases (non-consumable or unconsumed consumable)',
            );
            const purchases = await RNIap.getAvailablePurchases();
            // var arr = [];
            // var receiptData = JSON.parse(purchases[0].transactionReceipt);
            // arr.push(receipt)
            console.info('Available purchases :: ', purchases);
            if (purchases && purchases.length > 0) {
                this.setState({
                    availableItemsMessage: `Got ${purchases.length} items.`,
                    receipt: purchases,
                });
            } else {
                this.setState({
                    availableItemsMessage: `Got 0 items.`,
                });
            }
        } catch (err) {
            console.log(err.code, err.message);
        }
    };

    render() {
        return (
            <View style={styles.container}>
                <ScrollView>
                    <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 30 }}>
                        <TouchableOpacity onPress={this.clear} style={{ padding: 10, backgroundColor: '#000', borderRadius: 10, marginTop: 20, marginBottom: 20 }}>
                            <Text style={{ color: '#fff' }}>Clear Purchases Data</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'flex-start' }}>
                        <Text>Restore Data</Text>
                        <Text>{this.state.availableItemsMessage}</Text>
                        <View style={{ marginTop: 20 }}>
                            {this.state.receipt.map((item, index) => {
                                return (
                                    <View key={index} style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}>
                                        <Text>Order Id: {item.orderId}</Text>
                                        <Text>Product Id: {item.productId}</Text>
                                        <Text>Transaction Id: {item.transactionId}</Text>
                                        <Text>Transaction Date: {item.transactionDate}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                </ScrollView>
            </View >
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        //alignItems: 'center',
        justifyContent: 'center',
    },
});

export default History;