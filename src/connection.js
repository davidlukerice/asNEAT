
var Utils = require('asNEAT/utils')['default'],
    log = Utils.log,
    asNEAT = require('asNEAT/asNEAT')['default'],
    context = asNEAT.context,
    offlineContext = asNEAT.offlineContext,
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
  mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
  mutationDelta: {min: [0.05, 0.3], max: [0.1, 0.6]},
  randomMutationRange: {min: 0.1, max: 1.5}
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
    mutationDeltaInterpolationType: this.mutationDeltaInterpolationType,
    mutationDelta: _.clone(this.mutationDelta),
    randomMutationRange: _.clone(this.randomMutationRange)
  });
};
Connection.prototype.connect = function(contextPair) {
  connect.call(this, contextPair);
};
Connection.prototype.offlineConnect = function(contextPair) {
  connect.call(this, contextPair, "offline");
};

function connect(contextPair, accessorPrefix) {
  if (!this.enabled) return;

  accessorPrefix = accessorPrefix || "";
  var accessor = accessorPrefix + (accessorPrefix ? "Node" : "node");

  // The gainNode is what carries the connection's
  // weight attribute
  this.gainNode = contextPair.context.createGain();
  this.gainNode.gain.value = this.weight;
  this.sourceNode[accessor].connect(this.gainNode);

  var param = this.targetParameter;
  if (param === null)
    this.gainNode.connect(this.targetNode[accessor]);
  else {
    var nodeName = this.targetParameterNodeName ? this.targetParameterNodeName : "node";
    accessor = accessorPrefix + (accessorPrefix ? Utils.upperCaseFirstLetter(nodeName) : nodeName);
    this.gainNode.connect(this.targetNode[accessor][param]);
  }

  return this;
}

Connection.prototype.disable = function() {
  this.enabled = false;
  return this;
};

Connection.prototype.mutate = function(mutationDistance) {
  var mutationInfo = Utils.mutateParameter({
    obj: this,
    parameter: 'weight',
    mutationDistance: mutationDistance,
    mutationDeltaInterpolationType: this.mutationDeltaInterpolationType,
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
