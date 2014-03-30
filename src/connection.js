
var Utils = require('asNEAT/utils')['default'],
    log = Utils.log,
    context = require('asNEAT/asNEAT')['default'].context;

// TODO: Different kinds of connections?
var Connection = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);
  this.gainNode = null;
  this.id = Utils.cantorPair(this.sourceNode.id, this.targetNode.id);
};

Connection.prototype.defaultParameters = {
  sourceNode: null,
  targetNode: null,
  weight: 1.0,
  enabled: true,

  mutationDeltaChance: 0.8,
  mutationDelta: {min: -0.2, max: 0.2},
  randomMutationRange: {min: 0.1, max: 1.5},
  discreteMutation: false
};

/**
  @param clonedsourceNode {Node} (optional)
  @param clonedtargetNode {Node} (optional)
*/
Connection.prototype.clone = function(clonedsourceNode, clonedtargetNode) {
  var sourceNode = clonedsourceNode || this.sourceNode.clone();
  var targetNode = clonedtargetNode || this.targetNode.clone();
  return new Connection({
    sourceNode: sourceNode,
    targetNode: targetNode,
    weight: this.weight,
    enabled: this.enabled,
    mutationDeltaChance: this.mutationDeltaChance,
    mutationDelta: _.clone(this.mutationDelta),
    randomMutationRange: _.clone(this.randomMutationRange),
    discreteMutation: this.discreteMutation
  });
};
Connection.prototype.connect = function() {
  if (!this.enabled) return;

  // The gainNode is what carries the connection's 
  // weight attribute
  this.gainNode = context.createGain();
  this.gainNode.gain.value = this.weight;
  this.sourceNode.node.connect(this.gainNode);
  this.gainNode.connect(this.targetNode.node);
};

Connection.prototype.disable = function() {
  this.enabled = false;
};

Connection.prototype.mutate = function() {
  Utils.mutateParameter({
    obj: this,
    parameter: 'weight',
    mutationDeltaChance: this.mutationDeltaChance,
    mutationDelta: this.mutationDelta,
    randomMutationRange: this.randomMutationRange
  });
};

Connection.prototype.toString = function() {
  return (this.enabled? "" : "*") +
          "connection("+this.weight.toFixed(2)+")("+
          this.sourceNode.id+" --> "+this.targetNode.id+")";
};

export default Connection;