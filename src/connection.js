
var Utils = require('asNEAT/utils')['default'],
    log = Utils.log,
    context = require('asNEAT/asNEAT')['default'].context,
    name = "Connection";

// TODO: Different kinds of connections?
var Connection = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);
  this.gainNode = null;
  this.hasChanged = false;
  // Only generate a new id if one isn't given in the parameters
  if (parameters && typeof parameters.id !== 'undefined')
    this.id = parameters.id;
  else
    this.id = Utils.createHash();
};

Connection.prototype.name = name;
Connection.prototype.defaultParameters = {
  sourceNode: null,
  targetNode: null,
  
  // null if connecting to audio input of targetNode
  targetParameter: null,
  targetParameterNodeName: "node",

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
    id: this.id,
    sourceNode: sourceNode,
    targetNode: targetNode,
    targetParameter: this.targetParameter,
    targetParameterNodeName: this.targetParameterNodeName,
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

  var param = this.targetParameter;
  if (param === null)
    this.gainNode.connect(this.targetNode.node);
  else {
    var nodeName = this.targetParameterNodeName ? this.targetParameterNodeName : "node";
    this.gainNode.connect(this.targetNode[nodeName][param]);
  }

  return this;
};

Connection.prototype.disable = function() {
  this.enabled = false;
  return this;
};

Connection.prototype.mutate = function() {
  var mutationInfo = Utils.mutateParameter({
    obj: this,
    parameter: 'weight',
    mutationDeltaChance: this.mutationDeltaChance,
    mutationDelta: this.mutationDelta,
    randomMutationRange: this.randomMutationRange
  });
  return this;
};

Connection.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    weight: this.weight,
    enabled: this.enabled,
    sourceNode: this.sourceNode.name,
    targetNode: this.targetNode.name,
    targetParameter: this.targetParameter
  };
};

Connection.prototype.toString = function() {
  return (this.enabled? "" : "*") +
          "connection("+this.weight.toFixed(2)+")("+
          this.sourceNode.id+" --> "+this.targetNode.id+
          (this.targetParameter ? (": "+this.targetParameter) : "" )+")";
};

Connection.prototype.toJSON = function() {
  var json = {
    id: this.id,
    sourceNode: this.sourceNode.id,
    targetNode: this.targetNode.id,
    targetParameter: this.targetParameter,
    targetParameterNodeName: this.targetParameterNodeName,
    weight: this.weight,
    enabled: this.enabled
  };
  return JSON.stringify(json);
};

export default Connection;