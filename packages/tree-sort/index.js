(function(){
'use strict';

function Tree(){
  this._rootNode = null;
  this._nodes = {};//{id:node}

  this._rootNode = new Node();
  this._rootNode.tree = this;
}
module.exports = Tree;

function Node(){
  this.tree = null;

  this.parent = null;
  this.id = null;
  this.seq = -1;//seq in parent.children
  this.data = null;

  this.children = [];
}

Tree.create = function(items, idAttrName, parIdAttrName, seqAttrName){
  idAttrName || (idAttrName = 'id');
  parIdAttrName || (parIdAttrName = 'pid');

  var tree = new Tree();
  for(var i in items){
    var item = items[i];
    tree.add(item[idAttrName], item[parIdAttrName], seqAttrName?(item[seqAttrName]||0):-1, item);
  }
  return tree;
};

Tree.prototype.root = function(){
  return this._rootNode;
};

Tree.prototype.getNode = function(id){
  if(!id) return null;
  return this._nodes[id];
};

function addNode(parent, node){
  //if node already has a parent, them remove the relationship first
  if(node.parent){
    for(var j in node.parent.children){
      if(node.parent.children[j].id===node.id){
        node.parent.children.splice(j, 1);
        break;
      }
    }
  }

  node.parent = parent;

  //if seq<0, always push to the tail
  if(node.seq<0) parent.children.push(node);
  else{
    var isInserted = false;
    for(var i in parent.children){
      if(parent.children[i].seq>node.seq){
        parent.children.splice(i, 0, node);
        isInserted = true;
        break;
      }
    }
    if(!isInserted) parent.children.push(node);
  }

  //add to the tree's global nodes list
  node.tree._nodes[node.id] = node;
}

function genNodeFromId(id, seq, data){
  var node;
  if(!this._nodes[id]){//new one
    node = new Node();
    node.id = id;
    if(!seq && 0!==seq) seq = -1;
    node.seq = +seq;
    node.data = data;
  }else{//exists
    node = this._nodes[id];
    if(!seq && 0!==seq) seq = node.seq;
    else node.seq = +seq;
    node.data = data || node.data;
  }
  node.tree = this;
  return node;
}

Tree.prototype.add = function(id, parId, seq, data){
  if(!id) return;

  //get the node from id
  var node = genNodeFromId.call(this, id, seq, data);

  //get the parent node, default is root node
  var parent = this._rootNode;
  if(parId){
    if(!this._nodes[parId]){//if parent is not added, add first
      this.add(parId);
    }
    parent = this._nodes[parId];
  }

  addNode(parent, node);
  return node;
};

Node.prototype.add = function(id, seq, data){
  var node = genNodeFromId.call(this.tree, id, seq, data);
  addNode(this, node);
};

//get the middle-left-right ordered sets. 
Tree.prototype.mlr = function(node, include, fnEl){//middle-left-right
  var ret = [];//elements is fnEl return
  fnEl || (fnEl = function(id, seq, data){ return id; });

  if(!node) node = this._rootNode;
  if(include) ret.push(fnEl(node.id, node.seq, node.data));

  for(var i in node.children){
    ret = ret.concat(this.mlr(node.children[i], true, fnEl));
  }
  return ret;
};

Tree.prototype.hier = function(node, include, fnEl){
  //elements is fnEl return. the element will add a children property to refer its children
  //fnEl return must be an object.
  var ret = [];
  fnEl || (fnEl = function(id, seq, data){ return {id: id}; });

  if(!node) node = this._rootNode;
  if(include){
    ret.push(fnEl(node.id, node.seq, node.data));
    ret[0].children = [];
  }

  for(var i in node.children){
    var chd = node.children[i];
    var item = fnEl(chd.id, chd.seq, chd.data);
    item.children = this.hier(chd, false, fnEl);
    if(include) ret[0].children.push(item);
    else ret.push(item);
  }
  return ret;
};

})();
