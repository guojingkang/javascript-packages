# babel-preset-full-node4

babel preset including es2015, es2016, es2017, stage-0 for node 4.

## Install

```bash
$ npm install babel-preset-full-node4 -D
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "presets": ["full-node4"]
}
```

### Via CLI

```bash
$ babel script.js --presets full-node4
```

### Via Node API

```js
require('babel-core').transform('code', {
  presets: ['full-node4']
});
```


## License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
