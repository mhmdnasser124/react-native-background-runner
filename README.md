# react-native-background-runner

background react native runner

## Installation

```sh
npm install react-native-background-runner
```

## Usage

```js
import Service from 'react-native-background-runner';

// ...

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

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
