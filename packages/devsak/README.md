Commands for [devsak-cli](https://github.com/kiliwalk/devsak-cli)
=================================

**DEPRECATED**

## 如果从devsak依赖转为自主控制:
* 假设目标目录为dist, 源目录为src
* 修改package.json
  * 复制如下依赖到库的devDependencies里:

```
    "babel-cli": "^6.5.1",
    "babel-plugin-transform-es2015-destructuring": "^6.9.0",
    "babel-plugin-transform-runtime": "^6.12.0",
    "babel-preset-es2015": "^6.9.0",
    "babel-preset-react": "^6.11.1",
    "babel-preset-stage-0": "^6.5.0",
    "babel-register": "^6.5.2",
    "mocha": "^2.4.5",
```
  * 修改scripts:

```
  "lint": "eslint src",
  "clean": "rm -rf dist",
  "build": "babel -D -d dist src",
  "watch": "babel -w -D -d dist src",
  "test": "mocha --timeout 10000 --recursive --reporter spec --bail --compilers js:babel-register test/**/*.test.js",
```

2. 

## License

Licensed under MIT

Copyright (c) 2016 [kiliwalk](https://github.com/kiliwalk)
