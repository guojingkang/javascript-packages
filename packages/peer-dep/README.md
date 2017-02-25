peer dependency check
=================================

**DEPRECATED**

### Installation

```
npm install --save peer-dep
```

### Usage

Add `optionalPeerDependencies` in `package.json` file, then use the script below to check:

```js
var pd = require('peer-dep');
pd(module, 'mysql', {required: true});//require the `mysql` peer module
```

### API

#### pd(module, [peerDepsName], [options])

* module: the `module` object in the file
* peerDepsName: string/array[string]/true. the peer modules name to check. true for all in the `optionalPeerDependencies`
* options: true/object. true={require: true, strict: true}
    * required: default false. if true, thrown when the peer modules not found
    * strict: defalt false. if true, throw when the version of the peer module not satisfies the version range in `optionalPeerDependencies`, otherwise `console.warn`

### Coverage

```
=============================== Coverage summary ===============================
Statements   : 98.25% ( 56/57 )
Branches     : 96.67% ( 29/30 )
Functions    : 100% ( 2/2 )
Lines        : 100% ( 51/51 )
================================================================================
```

### License

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
