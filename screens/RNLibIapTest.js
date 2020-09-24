import React from 'react';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import RNIap, { purchaseErrorListener, purchaseUpdatedListener } from 'react-native-iap';
import { TouchableOpacity } from 'react-native-gesture-handler';
let purchaseUpdateSubscription;
let purchaseErrorSubscription;
const itemSkus = Platform.select({
    ios: [
        'com.cooni.point1000',
        'com.cooni.point5000', // dooboolab
    ],
    android: [
        'android.test.purchased',
        'android.test.canceled',
        'android.test.refunded',
        'android.test.item_unavailable',
        // 'point_1000', '5000_point', // dooboolab
    ]
});

class RNLibIapTest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [],
            receipt: '',
            availableItemsMessage: '',
        }
    }
    componentDidMount = async () => {
        console.log('Select item from: ', itemSkus);

        try {
            const result = await RNIap.initConnection();
            await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
            console.log('initConnection', result);
        } catch (err) {
            console.log('initConnection ERR: ', err.code, err.message);
        }

        try {
            const products = await RNIap.getProducts(itemSkus);
            this.setState({ products: products });
            console.log('Get product: ', products);
        } catch (err) {
            console.log('Get products list fail: ', err);
        }

        purchaseUpdateSubscription = purchaseUpdatedListener((purchase) => {
            console.log('purchaseUpdatedListener', purchase);
            this.setState({
                receipt: purchase.transactionReceipt
            },
                () => this.goNext()
            );
        });
        purchaseErrorSubscription = purchaseErrorListener((error) => {
            console.log('purchaseErrorListener', error);
            Alert.alert('purchase error', JSON.stringify(error));
        });
    }

    componentWillUnmount() {
        if (purchaseUpdateSubscription) {
            purchaseUpdateSubscription.remove();
            purchaseUpdateSubscription = null;
        }
        if (purchaseErrorSubscription) {
            purchaseErrorSubscription.remove();
            purchaseErrorSubscription = null;
        }
        RNIap.endConnection();
    }

    goNext = () => {
        Alert.alert('Receipt', this.state.receipt);
    };

    requestPurchase = async (sku) => {
        try {
            RNIap.requestPurchase(sku);
        } catch (err) {
            console.log(err.code, err.message);
        }
    };

    //   requestSubscription = async (sku) => {
    //     try {
    //       RNIap.requestSubscription(sku);
    //     } catch (err) {
    //       Alert.alert(err.message);
    //     }
    //   };

    // getAvailablePurchases = async () => {
    //     try {
    //       console.info(
    //         'Get available purchases (non-consumable or unconsumed consumable)',
    //       );
    //       const purchases = await RNIap.getAvailablePurchases();
    //       console.info('Available purchases :: ', purchases);
    //       if (purchases && purchases.length > 0) {
    //         this.setState({
    //           availableItemsMessage: `Got ${purchases.length} items.`,
    //           receipt: purchases[0].transactionReceipt,
    //         });
    //       }
    //     } catch (err) {
    //       console.log(err.code, err.message);
    //       Alert.alert(err.message);
    //     }
    //   };

    render() {
        return (
            <View style={styles.container}>
                <Text style={{ marginBottom: 30, fontSize: 30 }}>In app purchase</Text>
                <View style={{ alignItems: 'flex-start' }}>
                    {this.state.products.map((item) => {
                        return (
                            <TouchableOpacity onPress={() => this.requestPurchase(item.productId)} style={{ marginBottom: 20, padding: 10, borderRadius: 15, borderWidth: 1 }}>
                                <Text>{item.title}</Text>
                                <Text>{item.description}</Text>
                                <Text>ราคา {item.localizedPrice}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RNLibIapTest;