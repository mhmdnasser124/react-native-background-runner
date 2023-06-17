import * as React from 'react';
import { useState, useEffect } from 'react'; // Import the useState hook

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
  ToastAndroid,
} from 'react-native';
import Service from 'react-native-background-runner';

const sleep = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

const options = {
  title: 'title',
  desc: 'desc',
  delay: 1000,
};

export default function App() {
  const [runnedValue, setRunnedValue] = useState(0);
  const [location, setLocation] = useState(0);

  useEffect(() => {
    Service.watchLocation();

    DeviceEventEmitter.addListener('locationUpdate', handleLocationUpdate);

    return () => {};
  }, []);

  const handleLocationUpdate = (location) => {
    setLocation(location);
  };

  const watchCurrentLocation = async (taskData) => {
    await new Promise(async () => {
      const { delay } = taskData;
      for (let i = 0; Service.isRunning(); i++) {
        Service.getCurrentLocation((location) => {
          console.log('location=>>> ', location);
          setLocation(location);
        });
        await sleep(delay);
      }
    });
  };

  const task = async (taskData) => {
    await new Promise(async () => {
      const { delay } = taskData;
      for (let i = 0; Service.isRunning(); i++) {
        setRunnedValue(i);
        console.log('Runned -> ', i);
        await sleep(delay);
      }
    });
  };

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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => toggleBackground(task)}
      >
        <Text style={{ color: 'white', alignSelf: 'center' }}>
          Toggle Background Service
        </Text>
      </TouchableOpacity>
      <View style={{ height: 10 }} />
      <TouchableOpacity
        style={styles.buttonTracker}
        onPress={() => toggleBackground(watchCurrentLocation)}
      >
        <Text style={{ color: 'white', alignSelf: 'center' }}>
          Toggle Location Tracker
        </Text>
      </TouchableOpacity>

      <View style={{}}>
        <Text style={styles.runnedValue}>{`Runned -> ${runnedValue}`}</Text>
      </View>
      <View style={{}}>
        <Text
          style={styles.runnedValue}
        >{`latitude -> ${location.latitude}`}</Text>
      </View>
      <View style={{}}>
        <Text
          style={styles.runnedValue}
        >{`longitude -> ${location.longitude}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  runnedValue: {
    fontSize: 18,
    marginTop: 20,
  },
  buttonTracker: {
    height: 50,
    width: 200,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignContent: 'center',
  },
  button: {
    height: 50,
    width: 200,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignContent: 'center',
  },
});
