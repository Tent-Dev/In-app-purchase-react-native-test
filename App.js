import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import RNLibIapTest from '../my-app/screens/RNLibIapTest';
import 'react-native-gesture-handler';
import MainNavigation from './navigation/MainNavigation';
//import { NavigationContainer } from '@react-navigation/native';
export default function App() {
  return (
    //<NavigationContainer>
    //<RNLibIapTest />
    <MainNavigation />
    //</NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
