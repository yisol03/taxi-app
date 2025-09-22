import 'react-native-get-random-values';

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import Taxiapp from './src/Taxiapp';
import { name as appName } from './app.json';
//import Taxiapp from './src/Taxiapp';

// AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent(appName, () => Taxiapp);
