simple template for node
=================================
Simple but more with dynamic include, syntax/runtime error caught with file path and line no, non-block file render(require `fibext`)

### Installation

```
npm install --save jstr
```

### Simple usage

```javascript
var fibext = require('fibext');
var jstr = require('jstr');
var r = jstr({debug: false});
fibext(function(){
  var output = r.renderFile('/path/to/file.html', {name: 'kiliwalk', arr: [1, 2, 3]});
  console.log(output);
});
```

/path/to/file.html:
```html
<html>
  <body>
    <@name@>
    <ul><!--@for(var i in arr){-->
      <li><@arr[i]@></li><!--@}-->
    </ul>
    <@|include('include/part.html')@>
  </body>
</html>
```

/path/to/include/part.html:
```html
<p>
  <@name@>
</p>
```

### More usages

Please refer to the [test cases](https://github.com/kiliwalk/jstr/tree/master/test) to get more usage examples.

### TODO

* readme
* more test and coverage test

### License

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
