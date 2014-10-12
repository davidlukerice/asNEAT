
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    name = "GainNode",
    gainMin = 0.5,
    gainMax = 1.5;

var GainNode = function(parameters) {
  Node.call(this, parameters);
};

GainNode.prototype = Object.create(Node.prototype);
GainNode.prototype.name = name;
GainNode.prototype.defaultParameters = {
  // Represents the amount of gain to apply. Its default value is 1
  // (no gain change). The nominal minValue is 0, but may be set
  // negative for phase inversion. The nominal maxValue is 1, but
  // higher values are allowed (no exception thrown).This parameter
  // is a-rate
  gain: 1,

  mutatableParameters: [
    {
      name: 'gain',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [0.02, 0.1], max: [0.2, 0.4]},
      allowDeltaInverse: true,
      mutationDeltaAllowableRange: {min: -1, max: 1},
      randomMutationRange: {min: -1, max: 1}
    }
  ],
  connectableParameters: [
    {
      name: "gain",
      deltaRange: {min: [0.1, 0.3], max: [0.5, 1]},
      randomRange: {min: gainMin, max: gainMax}
    }
  ]
};

GainNode.prototype.clone = function() {
  return new GainNode({
    id: this.id,
    gain: this.gain,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};


// Refreshes the cached node to be played again
GainNode.prototype.refresh = function(contextPair) {
  refresh.call(this, contextPair);
};

GainNode.prototype.offlineRefresh = function(contextPair) {
  refresh.call(this, contextPair, "offline");
};

function refresh(contextPair, prefix) {
  var node = contextPair.context.createGain();
  node.gain.value = this.gain;
  var nodeName = prefix ? (prefix+'Node') : 'node';
  this[nodeName] = node;
}

GainNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    gain: this.gain
  };
};

GainNode.prototype.toString = function() {
  return this.id+": GainNode("+
    this.gain.toFixed(2)+")";
};

/*
  @return a GainNode with a gain of [0.5, 1.5) || (-1.5, -5.1]
*/
GainNode.random = function() {
  var isInverse = Utils.randomBool(),
      gain = Utils.randomIn(gainMin, gainMax);
  gain*= (isInverse? -1 : 1);

  return new GainNode({
    gain: gain
  });
};

export default GainNode;
