import React from 'react';
import { AsyncStorage, Dimensions, LogBox } from 'react-native';
import { StyleSheet, Text, View, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import RNIap, { purchaseErrorListener, purchaseUpdatedListener, finishTransaction } from 'react-native-iap';
//import { TouchableOpacity } from 'react-native-gesture-handler';
const { width, height } = Dimensions.get('screen');
const SCREEN_WIDTH = width < height ? width : height;
const box_width = (SCREEN_WIDTH - (10 * 2)) / 2;
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
            subscription: [],
            receipt: '',
            availableItemsMessage: '',
            account_detail: [],
            account_type: ''
        }
    }
    componentDidMount = async () => {
        LogBox.ignoreAllLogs();
        this.getAccount();
        this.props.navigation.addListener('focus', () => {
            console.log('Focus Home screen.');
            this.getAccount();
        });

        console.log('Select item from: ', itemSkus);


        try {
            const result = await RNIap.initConnection();
            console.log('initConnection', result);
            const consumed = await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
            //const consumedOld = await RNIap.consumeAllItemsAndroid();
            console.log('consumed all items?', consumed)
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

        try {
            const subscription = await RNIap.getSubscriptions(itemSkus);
            this.setState({ subscription: subscription });
            console.log('Get subscription: ', subscription);
        } catch (err) {
            console.log('Get subscription list fail: ', err);
        }

        purchaseUpdateSubscription = purchaseUpdatedListener(
            async (purchase) => {
                const receipt = purchase.transactionReceipt;
                if (receipt) {
                    try {
                        var receiptData = JSON.parse(receipt);
                        //Get transactionReceipt before finishTransaction
                        //....ex save to database
                        //await AsyncStorage.setItem('Account', JSON.stringify(receipt));
                        //....
                        if (receiptData.productId == 'android.test.purchased') {
                            await AsyncStorage.setItem('Account', 'premium');
                        }
                        const ackResult = await finishTransaction(purchase); //true = consumeable, false = non-consumeable
                    } catch (ackErr) {
                        console.log('ackErr', ackErr);
                    }

                    this.setState({ receipt }, () => this.goNext());
                }
            },
        );

        purchaseErrorSubscription = purchaseErrorListener((error) => {
            console.log('purchaseErrorListener', error);
            if (error.code == 'E_ALREADY_OWNED') {
                Alert.alert('คุณซื้อสินค้านี้ไปแล้ว', '', [{ text: 'ตกลง' }]);
            }
            //Alert.alert('purchase error', JSON.stringify(error));
        });
    }

    // getStorage = async () => {
    //     //const jsonValue = await AsyncStorage.getItem('Account');

    //     if (jsonValue !== null) {
    //         this.setState({ account_detail: JSON.parse(jsonValue) });
    //     }
    // }

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
        Alert.alert('ทำการสั่งซื้อสำเร็จ', 'ยินดีด้วย คุณได้อัพเกรดเป็นระดับ Premium แล้ว', [{ text: 'ตกลง' }]);
        console.log('Receipt: ', this.state.receipt)
        this.getAccount();
    };

    getAccount = async () => {
        var getType = await AsyncStorage.getItem('Account');
        if (getType == 'premium') {
            this.setState({ account_type: 'premium' });
        } else {
            this.setState({ account_type: '' });
        }
    }

    requestPurchase = async (sku) => {
        try {
            RNIap.requestPurchase(sku);
        } catch (err) {
            console.log('requestPurchase Error: ', err.code, err.message);
        }
    };

    requestSubscription = async (sku) => {
        try {
            RNIap.requestSubscription(sku);
        } catch (err) {
            console.log('requestSubscription Error: ', err.code, err.message);
        }
    };

    //สำหรับเรียกดูของที่ซื้อไปแล้วแบบ non-consumable เพื่อใช้ Restoring Purchases หรือทำอย่างอื่นต่อ
    //ถ้าเก็บ transaction ไว้ใน database เรา สามารถเช็คเองได้ ไม่ต้องใช้ getAvailablePurchases()
    getAvailablePurchases = async () => {
        const newState = { premium: false, ads: true }
        let restoredTitles = [];
        try {
            console.info(
                'Get available purchases (non-consumable or unconsumed consumable)',
            );
            const purchases = await RNIap.getAvailablePurchases();
            console.info('Available purchases :: ', purchases);
            if (purchases && purchases.length > 0) {
                purchases.forEach(purchase => {
                    switch (purchase.productId) {
                        case 'android.test.purchased':
                            newState.premium = true
                            AsyncStorage.setItem('Account', 'premium').then(() => {
                                this.setState({ account_type: 'premium' });
                                restoredTitles.push('Premium Version');
                            });

                            break

                        case 'com.example.no_ads':
                            newState.ads = false
                            restoredTitles.push('No Ads');
                            break
                    }
                })

                Alert.alert('Restore Successful', 'You successfully restored the following purchases:\n' + restoredTitles.join(', '));
            } else {
                Alert.alert('Can\'t Restore', 'Your purchase is null');
                console.log('Restore is Empty');
            }
            // if (purchases && purchases.length > 0) {
            //     this.setState({
            //         availableItemsMessage: `Got ${purchases.length} items.`,
            //         receipt: purchases[0].transactionReceipt,
            //     });
            // } else {
            //     this.setState({
            //         availableItemsMessage: `Got 0 items.`,
            //     });
            // }
        } catch (err) {
            console.log(err.code, err.message);
        }
    };

    render() {
        return (
            <View style={styles.container}>
                <ScrollView>
                    <View>
                        {this.state.account_type == 'premium' &&
                            <View>
                                <View style={{ position: 'absolute', left: '30%', top: 50, padding: 5, borderBottomWidth: 1, width: '30%', borderColor: '#D5BC49' }}>
                                    <Text>{null}</Text>
                                </View>
                                <View style={{ position: 'absolute', left: '55%', top: 70, padding: 5, borderRadius: 10, backgroundColor: '#D5BC49' }}>
                                    <Text style={{ fontSize: 10 }}>Premium Account</Text>
                                </View>
                            </View>
                        }

                        <Text style={{ marginTop: 30, fontSize: 30, textAlign: 'center' }}>In app purchase</Text>
                    </View>
                    <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 60 }}>
                        <TouchableOpacity onPress={this.getAvailablePurchases} style={{ padding: 10, backgroundColor: '#000', borderRadius: 10 }}>
                            <Text style={{ color: '#fff' }}>Restore Purchases</Text>
                        </TouchableOpacity>
                    </View>
                    <View>
                        <Text style={{ marginBottom: 20, textAlign: 'center' }}>requestPurchase Type</Text>
                    </View>
                    <View style={{ justifyContent: 'space-evenly', flexDirection: 'row', flexWrap: 'wrap' }}>
                        {this.state.products.map((item, index) => {
                            return (
                                <TouchableOpacity key={index} onPress={() => this.requestPurchase(item.productId)} style={[{ marginBottom: 20, padding: 10, borderRadius: 15, borderWidth: 1, width: box_width }, item.productId == 'android.test.purchased' && { borderColor: '#C7B45C' }]}>
                                    <Text style={item.productId == 'android.test.purchased' && { color: '#D5BC49' }}>{item.productId == 'android.test.purchased' ? 'Premium Version' : item.title}</Text>
                                    <Text>{item.description}</Text>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}> {item.localizedPrice}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                    <View style={{ borderBottomWidth: 1, width: '70%', marginBottom: 20, alignSelf: 'center' }}>
                        < Text > {null}</Text>
                    </View>
                    <View>
                        <Text style={{ marginBottom: 20, textAlign: 'center' }}>requestSubscription Type</Text>
                    </View>
                    <View style={{ justifyContent: 'space-evenly', flexDirection: 'row', flexWrap: 'wrap' }}>
                        {this.state.subscription.map((item, index) => {
                            return (
                                <TouchableOpacity key={index} onPress={() => this.requestSubscription(item.productId)} style={[{ marginBottom: 20, padding: 10, borderRadius: 15, borderWidth: 1, width: box_width }, item.productId == 'android.test.purchased' && { borderColor: '#C7B45C' }]}>
                                    <Text style={item.productId == 'android.test.purchased' && { color: '#D5BC49' }}>{item.productId == 'android.test.purchased' ? 'Premium Version' : item.title}</Text>
                                    <Text>{item.description}</Text>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}> {item.localizedPrice}</Text>
                                </TouchableOpacity>
                            )
                        })}
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
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RNLibIapTest;