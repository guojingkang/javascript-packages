flat and relational model orm
=================================

Inspired by siebel business component.

## Example
```js
const Frm = require('frm');

//defined the instance for db connection
const frm = new Frm({
  "protocol": "mysql",
  "host": "127.0.0.1",
  "port": 3306,
  "database": "test",
  "user": "test",
  "password": "test",
  "charset": "utf8mb4"
})

//define the model
const FeedOrder = frm.model('FeedOrder', {
  feedId: {type: String, length: 32, required: true},
  memberId: {type: String, length: 32, required: true},
  createdAt: 'Timestamp',
  status: {type: String, length: 32, required: true, prevDefault: 'new'},
  main: {type: Boolean, virtual: true},
}, {
  indexes: [
    {fields: ['memberId', 'feedId'], unique: true, message: 'Already bought'},
    {fields: ['feedId', 'createdAt']},
  ]
});

require('./feed');
const Feed = frm.model('Feed')

FeedOrder.def.add('join', {model: Feed, on: [{type: 'field', column: 'id', value: 'feedId'}]})
FeedOrder.def.add('field', {
  feedMemberId: {type: String, join: Feed, column: 'member_id'},
})

//use the model to do CRUD operations
const orders = await FeedOrder.find({fields: 'feedId,feedMemberId,status,main', filter: {memberId: 'xxxxx'}, sort: '-createdAt', limit: 10}));

//generate and write database schema
await frm.ensure();

```

## API
Most methods return promise, so you can use `await model.method()`.
* `model.create(row)`: create a record, this method does NOT return promise. use `record.save()` to write to db
* `model.find({fields: string|array, filter: object, sort: string, offset: number, limit: number})`: query, return records array.
* `model.findOne()`: same parameters like `find()`, but return the first found record
* `model.findAll({fields: string|array, filter: object, sort: string, limit: number, pageSize: number}, cb)`: find all records page by page. `cb` is `(records)` function, support promise return;
* `model.count(filter: object)`: 
* `model.exists(filter: object)`:
* `model.insert(rows: object|array)`: batch create records and save to db
* `model.update({set: object, filter: object})`: directly update matched records in db
* `model.remove({filter: object, limit: number})`: directly remove matched reocrds in db
* `model.increase({set: object, filter: object})`: make the field increment/decrement in db
* `record.save()`: save the new record or updated record to db
* `reocrd.copy()`:
* `record.remove()`: remove the record in db

### Filter
Inspired by mongodb.
* `{a: 1, b: {$gt: 1}, c: [1, 2, 3], d: '*h*'}`: equals to sql `where a=1 and b>1 and c in (1, 2, 3) and d like '%h%'`
* `{$or: [{a: 1}, {b: 2}]}`: equals to sql `where a=1 or b=2`

## License

Licensed under MIT

Copyright (c) 2016 [kiliwalk](https://github.com/kiliwalk)
