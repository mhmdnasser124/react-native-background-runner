import {
  Platform,
  AppRegistry,
  DeviceEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import {
  BackgroundRunner,
  nativeEventEmitter,
} from './BackgroundRunnerPackage';
import EventEmitter from 'eventemitter3';
import { useEffect } from 'react';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
} from 'react-native-permissions';
import { Linking } from 'react-native';
import { Alert } from 'react-native';

class BackgroundServer extends EventEmitter {
  constructor() {
    super();
    this._runnedTasks = 0;
    this._stopTask = () => {};
    this._isRunning = false;
    this._currentOptions;
    this._addListeners();
  }

  _addListeners() {
    nativeEventEmitter.addListener('expiration', () => this.emit('expiration'));
    nativeEventEmitter.addListener('locationUpdate', (location) =>
      this.emit('locationUpdate', location)
    );
  }

  isRunning() {
    return this._isRunning;
  }

  async getCurrentLocation(onSuccess, onError) {
    BackgroundRunner.getCurrentLocation()
      .then((location) => {
        onSuccess(location);
      })
      .catch((error) => {
        onError(error);
      });
  }

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
    }
  }

  _generateTask(task, parameters) {
    const self = this;
    return async () => {
      await new Promise((resolve) => {
        self._stopTask = resolve;
        task(parameters).then(() => self.stop());
      });
    };
  }

  _normalizeOptions(options) {
    return {
      taskName: options.title + this._runnedTasks,
      taskTitle: options.title,
      taskDesc: options.desc,
    };
  }

  async watchLocation() {
    await this.checkPermission(BackgroundRunner.startLocationTracking());
  }

  stopWatching() {
    BackgroundRunner.stopLocationTracking();
  }

  trackLocation() {}

  async stop() {
    this._stopTask();
    await BackgroundRunner.stop();
    this._isRunning = false;
  }

  _locationTrackingService = async (taskData, callback) => {
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

        this.getCurrentLocation(async (location) => {
          if (
            location.longitude !== lastLocation.longitude &&
            location.latitude !== lastLocation.latitude
          ) {
            lastLocation = location;
            callback(location);
          }
        });
      }, trackingDelay);
    });
  };

  startLocationTracker = async (callback, optionsParam) => {
    if (!this._isRunning) {
      try {
        await this.startRunnerTask(async (taskData) => {
          await this._locationTrackingService(taskData, callback);
        }, optionsParam);
        console.log('Successful start!');
      } catch (e) {
        console.log('Error', e);
      }
    }
  };

  showPermissionDialog() {
    Alert.alert(
      'Location Permission',
      'Allow Location Permission.',
      [
        {
          text: 'Go to Settings',
          onPress: () => Linking.openSettings(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  }

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
          this.showPermissionDialog();
        }
      } else {
        this.showPermissionDialog();
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }
}

const backgroundServer = new BackgroundServer();

export default backgroundServer;
