import { NativeEventEmitter, NativeModules } from 'react-native';

const { BackgroundRunner } = NativeModules;

const nativeEventEmitter = new NativeEventEmitter(BackgroundRunner);

export { BackgroundRunner, nativeEventEmitter };
