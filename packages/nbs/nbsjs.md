### `a.js`
```js
function sayHello(req, resp){
  sleep((Math.random()*500)<<1);
  resp.send('hello');
}

function sayBye(req, resp){
  sleep((Math.random()*500)<<1);
  resp.send('bye-bye');
}
```


### `init.js`
```js
function init(){
  return readFile('app.conf');
}
```


### `core.js`
it will start by node

```js
function sleep(ms){
  setTimeout(resume, ms);
  wait();
}

function readFile(file){
  fs.readFile(file, resume);
  return wait()[1];
}

function processRequest(req, resp){
  //call sayHello or sayBye
}

nbs.run(function(){//create the main/global fiber stack
  var conf = init();//init the app and get the conf

  //to create a http server to accept the client request.
  onNewRequestCome(function(req, resp){
    nbs.run(function(){
      processRequest(req, resp);
    });
  });
});
```