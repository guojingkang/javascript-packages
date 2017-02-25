javascript style configuration file support
=================================
you can write a conf file without json strict limit. you can add comments(`//`, `/**/`), enclose string in single-quote or without quote for key, call a function and so on.

### Usage
#### readFile(file, options, callback)
Sync: `readFileSync(file, options)`
It will return the conf object, a plain javascript object. options are the same that you'd pass to node `fs.readFile`, and you can pass the varible/function to the options too. see the example:

#### conf file
```javascript
/*
  multiple-line comment
 */
{
  i: 1,
  b: true,
  f: 1.1,
  s: 'abc',//single line comment
  s1: 'abc'.toUpperCase(),
  s2: append('abc'),//call a function, which should be passed in the options
}
```

#### read the conf file
```javascript
var jc = require('js-conf');
var conf = jc.readFileSync(confFilePath, {encoding: 'utf8', append: function(str){
  return str+'d';
}});
console.log(conf);
```
the output
```
{ i: 1, b: true, f: 1.2, s: 'abc', s1: 'ABC', s2: 'abcd' }
```


### Sublime Text Linter for js-conf file
You can use the [SublimeLinter-eslint](https://github.com/roadhump/SublimeLinter-eslint) to linter this style conf file, but with a little change in the file.
you should put a `(` at the beginning and `);` at the end of the file. and for the function, you may need to push a eslint global or eslint-disable no-undef to pass the lint
```javascript
/*eslint-global append*/
({
  i: 1,
  b: true,
  f: 1.1,
  s: 'abc',
  s1: 'abc'.toUpperCase(),
  s2: append('abc'),
});
```

## License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
