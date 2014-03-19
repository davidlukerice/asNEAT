
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context;

var PannerNode = function(parameters) {
  Node.call(this, parameters);
};

PannerNode.prototype = new Node();
PannerNode.prototype.defaultParameters = {
  // position
  x: 0,
  y: 0,
  z: 0,

  parameterMutationChance: 0.1,
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
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
PannerNode.prototype.refresh = function() {
  var node = context.createPanner();
  node.setPosition(this.x, this.y, this.z);
  //node.setVelocity
  //node.setOrientation
  //other parameters: distance model, sound cone, &c...

  // cache the current node?
  this.node = node;
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