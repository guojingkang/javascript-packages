Another flux implementation that supports async and middlewares
=================================

**DEPRECATED**

Inspired by express and redux. Yes! You read that right: Express in client, haha:)  
See [umc-managed-store](https://github.com/kiliwalk/umc-managed-store) for data normalization.

```js
const umc = require('umc');
const store = umc(initialState);

store.use((req, resp, next)=>{
  console.log('new action', req.url, req.body);
})

store.all('/action', (req, resp, next)=>{
  const {body, store} = req;
  if(url === '/action'){
    console.log(body);//the dispatch params
    
    let newState = {...store.state};//use spread operation to shadow copy, to make state immutable
    return resp.send(newState);//store.setState(newState);
  }
})

//manually listen the state changed event
store.subscribe((newState)=>{
  console.log(newState);
})

//for react component
const Container = store.createContainer();
class MyApp extends Component{
  render = ()=>{
    return (<Container>
      <SubComponent />
    </Container>)
  }
}
class SubComponent extends Component{
  static contextTypes = {
    appState: React.PropTypes.object,//context from store container
  }
}

//dispatch a new action
store.dispatch('/action', params);
```

### License

Licensed under MIT

Copyright (c) 2016 [kiliwalk](https://github.com/kiliwalk)
