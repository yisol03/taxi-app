import { JSX } from 'react';
import { Alert, StyleSheet } from 'react-native';
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

export type RootStackParamList = {
  Intro: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  NickName: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

messaging().setBackgroundMessageHandler(
  async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);
  },
);

function TaxiApp(): JSX.Element {
  console.log('-- TaxiApp()');

  const getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
    await AsyncStorage.setItem('fcmToken', fcmToken);
    console.log('fcmToken : ', fcmToken);
  };

  useEffect(() => {
    getFcmToken();
    const unsubscribe = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          console.log('[Remote Message]', JSON.stringify(remoteMessage));
          let title = remoteMessage.notification?.title || '';
          let body = remoteMessage.notification?.body || '';

          Alert.alert(title, body, [{ text: '확인', style: 'cancel' }]);
        }
      },
    );
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro">
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

export default TaxiApp;
