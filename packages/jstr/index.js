'use strict';

// <!--@...@-->:code here, like if/for/var 
// <!--@...-->: same as <!--@...@-->
// <@...@>: expression here, which will be escaped and echoed 
// <@|...@>: not escaped

var fibext = require('fibext');
var fs = require('fs');
var readFile = fibext.wrap(fs.readFile);
var checkSyntaxError = require('syntax-error');
var path = require('path');
var pathIsAbsolute = path.isAbsolute?path.isAbsolute: require('path-is-absolute');

var defaults = {
  debug: false,
  warn: true,
  cache: false,//false for no cache, true for inner cache, other object for specified cache handler
};
var reDelim = /(<!--@[\|=]?|<@\|?)((?:.|\n|\r)*?)(@>|@?-->)/g;
var reNewline = /\r?\n/g;

var cachedFuncs = {};//inner cache

module.exports = function(options){
  options || (options = {});
  for(var kk in defaults){
    if(!options.hasOwnProperty(kk)) options[kk] = defaults[kk];
  }
  var cache = options.cache;
  if(cache){
    //if the sepecifiy cache handler is not valid, use inner cache
    if(cache!==true && (!cache.set || !cache.get )) cache = true;
  }

  function renderFile(filePath, vars) {
    return render(readFile(filePath, {encoding: 'utf8'}), vars, filePath);
  }

  function render(html, vars, filePath) {
    vars || (vars = {});
    var context = {vars: vars, file: filePath?filePath: __filename};

    //inject built-in support functions
    vars.escape = escape;
    vars.include = include.bind(context);
    vars.require = require;

    var ret, script;
    try{
      var func;
      if(filePath && cache){
        var cacheKey = 'jstr-func/'+encodeURIComponent(filePath);
        if(true===cache) func = cachedFuncs[cacheKey];
        else func = cache.get(cacheKey);

        if(typeof func !== 'function') func = null;
        if(!func){
          ret = genFunction(html, filePath, options);
          func = ret.func, script = ret.script;
        }

        if(true===cache) cachedFuncs[cacheKey] = func;
        else cache.set([cacheKey, func]);
      }
      else{
        ret = genFunction(html, filePath, options);
        func = ret.func, script = ret.script;
      }

      return func.call(vars);
    }catch(e){
      onerror(e, script, filePath);
    }
  }

  //include other file with the same context(with())
  function include(filePath, extraVars) {
    if(!pathIsAbsolute(filePath)){
      filePath = path.resolve(path.dirname(this.file), filePath);
    }

    var vars = {};
    for(var ii in this.vars){
      vars[ii] = this.vars[ii];
    }
    if(extraVars){
      for(var jj in extraVars){
        vars[jj] = extraVars[jj];
      }
    }
    return render(readFile(filePath, {encoding: 'utf8'}), vars, filePath);
  }

  return {render: render, renderFile: renderFile};
};

function genFunction(html, filePath, options){
  var script = ['var __r=[],__p=__r.push.bind(__r);with(this){'];
  script = parse(html, script, filePath);
  if(options.debug){
    console.log('the compiled template of file '+filePath+':\n'+script.replace(/\r/g, '').replace(/^/gm, '   '));//eslint-disable-line no-console
  }
  try{
    return {func: new Function(script), script: script};
  }catch(e){
    onerror(e, script, filePath);
  }
}

//parse the html string to js script
function parse(html, script, filePath){
  var m, index = 0;//the index in the html string
  while(m = reDelim.exec(html)) {
    addLiteral(script, html.slice(index, m.index));//string
    addCode(script, m, filePath);
    index = m.index + m[0].length;
  }
  addLiteral(script, html.slice(index));
  script.push('\n}return __r.join("");');
  script = script.join('');
  return script;
}

//the literal, which is out of delimiters, like @>literal here<@
function addLiteral(script, str){
  if(!str) return;
  str = str.replace(/\\|'/g, '\\$&');// escape '

  var m, index = 0;
  while(m = reNewline.exec(str)){
    var nl = m[0];
    var es = nl==='\r\n'? '\\r\\n':'\\n';
    script.push("__p('" + str.slice(index, m.index) + es + "');\n");
    index = m.index + nl.length;
  }
  var last = str.slice(index);
  if(last) script.push("__p('" + last + "');");
}

//the code, which is in the delimiters
function addCode(script, match, filePath) {
  var leftDeli = match[1], code = match[2];
  if(leftDeli==='<@' || leftDeli==='<!--@='){
    script.push('__p(escape(' + code + '));');
  }
  else if(leftDeli==='<@|' || leftDeli==='<!--@|'){//no escape
    script.push('__p(' + code + ');');
  }
  else{//<!--@ -->
    script.push(code);

    //possible single-line comment check
    var lastLine = code.split('\n').slice(-1)[0];
    if(lastLine.indexOf('//')>=0){
      /*eslint-disable no-console*/
      if(!filePath) console.warn('detect a possible single-line comment: %s', lastLine);
      else console.warn('detect a possible single-line comment in file %s: %s', filePath, lastLine);
      /*eslint-enable no-console*/
    }
    if(code.slice(-1)!==';') script.push(';');
  }
}

//escape html
function escape(str){
  if(typeof str === 'string'){
    if(!str) return '';
    return str.replace("<", "&lt;").replace(">", "&gt;");
  } 
  else return str;
}

function onerror(e, script, filePath){
  if(e._isRenderError) throw e;//thrown in the include clause
  e._isRenderError = true;
  if(e.name === 'SyntaxError'){
    var err = checkSyntaxError(script, filePath);
    if(err){
      e.line = err.line;
      e.column = err.column;
    }
  }
  locError(e, filePath);
  throw e;
}

var stackDeli = '\n    at ';
function locError(e, filePath){
  var stack = e.stack.split(stackDeli);
  var first = stack[1];
  if(!e.line){
    var match = /<anonymous>:(\d+):(\d+)/.exec(first);
    if(match){
      e.line = match[1]-1;
      e.column = match[2];
    }
  }
  if(!e.line) return;

  var loc;
  if(filePath){
    loc = ' in file '+filePath+':'+e.line+':'+e.column;
  }
  else{
    loc = ' in line:'+e.line+':'+e.column;
  }
  e.message += loc;
  stack[0] += loc;
  e.stack = stack.join(stackDeli);
}
