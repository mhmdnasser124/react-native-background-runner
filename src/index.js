import { Platform, AppRegistry } from 'react-native';
import {
  BackgroundRunner,
  nativeEventEmitter,
} from './BackgroundRunnerPackage';
import EventEmitter from 'eventemitter3';

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

  watchLocation() {
    BackgroundRunner.startLocationTracking();
  }

  stopWatching() {
    BackgroundRunner.stopLocationTracking();
  }

  async stop() {
    this._stopTask();
    await BackgroundRunner.stop();
    this._isRunning = false;
  }
}

const backgroundServer = new BackgroundServer();

export default backgroundServer;
