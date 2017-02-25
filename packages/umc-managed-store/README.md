Support data normalization in state management
=================================

```js
const ManagedStore = require('umc-managed-store');
const Types = ManagedStore.Types;

const store = ManagedStore.create({
  structure: {
    //define two models
    members: Types.mapOf('member', {structure: {
      feedCount: 0, 
      feeds: Types.idArrayOf('feed'),//reference other model records
    }}),
    feeds: Types.mapOf('feed', {structure: {
      memberId: Types.idOf('member'),
    }}),

    mine: {
      loginMemberId: '',
      newlyCount: {
        push: 0, 
      },
      friends: Types.idArrayOf('member'),
      feeds: Types.idArrayOf('feed'),
    },
  }, 
  //save: {cache, cacheKey: STORE_CACHE_KEY, filter: saveFilter}, // support serialization
});

store.all('/query-feeds', (req, resp, next)=>{
  const {store} = req;
  return fetch('/feeds/query', {memberId: store.state.mine.loginMemberId}).then(rows=>{
    const newState = {...store.state}, {members, feeds, mine} = newState;
    let feedIds = rows.map(row=>{
      let {memberId, memberName, memberAvatar, ...remainRow} = row;
      members[memberId] = {...members[memberId], memberName, memberAvatar};

      const feedId = remainRow.id;
      row.memberId = memberId;
      feeds[feedId] = {...feeds[feedId], ...remainRow};
      return feedId;
    })


    newState.mine = {...mine, feeds: [...mine.feeds, ...feedIds]};
    store.setState(newState);
  })
})

store.all('/remove-feed', (req, resp, next)=>{
  const {store} = req;
  const {feedId} = req.body;
  return fetch(`/feeds/${feedId}/remove`).then(()=>{
    const newState = {...store.state}, {feeds} = newState;
    delete feeds[feedId];//after store.setState, mine.feeds will also remove the feed id in the array 
    store.setState(newState);
  })
})

//clear all non-referenced model records
store.clear()
```

## License

Licensed under MIT

Copyright (c) 2016 kiliwalk
