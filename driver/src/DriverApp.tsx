import { JSX } from 'react';
import { SafeAreaView, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Intro from './Intro';
import Login from './Login';
import Register from './Register';
import Main from './Main';
import NickNameScreen from './Main_Settin_NickName';

const Stack = createStackNavigator();

messaging().setBackgroundMessageHandler(
  async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('[background remote message]', remoteMessage);
  },
);

function DriverApp(): JSX.Element {
  console.log('-- DriverApp()');

  const getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', fcmToken);
    console.log('fcmToken : ', fcmToken);
  };

  useEffect(() => {
    getFcmToken();
    messaging().onMessage(remoteMessage => {
      console.log('[remote message]', JSON.stringify(remoteMessage));
      let title = '';
      let body = '';
      if (remoteMessage.notification && remoteMessage.notification.title) {
        title = remoteMessage.notification.title;
      }
      if (remoteMessage.notification && remoteMessage.notification.body) {
        body = remoteMessage.notification.body;
      }
      Alert.alert(title, body, [{ text: '확인', style: 'cancel' }]);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Intro"
          component={Intro}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ headerShown: true, title: '회원가입' }}
        />
        <Stack.Screen
          name="Main"
          component={Main}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NickName"
          component={NickNameScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  textBlack: {
    fontSize: 18,
    color: 'black',
  },
  textBlue: {
    fontSize: 18,
    color: 'blue',
  },
});

export default DriverApp;
