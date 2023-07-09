# react-native-background-runner

background react native runner

## Installation

```sh
npm install react-native-background-runner
```

## Demo

### Demo Ios Background Task

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/ios_background_runner.gif 'Ios Background Runner')

#### Demo For Location Tracker (ANDROID ONLY)

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/LocationTracker.gif 'Location Tracker')

#### Demo On Live App

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/live_demo.gif 'Location Tracker')

## IOS Setup

Let us not forget the mandatory strings
**`NSLocationAlwaysAndWhenInUseUsageDescription`** and **`NSLocationWhenInUseUsageDescription`** inside Our `Info.plist.` These are needed to display the permissions popup.

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/infoplist.png 'info plist')

set the right capabilities for app

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/capabilities.png 'capabilities')

## Android Setup

Add the following code to android/app/src/main/AndroidManifest.xml:

```xml
<manifest ...>
  ...
  <application ...>
    ...
    <service android:name="com.backgroundrunner.BackgroundRunnerTask" />
  </application>
</manifest>
```

After adding the code to the AndroidManifest.xml file, save the changes and continue with the Usage instructions.

## Usage

```js
import Service from 'react-native-background-runner';

// ...

// Start watching the user's location
Service.watchLocation();

// Stop watching the user's location
Service.stopWatching();

// Listen for location update events
DeviceEventEmitter.addListener('locationUpdate', handleLocationUpdate);

// Get the current location
Service.getCurrentLocation((location) => {
  console.log('location => ', location);
  /// your location logic here
});

// Track location even if the app closed
Service.startLocationTracker(
  (location) => console.log('location=>>> ', location),
  options
);

const options = {
  title: 'title',
  desc: 'desc',
  delay: 1000,
};

const task = async (taskData) => {
  await new Promise(async (resolve) => {
    const { delay } = taskData;
    for (let counter = 0; Service.isRunning(); counter++) {
      console.log('Task is running ', counter);
      await sleep(delay);
    }
  });
};

const StartBackgroundService = async () => {
  if (!Service.isRunning()) {
    try {
      await Service.startRunnerTask(task, options);
      console.log('Successful start!');
    } catch (e) {
      console.log('Error', e);
    }
  } else {
    console.log('Stop background service');
    await Service.stop();
  }
};
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---
