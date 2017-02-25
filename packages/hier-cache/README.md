cache with hierachical stores and keys
=================================

**DEPRECATED**

### Features

* normal get/mget/set/del and batch operation
* sync-style operation(get/mget/set/del), which should be run in [fibext](https://www.npmjs.com/package/fibext) or [fibers](https://www.npmjs.com/package/fibers)
* multiple stores(mem/file/redis/mongodb...) with priority
* hierachical key, like a/b, a/b/c


### Usage

#### `new Cache(options)`

create a new cache object, with multiple stores. you can set the following options:

* `stores`: store's array, the header store the highest priority. Each store has the common options:
    * `class`: the store class, which can be the package name string, or the require return
    * `ttl`: the store-based key expired interval(ms)

if you do not set the `stores` option, a internal `MemStore` will be used. it can also be retreived by `require('hier-cache').MemStore`.

```js
var Cache = require('hier-cache');

//use the internal MemStore
var cache = new Cache();
...

//create a cache with a memory store and a file store
var cache = new Cache({stores: [
  {class: Cache.MemStore},
  {class: 'hier-cache-file-store', dir: './cache', ttl: 0}
]});

```

#### `set(key, value, [options])` 

* Alias 1: `set(key1, value1, key2, value2, ..., [options])` 
* Alias 2: `set([key1, value1, key2, value2, ...], [options])` 
* Alias 3: `set({key1: value1, key2: value2, ...}, [options])` 
* Async: `setAsync`

```js
cache.set('key', value);
cache.set('a/b/c', value);
```

#### `get(key)` 

* Async: `getAsync` 

return the key's value. if the key is missing, `undefined` will be returned

#### `mget(key1, key2, ...)` 

* Alias 1: `mget([key1, key2, ...])` 
* Async: `mgetAsync`

return the key-value pair. if all keys are missing, `undefined` will be returned. 
it will try the highest priority store first for all keys. if find some, then try the remain keys for lower priority stores until all keys retreived

#### `del(key1, key2, ...)` 

* Alias 1: `del([key1, key2, ...])` 
* Async: `delAsync` 

remove the key(s). you can also supply `RegExp` objects as the params

### Stores

* [internal memory store](#Usage)
* [hier-cache-file-store](https://www.npmjs.com/package/hier-cache-file-store)

### TODO

* backfill option for set the missing key in prior stores from the following stores

## License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
