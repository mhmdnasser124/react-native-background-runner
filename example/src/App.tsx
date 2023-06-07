import * as React from 'react';
import { useState } from 'react'; // Import the useState hook

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Service from 'react-native-background-runner';

const sleep = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

const options = {
  title: 'title',
  desc: 'desc',
  delay: 1000,
};

export default function App() {
  const [runnedValue, setRunnedValue] = useState(0); // Initialize state variable

  const task = async (taskData) => {
    await new Promise(async (resolve) => {
      const { delay } = taskData;
      for (let i = 0; Service.isRunning(); i++) {
        setRunnedValue(i); // Update the state variable
        console.log('Runned -> ', i);
        await sleep(delay);
      }
    });
  };

  const toggleBackground = async () => {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{
          height: 50,
          width: 200,
          backgroundColor: 'red',
          justifyContent: 'center',
          alignContent: 'center',
        }}
        onPress={() => toggleBackground()}
      >
        <Text style={{ color: 'white', alignSelf: 'center' }}>
          Toggle Background Service
        </Text>
      </TouchableOpacity>

      <View style={{}}>
        <Text style={styles.runnedValue}>{`Runned -> ${runnedValue}`}</Text>
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
});
