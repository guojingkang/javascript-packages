'use strict';

module.exports = Menu;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function Menu(instance){
  this.instance = instance;
}
var proto = Menu.prototype;

//menus=[{name:, type:, value:, children:}]
proto.create = function(menus){
  var data = {button:[]};
  menus = menus || [];
  for(var i in menus){
    var menu = menus[i];
    var button = {name: menu.name};
    menu.type = menu.type.toLowerCase();
    if(menu.type==='click') button.key = menu.value;
    else if(menu.type==='view') button.url = menu.value;

    if(!menu.children || menu.children.length<=0){
      button.type = menu.type;
    }else{
      button.sub_button = [];
      for(var j in menu.children){
        var subMenu = menu.children[j];
        var subButton = {name: subMenu.name, type: subMenu.type};
        subMenu.type = subMenu.type.toLowerCase();
        if(subMenu.type==='click') subButton.key = subMenu.value;
        else if(subMenu.type==='view') subButton.url = subMenu.value;
        button.sub_button.push(subButton);
      }
    }
    data.button.push(button);
  }

  var token = this.instance.getAccessToken();
  var url = 'https://api.WeiXin.qq.com/cgi-bin/menu/create?access_token='+token;
  var fiber = fibext();
  hr.post(url, {json: data}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  fiber.wait();
};