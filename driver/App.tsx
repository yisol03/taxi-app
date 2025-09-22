import { JSX } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Intro from './src/Intro';
import Login from './src/Login';
import Main from './src/Main';
import Register from './src/Register';
import Main_Settin_NickName from './src/Main_Settin_NickName';

// ==================================================================
//
// ==================================================================
function App(): JSX.Element {
  console.log('--- App()');

  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro">
        <Stack.Screen name="Intro" component={Intro} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen
          name="Main"
          component={Main}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main_Settin_NickName"
          component={Main_Settin_NickName}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;