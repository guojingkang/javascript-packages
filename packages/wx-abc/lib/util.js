'use strict';

var util = module.exports = require('util');
util.md5 = md5;
util.sha1 = sha1;
util.processResponse = processResponse;
util.onError = onError;
util.xml2json = xml2json;
util.json2xml = json2xml;

var Buffer = require("buffer").Buffer;
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var xml2js = require('xml2js');
var xmlBuilder = new xml2js.Builder();

function md5(data) {//support chinese
  var buf = new Buffer(data);
  var str = buf.toString("binary");
  return crypto.createHash("md5").update(str).digest("hex");
}

function sha1(str){
  return crypto.createHash('sha1').update(str).digest('hex');
}

//when call wx api, process the reponse of it
function processResponse(cb){
  return function(err, resp, body){
    if(err) return cb(err);
    if(resp.statusCode>=400 || !body){
      return cb(new Error(util.format('unknown error to call weixin api: %s, %s', resp.statusCode, body)));
    }
    if(body.errcode){//body may be a xml string or a json object
      var e = new Error(util.format('error to call weixin api: %s, %s', body.errcode, body.errmsg));
      e.code = body.errcode;
      return cb(e);
    }
    return cb(null, body);
  };
}

function onError(err){
  if(!err) return;

  if((this.listenerCount && this.listenerCount('error')<=0) || EventEmitter.listenerCount(this, 'error')<=0){
    console.error('caught an error in wx instance: %s', err.stack || err.toString());//eslint-disable-line no-console
  }
  else{
    this.emit('error', err);
  }
}

function xml2json(xml){
  var body;
  xml2js.parseString(xml, {explicitRoot: false, explicitArray: false}, function(err, data){
    if(err) throw err;
    body = data;
  });
  return body;
}

function json2xml(json){
  return xmlBuilder.buildObject(json);
}