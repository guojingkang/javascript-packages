two-types and chain errors for user and bug in node
=================================

**DEPRECATED**

```js
var e2 = require('2e'), UserError = e2.UserError, BugError = e2.BugError;
throw new UserError('xxx');
throw new UserError(400, 'xxx');
throw new UserError(err, 'xxx');//caused by another error `err`
throw new UserError(err, 400, 'xxx');
```

## License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
