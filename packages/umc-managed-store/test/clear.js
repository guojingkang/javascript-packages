/* eslint-env mocha */


const extend = require('extend');
const assert = require('assert');
const ManagedStore = require('..'),
  Types = ManagedStore.Types;

describe('clear store', () => {
  describe('beforeClear option', () => {
    let structure;
    beforeEach(() => {
      structure = {
        as: Types.mapOf('a'),
        bs: Types.mapOf('b'),
        id: '', type: '',
      };
    });
    it('should remove without beforeClear', () => {
      const store = ManagedStore.create({ structure });

      const newState = { as: { 123: { id: '123' } }, bs: { 123: { id: '123' } }, id: '123', type: 'a' };
      store.setState(newState);
      store.clear();
      assert.deepEqual(store.state, { as: {}, bs: {}, id: '123', type: 'a' });
    });
    it('should not remove with beforeClear', () => {
      const store = ManagedStore.create({ structure, beforeClear: state => [{ entity: state.type, id: state.id }] });

      let newState = { as: { 123: { id: '123' } }, bs: { 123: { id: '123' } }, id: '123', type: 'a' };
      store.setState(newState);
      store.clear();
      assert.deepEqual(store.state, { as: { 123: { id: '123' } }, bs: {}, id: '123', type: 'a' });

      newState = { as: { 123: { id: '123' } }, bs: { 123: { id: '123' } }, id: '123', type: 'b' };
      store.setState(newState);
      store.clear();
      assert.deepEqual(store.state, { bs: { 123: { id: '123' } }, as: {}, id: '123', type: 'b' });
    });
  });
  describe('anyIdOf type', () => {
    let structure;
    beforeEach(() => {
      structure = {
        as: Types.mapOf('a'),
        bs: Types.mapOf('b'),
        id: Types.anyIdOf(['a', 'b']),
      };
    });
    it('should work', () => {
      const store = ManagedStore.create({ structure });

      let newState = { as: { 123: { id: '123' } }, bs: { 234: { id: '234' } }, id: '123' };
      store.setState(newState);
      store.clear();
      assert.deepEqual(store.state, { as: { 123: { id: '123' } }, bs: {}, id: '123' });

      newState = { as: { 123: { id: '123' } }, bs: { 234: { id: '234' } }, id: '234' };
      store.setState(newState);
      store.clear();
      assert.deepEqual(store.state, { bs: { 234: { id: '234' } }, as: {}, id: '234' });
    });
  });
  describe('one entity', () => {
    let structure;
    beforeEach(() => {
      structure = {
        members: Types.mapOf('member'),
        joined: Types.idArrayOf('member'),
        login: Types.idOf('member'),
      };
    });
    it('should remove no-ref entity record', () => {
      const store = ManagedStore.create({ structure });

      const newState = { members: { 123: { id: '123', name: 'Mr. Tian' } } };
      store.setState(newState);
      assert.notDeepEqual(store.state, { members: {}, joined: [], login: '' });
      store.clear();
      assert.deepEqual(store.state, { members: {}, joined: [], login: '' });
    });
    it('should not remove has-ref entity record', () => {
      const store = ManagedStore.create({ structure });

      const newState = { members: { 123: { id: '123', name: 'Mr. Tian' } }, login: '123' };
      const result = extend(true, {}, newState, { joined: [] });
      assert.notDeepEqual(newState, result);

      store.setState(newState);
      assert.deepEqual(store.state, result);
      store.clear();
      assert.deepEqual(store.state, result);
    });
  });
  describe('self circular', () => {
    describe('1:1 without external ref', () => {
      let structure;
      beforeEach(() => {
        structure = {
          members: Types.mapOf('member', { structure: { introducerId: Types.idOf('member') } }),
        };
      });
      it('should remove no-ref entity record', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: { 123: { id: '123', name: 'Mr. Tian', introducerId: '234' } } };
        store.setState(newState);
        assert.notDeepEqual(store.state, { members: {} });
        store.clear();
        assert.deepEqual(store.state, { members: {} });
      });
      it('should remove one-way-ref entity record', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Xiao', introducerId: '234' },
          234: { id: '234', name: 'Tian' },
        } };
        const result = extend(true, {}, newState, { members: { 234: { introducerId: '' } } });

        store.setState(newState);
        assert.deepEqual(store.state, result);
        store.clear();
        assert.deepEqual(store.state, { members: {} });
      });
      it('should remove two-way-reference entity record', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Xiao', introducerId: '234' },
          234: { id: '234', name: 'Tian', introducerId: '123' },
        } };
        const result = extend(true, {}, newState);

        store.setState(newState);
        assert.deepEqual(store.state, result);
        store.clear();
        assert.deepEqual(store.state, { members: {} });
      });
    });
    describe('1:1 with external ref', () => {
      let structure;
      beforeEach(() => {
        structure = {
          members: Types.mapOf('member', { structure: { introducerId: Types.idOf('member') } }),
          login: Types.idOf('member'),
        };
      });
      it('should not remove one-way-ref entity record', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Xiao', introducerId: '234' },
          234: { id: '234', name: 'Tian' },
        }, login: '234' };
        store.setState(newState);
        assert.deepEqual(store.state, extend(true, {}, newState, { members: { 234: { introducerId: '' } } }));
        store.clear();
        assert.deepEqual(store.state, { members: { 234: { id: '234', name: 'Tian', introducerId: '' } }, login: '234' });
        store.clear();
        assert.deepEqual(store.state, { members: { 234: { id: '234', name: 'Tian', introducerId: '' } }, login: '234' });
      });
      it('should not remove two-way-reference entity record', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Xiao', introducerId: '234' },
          234: { id: '234', name: 'Tian', introducerId: '123' },
        }, login: '123' };
        const result = extend(true, {}, newState);

        store.setState(newState);
        assert.deepEqual(store.state, result);
        store.clear();
        assert.deepEqual(store.state, result);
      });
    });

    describe('1:M without ref in entity structure', () => {
      let structure;
      beforeEach(() => {
        // two types of feed: normal and reply, like:
        // {id: '123', content: 'hello', type: 'normal'},
        // {id: '234', content: 'up', type: 'reply'}
        structure = {
          feeds: Types.mapOf('feed'),
          relations: {
            [Types.idOf('feed')]: {
              replys: Types.idArrayOf('feed'),
            },
          },
          weakRelations: {
            [Types.idOf('feed', { weak: true })]: {
              replys: Types.idArrayOf('feed'),
            },
          },
        };
      });
      it('should not remove with external reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: { 123: { id: '123', content: 'hello', type: 'normal' } }, relations: { 123: { replys: [] } } };
        const result = extend(true, {}, newState, { weakRelations: {} });
        assert.notDeepEqual(newState, result);

        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, result);
      });
      it('should remove with weak external reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: { 123: { id: '123', content: 'hello', type: 'normal' } }, weakRelations: { 123: { replys: [] } } };
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, { feeds: {}, relations: {}, weakRelations: {} });
      });
      it('should not remove with two-way reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal' },
          234: { id: '234', content: 'up', type: 'reply' },
        }, relations: {
          123: { replys: ['234'] },
        } };
        const result = extend(true, {}, newState, { weakRelations: {} });
        assert.notDeepEqual(newState, result);

        store.setState(newState);
        store.clear();// can't clear
        assert.deepEqual(store.state, result);
      });
      it('should remove with weak two-way reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal' },
          234: { id: '234', content: 'up', type: 'reply' },
        }, weakRelations: {
          123: { replys: ['234'] },
        } };
        store.setState(newState);

        store.clear();
        assert.deepEqual(store.state, { feeds: {}, relations: {}, weakRelations: {} });
      });
    });

    describe('1:M with ref in entity structure', () => {
      let structure;
      beforeEach(() => {
        // two types of feed: normal and reply, like:
        // {id: '123', content: 'hello', type: 'normal'},
        // {id: '234', content: 'up', type: 'reply', replyToFeedId: '123'}
        structure = {
          feeds: Types.mapOf('feed', { structure: { replyToFeedId: Types.idOf('feed') } }),
          relations: {
            [Types.idOf('feed')]: {
              replys: Types.idArrayOf('feed'),
            },
          },
          weakRelations: {
            [Types.idOf('feed', { weak: true })]: {
              replys: Types.idArrayOf('feed'),
            },
          },
        };
      });
      it('should remove without external reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal' },
          234: { id: '234', content: 'up', type: 'reply', replyToFeedId: '123' },
        } };

        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, { feeds: {}, relations: {}, weakRelations: {} });
      });
      it('should remove with weak two-way reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal' },
          234: { id: '234', content: 'up', type: 'reply', replyToFeedId: '123' },
        }, weakRelations: {
          123: { replys: ['234'] },
        } };

        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, { feeds: {}, relations: {}, weakRelations: {} });
      });
      it('should remove with truncate option', () => {
        const store = ManagedStore.create({ structure });
        const newState = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal' },
          234: { id: '234', content: 'up', type: 'reply', replyToFeedId: '123' },
        }, relations: {
          123: { replys: ['234'] },
        } };
        store.setState(newState);
        store.clear({ truncate: 0 });

        const result = { feeds: {
          123: { id: '123', content: 'hello', type: 'normal', replyToFeedId: '' },
        }, relations: {
          123: { replys: [] },
        }, weakRelations: {} };
        assert.deepEqual(store.state, result);
      });
    });
  });
  describe('cross without circular', () => {
    let structure;
    beforeEach(() => {
      structure = {
        as: Types.mapOf('a', { structure: { b: Types.idOf('b') } }),
        bs: Types.mapOf('b'),
        a: '', b: '',
      };
    });
    it('should remove without external ref', () => {
      const store = ManagedStore.create({ structure });

      const newState = { as: {
        123: { id: '123', b: '234' },
      }, bs: {
        234: { id: '234' },
      } };
      store.setState(newState);
      assert.notDeepEqual(store.state, { as: {}, bs: {}, a: '', b: '' });
      store.clear();
      assert.deepEqual(store.state, { as: {}, bs: {}, a: '', b: '' });
    });
  });
  describe('cross circular', () => {
    describe('1:1', () => {
      let structure;
      beforeEach(() => {
        structure = {
          feeds: Types.mapOf('feed', { structure: { memberId: Types.idOf('member') } }),
          members: Types.mapOf('member', { structure: { feedId: Types.idOf('feed') } }),
          login: Types.idOf('member'),
        };
      });
      it('should remove without external ref', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Mr. Tian', feedId: '234' },
        }, feeds: {
          234: { id: '234', content: 'hello', memberId: '123' },
        } };
        store.setState(newState);
        assert.notDeepEqual(store.state, { members: {}, feeds: {}, login: '' });
        store.clear();
        assert.deepEqual(store.state, { members: {}, feeds: {}, login: '' });
      });
      it('should not remove with external ref', () => {
        const store = ManagedStore.create({ structure });

        const newState = { members: {
          123: { id: '123', name: 'Xiao', feedId: '234' },
        }, feeds: {
          234: { id: '234', content: 'hello', memberId: '123' },
        }, login: '123' };
        const copyState = extend(true, {}, newState);
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, copyState);
      });
    });
    describe('1:1:1', () => {
      let structure;
      beforeEach(() => {
        structure = {
          as: Types.mapOf('a', { structure: { bId: Types.idOf('b') } }),
          bs: Types.mapOf('b', { structure: { cId: Types.idOf('c') } }),
          cs: Types.mapOf('c', { structure: { aId: Types.idOf('a') } }),
          a: Types.idOf('a'), b: Types.idOf('b'), c: Types.idOf('c'),
        };
      });
      it('should remove without external ref', () => {
        const store = ManagedStore.create({ structure });

        const newState = { as: {
          a1: { id: 'a1', bId: 'b1' },
        }, bs: {
          b1: { id: 'b1', cId: 'c1' },
        }, cs: {
          c1: { id: 'c1', aId: 'a1' },
        } };
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, { as: {}, bs: {}, cs: {}, a: '', b: '', c: '' });
      });
      it('should not remove with external ref', () => {
        const store = ManagedStore.create({ structure });

        const newState = { as: {
          a1: { id: 'a1', bId: 'b1' },
        }, bs: {
          b1: { id: 'b1', cId: 'c1' },
        }, cs: {
          c1: { id: 'c1', aId: 'a1' },
        }, b: 'b1' };
        const copyState = extend(true, {}, newState, { a: '', c: '' });
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, copyState);
      });
      it('should not remove with external ref 2', () => {
        const store = ManagedStore.create({ structure });

        const newState = { as: {
          a1: { id: 'a1', bId: 'b1' },
        }, bs: {
          b1: { id: 'b1', cId: 'c1' },
        }, cs: {
          c1: { id: 'c1', aId: 'a1' },
        }, c: 'c1' };
        const copyState = extend(true, {}, newState, { a: '', b: '' });
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, copyState);
      });
    });
    describe('1:M', () => {
      let structure;
      beforeEach(() => {
        structure = {
          as: Types.mapOf('a', { structure: {
            bs: Types.idArrayOf('b'),
          } }),
          bs: Types.mapOf('b', { structure: {
            a: Types.idOf('a'),
          } }),
          a: Types.idOf('a'), b: Types.idOf('b'),
        };
      });
      it('should remove without external reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { as: {
          a1: { id: 'a1', bs: ['b1'] },
        }, bs: {
          b1: { id: 'b1', a: 'a1' },
        } };
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, { as: {}, bs: {}, a: '', b: '' });
      });
      it('should not remove with external reference', () => {
        const store = ManagedStore.create({ structure });
        const newState = { as: {
          a1: { id: 'a1', bs: ['b1'] },
        }, bs: {
          b1: { id: 'b1', a: 'a1' },
        }, a: 'a1' };
        const copyState = extend(true, {}, newState);
        store.setState(newState);
        store.clear();
        assert.deepEqual(store.state, extend(true, {}, copyState, { b: '' }));
      });
    });
  });
});
