
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    name = "PannerNode";

var PannerNode = function(parameters) {
  Node.call(this, parameters);
};

PannerNode.prototype = Object.create(Node.prototype);
PannerNode.prototype.name = name;
PannerNode.prototype.defaultParameters = {
  // position
  x: 0,
  y: 0,
  z: 0,

  mutatableParameters: [
    {
      name: 'x',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -5, max: 5}
    },{
      name: 'y',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -5, max: 5}
    },{
      name: 'z',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -5, max: 5}
    }
  ]
};

PannerNode.prototype.clone = function() {
  return new PannerNode({
    id: this.id,
    x: this.x,
    y: this.y,
    z: this.z,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
PannerNode.prototype.refresh = function(contextPair) {
  refresh.call(this, contextPair);
};

PannerNode.prototype.offlineRefresh = function(contextPair) {
  refresh.call(this, contextPair, "offline");
};

function refresh(contextPair, prefix) {
  var node = contextPair.context.createPanner();
  node.setPosition(this.x, this.y, this.z);
  //node.setVelocity
  //node.setOrientation
  //other parameters: distance model, sound cone, &c...

  var nodeName = prefix ? (prefix+'Node') : 'node';
  this[nodeName] = node;
}

PannerNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    x: this.x.toFixed(2),
    y: this.y.toFixed(2),
    z: this.z.toFixed(2)
  };
};

PannerNode.prototype.toString = function() {
  return this.id+": PannerNode("+this.x.toFixed(2)+
    ", "+this.y.toFixed(2)+", "+this.z.toFixed(2)+")";
};

PannerNode.random = function() {
  var x = Utils.randomIn(-5.0, 5.0),
      y = Utils.randomIn(-5.0, 5.0),
      z = Utils.randomIn(-5.0, 5.0);

  return new PannerNode({
    x:x,
    y:y,
    z:z
  });
};

export default PannerNode;
