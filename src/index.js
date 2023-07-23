import React from 'react';
import {
  Platform,
  AppRegistry,
  PermissionsAndroid,
  AppState,
  ToastAndroid,
} from 'react-native';
import {
  BackgroundRunner,
  nativeEventEmitter,
} from './BackgroundRunnerPackage';
import EventEmitter from 'eventemitter3';
import { Linking } from 'react-native';
import { Alert } from 'react-native';

/**
 * Wrapper function for iOS-specific functionality.
 * @param {Function} fn - The function to be wrapped.
 * @returns {Function} - The wrapped function.
 */
function IOSWrapper(fn) {
  return function () {
    if (Platform.OS === 'ios') {
      return fn.apply(this, arguments);
    }
  };
}

/**
 * Wrapper function for Android-specific functionality.
 * @param {Function} fn - The function to be wrapped.
 * @returns {Function} - The wrapped function.
 */
function AndroidWrapper(fn) {
  return function () {
    if (Platform.OS === 'android') {
      return fn.apply(this, arguments);
    }
  };
}

/**
 * Wraps the specified functions of an object with the given wrapper function.
 * @param {Object} target - The target object.
 * @param {string[]} functionNames - The names of the functions to be wrapped.
 * @param {Function} wrapper - The wrapper function.
 */
function wrapFunctions(target, functionNames, wrapper) {
  for (const functionName of functionNames) {
    if (
      target.hasOwnProperty(functionName) &&
      typeof target[functionName] === 'function'
    ) {
      target[functionName] = wrapper(target[functionName]);
    }
  }
}

const message = `
Please enable "Allow all the time" access for your location.

1. Go to this app  Settings.
2. Choose "App Permissions".
3. Tap on "Location".
4. Select "Allow all the time".`;

/**
 * Component that sets up the background server and handles app state changes.
 * @param {Object} props - The component props.
 * @returns {JSX.Element} - The component's rendered elements.
 */
export const Runnable = ({ children }) => {
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    backgroundServer._setup();
    backgroundServer._setUpLocationListener();
    // backgroundServer.watchLocation();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        backgroundServer.foreground();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('App has gone to the background!');
        backgroundServer.background();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
};

/**
 * BackgroundServer class for running background tasks and tracking location.
 */
class BackgroundServer extends EventEmitter {
  constructor() {
    super();
    this._runnedTasks = 0;
    this._stopTask = () => {};
    this._isRunning = false;
    this._currentOptions;
    this._addListeners();
    this.isLocationgTrackerRunning = false;
  }

  /**
   * Set up the background server on iOS.
   * This method should be called before using other methods on iOS.
   */
  // [iOS]
  _setup() {
    BackgroundRunner.init();
    BackgroundRunner.setup();
  }

  /**
   * Set up a listener for background events.
   * @param {Function} callback - The callback function to be called when a background event occurs.
   */
  // [iOS]
  _setupBackgroundListener(callback) {
    nativeEventEmitter.addListener('BackgroundEventCallBack', (data) => {
      callback(data);
    });
  }

  /**
   * Set up a listener for Location events.
   * @param {Function} callback - The callback function to be called when a Location event occurs.
   */
  // [iOS]
  _setUpLocationListener() {
    nativeEventEmitter.addListener('location', (data) => {
      // callback(data);
      console.log('location=>> ', data);
    });
  }

  /**
   * Request access to run background tasks.
   * @returns {Promise} - A promise that resolves with the result of the request.
   * @throws {Error} - If an error occurs during the request.
   */
  // [iOS]
  async requestAccess() {
    try {
      const res = await BackgroundRunner.requestAccess();
      return res;
    } catch (e) {
      console.log(e.message, e.code);
      throw e;
    }
  }

  /**
   * Called when the app comes to the foreground.
   */
  // [iOS]
  foreground() {
    BackgroundRunner.foregroundCallBack();
  }

  /**
   * Called when the app goes to the background.
   */
  // [iOS]
  background() {
    BackgroundRunner.backgroundCallBack();
  }

  /**
   * Check if the app has access to run background tasks.
   * @returns {Promise} - A promise that resolves with the result of the check.
   * @throws {Error} - If an error occurs during the check.
   */
  // [iOS]
  async _hasAccess() {
    try {
      const res = await BackgroundRunner.hasAccess();
      console.log(res);
      return res;
    } catch (e) {
      console.log(e.message, e.code);
      throw e;
    }
  }

  /**
   * Add event listeners for background events.
   */
  _addListeners() {
    nativeEventEmitter.addListener('expiration', () => this.emit('expiration'));
    nativeEventEmitter.addListener('locationUpdate', (location) =>
      this.emit('locationUpdate', location)
    );
  }

  /**
   * Check if the background server is running.
   * @returns {boolean} - `true` if the server is running, `false` otherwise.
   */
  isRunning() {
    return this._isRunning;
  }

  /**
   * Start a background runner task.
   * @param {Function} task - The task to be executed in the background.
   * @param {Object} options - Additional options for the task.
   */
  async startRunnerTask(task, options) {
    this._runnedTasks++;
    this._currentOptions = this._normalizeOptions(options);
    const finalTask = this._generateTask(task, { delay: options.delay });
    if (Platform.OS === 'android') {
      AppRegistry.registerHeadlessTask(
        this._currentOptions.taskName,
        () => finalTask
      );
      await BackgroundRunner.start(this._currentOptions);

      this._isRunning = true;
    } else if (Platform.OS === 'ios') {
      try {
        const hasAccess = await this._hasAccess();
        if (hasAccess) {
          const { delay } = options;
          await BackgroundRunner.startLongProcess(task);
          this._isRunning = true;
        } else {
          this.requestAccess();
        }
      } catch (error) {
        this.requestAccess();
        console.log('Error occurred:', error);
      }
    }
  }

  /**
   * Generate a task function for the background runner.
   * @param {Function} task - The task function to be executed.
   * @param {Object} parameters - Additional parameters for the task.
   * @returns {Function} - The generated task function.
   */
  _generateTask(task, parameters) {
    const self = this;
    return async () => {
      await new Promise((resolve) => {
        self._stopTask = resolve;
        task(parameters).then(() => self.stop());
      });
    };
  }

  /**
   * Normalize the options for a background runner task.
   * @param {Object} options - The task options.
   * @returns {Object} - The normalized options.
   */
  _normalizeOptions(options) {
    return {
      taskName: options.title + this._runnedTasks,
      taskTitle: options.title,
      taskDesc: options.desc,
    };
  }

  /**
   * Stop watching the device location.
   */
  // [ANDROID]
  stopWatching() {
    this.stop();
    this.isLocationgTrackerRunning = false;
    BackgroundRunner.stopLocationTracking();
  }

  /**
   * Stop the background runner and the currently running task.
   */
  async stop() {
    this._stopTask();

    await BackgroundRunner.stop();

    if (Platform.OS === 'ios')
      nativeEventEmitter.removeAllListeners('BackgroundEventCallBack');
    this._isRunning = false;
  }

  /**
   * Background task function for location tracking.
   * @param {Object} taskData - The task data.
   * @param {Function} callback - The callback function to be called on location updates.
   */
  // [ANDROID]
  async locationTrackingService(taskData, callback) {
    let lastLocation = { longitude: 0, latitude: 0 };

    await new Promise(async (resolve) => {
      const { delay } = taskData;
      const trackingDelay = delay || 3000;

      const intervalId = setInterval(async () => {
        if (!this._isRunning) {
          clearInterval(intervalId);
          resolve();
          return;
        }

        BackgroundRunner.getCurrentLocation()
          .then((location) => {
            if (
              !!location &&
              location.longitude !== lastLocation.longitude &&
              location.latitude !== lastLocation.latitude
            ) {
              lastLocation = location;
              callback(location);
            }
          })
          .catch((error) => {});
      }, trackingDelay);
    });
  }

  /**
   * Get the current device location.
   * @param {Function} onSuccess - Success callback function that receives the location.
   * @param {Function} onError - Error callback function that receives the error.
   */
  // [ANDROID]
  async getCurrentLocation(onSuccess, onError) {
    try {
      const permissionsStatus = await this.checkLocationPermissions();
      if (
        permissionsStatus.fineLocation &&
        permissionsStatus.backgroundLocation
      ) {
        BackgroundRunner.startLocationTracking();
        BackgroundRunner.getCurrentLocation()
          .then((location) => {
            onSuccess(location);
          })
          .catch((error) => {
            onError(error);
          });
      } else {
        this.showPermissionDialog({
          message: message,
        });
        console.log('Location permissions: ', permissionsStatus);
      }
    } catch (error) {
      console.error(error);
      onError(error);
    }
  }

  startLocationTracking() {
    if (!this.isLocationgTrackerRunning) {
      BackgroundRunner.startLocationTracking();
    }
    this.isLocationgTrackerRunning = true;
  }

  /**
   * Start the location tracker task.
   * @param {Function} callback - The callback function to be called on location updates.
   * @param {Object} optionsParam - Additional options for the location tracker.
   */
  // [ANDROID]
  async watchLocation(callback, optionsParam) {
    try {
      const permissionsStatus = await this.checkLocationPermissions();
      if (
        permissionsStatus.fineLocation &&
        permissionsStatus.backgroundLocation
      ) {
        if (!this._isRunning) {
          try {
            BackgroundRunner.startLocationTracking();
            this.startRunnerTask(async (taskData) => {
              await this.locationTrackingService(taskData, callback);
            }, optionsParam);
            console.log('Successful start!');
          } catch (e) {
            console.log('Error', e);
          }
        }
      } else {
        this.showPermissionDialog({
          message: message,
        });
        console.log('Location permissions: ', permissionsStatus);
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Show a permission dialog for location access.
   */
  // [ANDROID]
  async showPermissionDialog({
    message = 'Please enable "Allow All the Time" for full app functionality. Tap OK to open settings.',
    callback = () => Linking.openSettings(),
  }) {
    Alert.alert(
      'Location Tracking',
      message,
      [
        {
          text: 'OK',
          onPress: callback,
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * Check if the app has location permission and request it if not granted.
   * @param {Function} onSuccess - Success callback function to be called when permission is granted.
   */
  // [ANDROID]
  async checkPermission(onSuccess) {
    try {
      const backgroundLocationPermission =
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
      const fineLocationPermission =
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

      const grantedFineLocation = await PermissionsAndroid.request(
        fineLocationPermission
      );

      if (grantedFineLocation === PermissionsAndroid.RESULTS.GRANTED) {
        const grantedBackgroundLocation = await PermissionsAndroid.request(
          backgroundLocationPermission
        );

        if (grantedBackgroundLocation === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the location');
          onSuccess && onSuccess();
        } else {
          await this.showPermissionDialog();
        }
      } else {
        await this.showPermissionDialog();
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  async checkLocationPermissions() {
    try {
      const backgroundLocationPermission =
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
      const fineLocationPermission =
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

      // Check if both fine and background location permissions are already granted
      const fineLocationStatus = await PermissionsAndroid.check(
        fineLocationPermission
      );
      const backgroundLocationStatus = await PermissionsAndroid.check(
        backgroundLocationPermission
      );

      // If both permissions are already granted, return true
      if (fineLocationStatus && backgroundLocationStatus) {
        return { fineLocation: true, backgroundLocation: true };
      }

      // Request both permissions one after the other if not already granted
      const grantedFineLocation = fineLocationStatus
        ? PermissionsAndroid.RESULTS.GRANTED
        : await PermissionsAndroid.request(fineLocationPermission);

      const grantedBackgroundLocation = backgroundLocationStatus
        ? PermissionsAndroid.RESULTS.GRANTED
        : await PermissionsAndroid.request(backgroundLocationPermission);

      const permissionsStatus = {
        fineLocation:
          grantedFineLocation === PermissionsAndroid.RESULTS.GRANTED,
        backgroundLocation:
          grantedBackgroundLocation === PermissionsAndroid.RESULTS.GRANTED,
      };

      if (
        permissionsStatus.fineLocation &&
        permissionsStatus.backgroundLocation
      ) {
        // Permissions granted, return true
        return permissionsStatus;
      } else {
        // Permissions not granted, show a message to the user and return false
        await this.showPermissionDialog();
        ToastAndroid.show(
          'Please enable location permissions',
          ToastAndroid.LONG
        );
        return permissionsStatus;
      }
    } catch (err) {
      console.warn(err);
      return { fineLocation: false, backgroundLocation: false };
    }
  }
}

// Wrap iOS-specific methods with the IOSWrapper
const iosWrappedFunctions = [
  '_setup',
  'requestAccess',
  'foreground',
  '_hasAccess',
  'background',
  '_setUpLocationListener',
];
wrapFunctions(BackgroundServer.prototype, iosWrappedFunctions, IOSWrapper);

// Wrap Android-specific methods with the AndroidWrapper
const androidWrappedFunctions = [
  '_addListeners',
  'startLocationTracker',
  'getCurrentLocation',
  'watchLocation',
  'stopWatching',
  'checkLocationPermissions',
];
wrapFunctions(
  BackgroundServer.prototype,
  androidWrappedFunctions,
  AndroidWrapper
);

// Create an instance of BackgroundServer
const backgroundServer = new BackgroundServer();

export default backgroundServer;
