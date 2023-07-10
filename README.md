# 🌟react-native-background-runner🌟

- [Installation](#Installation)
- [Features](#Features)
- [Preview](#Preview)
- [Demo For Location Tracker (ANDROID ONLY)](<#Demo-For-Location-Tracker-(ANDROID-ONLY)>)
- [IOS Setup](#IOS-Setup)
- [Android Setup](#Android-Setup)
- [Usage](#Usage)
- [License](#License)

&nbsp;

## Installation

- #### Through Yarn:
```shell
yarn add react-native-background-runner
```

-  #### Through NPM:
```shell
npm install react-native-background-runner
```

&nbsp;

## Features 🚀🚀

- #### 🛠️ Background Problem Solver: Our package is designed to tackle background-related issues on both iOS and Android platforms.

- #### 🧪 Test Phase: We are currently in the initial testing phase, with many exciting enhancements on the way.


- #### 🏃‍♂️ Background Runner on iOS: We've implemented a unique solution using the Location Core API trick to ensure seamless background running on iOS.


- #### 📍 Live Background Location Tracker (Android): Our package includes a powerful live background location tracker specifically built for Android devices.**


- #### 🆕 Coming Soon to iOS: Stay tuned for the upcoming release, which will include background location tracking functionality for iOS as well.


&nbsp;

## Preview

| Platform | Demo |
| :-----: | :---: |
| **IOS** |   <img alt='demo-ios' src='https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/ios_background_runner.gif' height="350" /> | <img alt='demo-ios'  | 
| **Android** |  <img alt='demo-android' src='https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/android-background-runner.gif' height="350" />   |


&nbsp;


## Demo-For-Location-Tracker-(ANDROID-ONLY)


| Traking Demo (Android only) | Gif Demo |
| :-----: | :---: |
| **Basic Demo** |   <img alt='demo-ios' src='https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/LocationTracker.gif' height="300" /> | <img alt='demo-ios'  | 
| **Live Demo** |  <img alt='demo-android' src='https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/live_demo.gif' height="300" />   |


&nbsp;

## IOS-Setup

Let us not forget the mandatory strings
**`NSLocationAlwaysAndWhenInUseUsageDescription`** and **`NSLocationWhenInUseUsageDescription`** inside Our `Info.plist.` These are needed to display the permissions popup.

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/infoplist.png 'info plist')

set the right capabilities for app

![alt text](https://github.com/mhmdnasser124/react-native-background-runner/blob/main/Screenshots/capabilities.png 'capabilities')

&nbsp;

## Android-Setup

Add the following code to android/app/src/main/AndroidManifest.xml:

```diff
<manifest ...>
  ...
  <application ...>
    ...
+    <service android:name="com.backgroundrunner.BackgroundRunnerTask" />
  </application>
</manifest>
```

After adding the code to the AndroidManifest.xml file, save the changes and continue with the Usage instructions.

&nbsp;
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
&nbsp;

## License

MIT

---

