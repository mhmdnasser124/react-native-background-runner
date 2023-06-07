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
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
