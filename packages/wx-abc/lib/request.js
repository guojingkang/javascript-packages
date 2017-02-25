'use strict';

module.exports = create;

var util = require('./util');

function create(xml, instance){
  var body = util.xml2json(xml);

  var req = {instance: instance};
  req.type = body.MsgType.toLowerCase();
  req.openId = body.FromUserName;//from open id
  req.instanceId = body.ToUserName;//instance open id
  req.created = body.CreateTime*1000;//ms

  if(req.type==='text'){
    req.text = body.Content;
  }
  else if(req.type==='event'){
    req.event = body.Event.toLowerCase();
    req.key = body.EventKey;
    req.ticket = body.Ticket;
  }
  return req;
}