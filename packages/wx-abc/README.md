weixin package for simple usage
=================================
weixin server-side package for simple usage

### Installation

```
npm install --save wx-abc
```

### Features

* surpport multiple weixin app instances
* fully or basically surpport `message`, `cs`(custom service), `jssdk`, `media`, `menu`, `oauth`, `pay`(include red packet), `qrcode`, `tmessage`(template message)
* `message` module support middlewares like [tier](https://github.com/kiliwalk/tier)(or `express`), use `wx.message.use(fn, ...)` or `wx.message.text(fn, ...)` or `wx.message.event(fn,...)`
* most modules need to be run in fiber stack to make sync run style, so you need [fibext](https://github.com/kiliwalk/fibext).

### Usage

Please refer to the [test cases](https://github.com/kiliwalk/wx-abc/tree/master/test) to get more usage examples.

### Test

* copy the file `test/fixtures/params-example.json` to `params.json` in the same dir, and set the corresponding params. 
* copy the weixin pay cert file to `test/fixtures/apiclient_cert.p12`

### TODO

* more api support
* readme
* more test and coverage test

### License

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
