import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  DeviceEventEmitter,
  Platform,
  ToastAndroid,
  LogBox,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import Service from 'react-native-background-runner';
import { Runnable } from 'react-native-background-runner';

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

const sleep = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

const options = {
  title: 'title',
  desc: 'desc',
  delay: 1000,
};

export default function App() {
  const [runnedValue, setRunnedValue] = useState(0);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationPermission, setLocationPermission] = useState(false);
  const [running, setTaskRunning] = useState(Service.isRunning());

  useEffect(() => {
    checkLocationPermission();

    Service.watchLocation();

    if (Platform.OS !== 'ios')
      DeviceEventEmitter.addListener('locationUpdate', handleLocationUpdate);

    return () => {};
  }, []);

  useEffect(() => {
    if (!locationPermission) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Location permission required', ToastAndroid.LONG);
      } else if (Platform.OS === 'ios') {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permission to proceed.',
          [
            {
              text: 'Grant Location',
              onPress: () => {
                Service.requestAccess();
                setLocationPermission(true);
              },
            },
          ]
        );
      }
    }
  }, [locationPermission]);

  const handleLocationUpdate = (location) => {
    setLocation(location);
  };

  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      setLocationPermission(granted);
    }
  };

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

  const toggleBackground = async (runnerTask) => {
    if (!Service.isRunning()) {
      try {
        await Service.startRunnerTask(runnerTask, options);
        setTaskRunning(true);
        console.log('Successful start!');
      } catch (e) {
        console.log('Error', e);
      }
    } else {
      console.log('Stop background service');
      setTaskRunning(false);
      await Service.stop();
    }
  };

  const renderLocationTracker = () =>
    Platform.OS === 'android' && (
      <>
        <View style={{ height: 10 }} />
        <TouchableOpacity
          style={styles.buttonTracker}
          onPress={() =>
            Service.startLocationTracker(
              (location) => console.log('location=>>> ', location),
              options
            )
          }
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
      </>
    );

  return (
    <Runnable>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => toggleBackground(task)}
        >
          <Text style={{ color: 'white', alignSelf: 'center' }}>
            {running ? 'Stop' : 'Start Background Service'}
          </Text>
        </TouchableOpacity>
        {renderLocationTracker()}
      </View>
    </Runnable>
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
