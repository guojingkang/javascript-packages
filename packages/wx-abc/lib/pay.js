'use strict';

module.exports = Pay;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function Pay(instance, merchantId, merchantKey, pfx){
  this.instance = instance;
  this.merchantId = merchantId;
  this.merchantKey = merchantKey;
  this.pfx = pfx;
}
var proto = Pay.prototype;

//options should has openId/tradeNo/amount/notifyUrl/desc
//amount uom: ¥0.01
proto.prepay = function(options){
  options || (options = {});
  var params = {
    appid: this.instance.appId, 
    mch_id: this.merchantId,
    nonce_str: ~~(Date.now()/1000)+'',
    body: options.desc,
    //detail: options.orderDesc,
    //attach: '',
    out_trade_no: options.tradeNo,
    // fee_type: 'CNY',
    total_fee: ~~options.amount,//uom: ¥0.01
    spbill_create_ip: options.ip || '',
    // time_start: 
    notify_url: options.notifyUrl,
    trade_type: options.tradeType || 'JSAPI',
    openid: options.openId,
    attach: options.attach || '',
  };

  var url = 'https://api.mch.WeiXin.qq.com/pay/unifiedorder';
  var body = post.call(this, 'weixin prepay', false, url, params);

  var result = {nonceStr: Math.random().toString(36).substr(2, 15), 
    timeStamp: ~~(Date.now()/1000), signType: 'MD5',
    appId: this.instance.appId, package: 'prepay_id='+body.prepay_id};
  result.sign = paySign.call(this, result);

  //make timestamp same to timeStamp, so that the client jssdk may not concern the capital
  result.timestamp = result.timeStamp;

  return result;
};

//when user payed, weixin server will notify the result.
//after called this method, you should respond the `response` 
//to weixin server immediately to avoid weixin server resend 
//the notify. then do the rest business work
proto.notify = function(reqXml){
  var body = util.xml2json(reqXml);

  //check sign
  var sign = paySign.call(this, body);
  if(sign!==body.sign){
    throw new Error('invalid sign of weixin pay notification');
  }
  body = xml2json('parse weixin pay notification', reqXml);

  var response = util.json2xml({xml: {
    return_code: 'SUCCESS',
    return_msg: 'OK',
  }});
  return {
    response: response,
    tradeNo: body.out_trade_no,//local order id
    amount: body.total_fee,
    transactionId: body.transaction_id,//weixin transaction id
    attach: body.attach,
  };
};

//options should has openId/tradeNo/amount/name/wish/ip/activity/remark
//amount: [100-20000], uom: ¥0.01
proto.sendRedPacket = function(options){
  options || (options = {});
  var params = {
    wxappid: this.instance.appId, 
    mch_id: this.merchantId,
    nonce_str: ~~(Date.now()/1000)+'',
    mch_billno: options.tradeNo,
    send_name: options.name,//merchant name
    re_openid: options.openId,
    total_amount: ~~options.amount,
    total_num: 1,
    wishing: options.wish,//wish message, like "Happy Spring Festival"
    client_ip: options.ip,//server ip
    act_name: options.activity,//activity name
    remark: options.remark,
  };
  var url = 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack';
  var body = post.call(this, 'red packet', true, url, params);
  return {
    tradeNo: options.tradeNo,
    transactionId: body.send_listid,
  };
};

function post(method, ssl, url, params){
  params.sign = paySign.call(this, params);
  var xml = util.json2xml({xml: params});

  var options = {
    url: url,
    body: xml,
    headers: {'Content-Type': 'text/xml'},
  };

  if(ssl){
    options.agentOptions = {
      pfx: this.pfx,
      passphrase: this.merchantId,
      securityOptions: 'SSL_OP_NO_SSLv3'
    };
  }

  var fiber = fibext();
  hr.post(options, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();

  return xml2json(method, body);
}

//convert response xml to json
function xml2json(method, body){
  body = util.xml2json(body);

  if(body.return_code!=='SUCCESS'){
    throw new Error(util.format('api error to call %s: %s', method, body.return_msg));
  }
  if(body.result_code!=='SUCCESS'){
    throw new Error(util.format('business error to call %s: %s %s', method, body.err_code, body.err_code_des));
  }
  return body;
}

function paySign(params, signType){
  signType || (signType = 'MD5');

  var str = sort(params);
  str += '&key='+this.merchantKey;
  return util.md5(str).toUpperCase();
}

function sort(params) {
  var keys = Object.keys(params);
  keys = keys.sort();

  var string = '';
  for (var i in keys) {
    var k = keys[i];
    if(!params[k] && 0!==params[k]) continue;//ignore empty(except 0)
    if(k==='sign') continue;
    string += '&' + k + '=' + params[k];
  }
  string = string.slice(1);
  return string;
}
