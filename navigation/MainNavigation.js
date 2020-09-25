import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RNLibIapTest from '../screens/RNLibIapTest';
import History from '../screens/History';

//const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainNavigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Home" component={RNLibIapTest} options={{ title: 'In app purchase' }} />
                <Tab.Screen name="History" component={History} options={{ title: 'History' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default MainNavigation;