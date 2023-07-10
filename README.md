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
```diff
+   <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
+	  <string>App Uses Location Services to allow background operations while performing long running tasks,  this insures data integrity on our side, and offers a better user experience</string>
+	  <key>NSLocationWhenInUseUsageDescription</key>
+	  <string>App Uses Location Services to allow background operations while performing long running tasks, this insures data integrity on our side, and offers a better user experience</string>
```

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
### Wrapper Component
To handle the lifecycle of your app, use the Runnable wrapper component. Place your app component within the Runnable component as follows:

```js
<Runnable>
  {/* Your app component */}
</Runnable>
```

&nbsp;

### Background Task
**To perform a background task, follow these steps:**

- Define an asynchronous task function that takes taskData as a parameter. This function can have different implementations based on the platform.
```javascript
const task = async (taskData) => {
  if (Platform.OS === 'android') {
    await new Promise(async () => {
      const { delay } = taskData;
      for (let i = 0; Service.isRunning(); i++) {
        setRunnedValue(i);
        console.log('Runned -> ', i);
        await sleep(delay);
      }
    });
  } else if (Platform.OS === 'ios') {
    console.log('IOS task -> ', taskData);
  }
};
```

- Use the toggleBackground function to control the background task. It checks if the background service is running and either starts or stops it accordingly.
```javascript
const toggleBackground = async (runnerTask) => {
  if (!Service.isRunning()) {
    try {
      await Service.startRunnerTask(runnerTask, options);
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
Call **`toggleBackground(task)`** to start or stop the background task.

&nbsp;

### Location Tracker
For now, the location tracker only supports **`Android`**. Use the following methods to work with the location tracker:

- Start watching the user's location:
```javascript
Service.watchLocation();
```
- Stop watching the user's location:
```javascript
Service.stopWatching();
```

- Listen for location update events:
```javascript
DeviceEventEmitter.addListener('locationUpdate', handleLocationUpdate);
```

- Get the current location:
```javascript
Service.getCurrentLocation((location) => {
  console.log('location => ', location);
  // Your location logic here
});
```
- Track location even if the app is closed:
```javascript
Service.startLocationTracker(
  (location) => console.log('location =>>> ', location),
  options
);
```
>**⚠️ Please note that the location tracker is currently only supported on Android.**

&nbsp;

## License

MIT

---

