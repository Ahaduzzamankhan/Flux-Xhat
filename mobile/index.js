import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { AppRegistry } from 'react-native';
import App from './App';
global.Buffer = global.Buffer || Buffer;

AppRegistry.registerComponent('PrivateChatMobile', () => App);
