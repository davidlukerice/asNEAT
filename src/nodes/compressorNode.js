
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context;

var CompressorNode = function(parameters) {
  Node.call(this, parameters);
};

CompressorNode.prototype = new Node();
CompressorNode.prototype.defaultParameters = {
  // The decibel value above which the compression will start taking effect.
  // Its default value is -24, with a nominal range of -100 to 0.
  threshold: 0,

  // A decibel value representing the range above the threshold where the curve
  // smoothly transitions to the "ratio" portion. Its default value is 30, with
  // a nominal range of 0 to 40.
  knee: 0,

  // The amount of dB change in input for a 1 dB change in output. Its default
  // value is 12, with a nominal range of 1 to 20.
  ratio: 0,

  // A read-only decibel value for metering purposes, representing the current
  // amount of gain reduction that the compressor is applying to the signal.
  // If fed no signal the value will be 0 (no gain reduction). The nominal range
  // is -20 to 0.
  reduction: 0,

  // The amount of time (in seconds) to reduce the gain by 10dB. Its default
  // value is 0.003, with a nominal range of 0 to 1.
  attack: 0,

  // The amount of time (in seconds) to increase the gain by 10dB. Its default
  // value is 0.250, with a nominal range of 0 to 1.
  release: 0,

  parameterMutationChance: 0.1,
  mutatableParameters: [
    {
      name: 'threshold',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -50, max: 10}
    },{
      name: 'knee',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: 20, max: 40}
    },{
      name: 'ratio',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -1, max: 1},
      // TODO: set global min?
      randomMutationRange: {min: 8, max: 16}
    },{
      name: 'reduction',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -1, max: 1},
      // TODO: set global min?
      randomMutationRange: {min: -10, max: 0}
    },{
      name: 'attack',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.02, max: 0.02},
      // TODO: set global min?
      randomMutationRange: {min: 0, max: 0.1}
    },{
      name: 'release',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.1, max: 0.1},
      // TODO: set global min?
      randomMutationRange: {min: 0, max: 0.1}
    }
  ]
};
// Refreshes the cached node to be played again
CompressorNode.prototype.refresh = function() {
  var node = context.createDynamicsCompressor();
  node.threshold.value = this.threshold;
  node.knee.value = this.knee;
  node.ratio.value = this.ratio;
  node.reduction.value = this.reduction;
  node.attack.value = this.attack;
  node.release.value = this.release;

  // cache the current node?
  this.node = node;
};

CompressorNode.prototype.toString = function() {
  return this.id+": CompressorNode("+
    this.threshold.toFixed(2)+","+
    this.knee.toFixed(2)+","+
    this.ratio.toFixed(2)+","+
    this.reduction.toFixed(2)+","+
    this.attack.toFixed(2)+","+
    this.release.toFixed(2)+")";
};

CompressorNode.random = function() {
  var threshold = Utils.randomIn(-50, 10),
      knee = Utils.randomIn(20, 40),
      ratio = Utils.randomIn(8, 16),
      reduction = Utils.randomIn(-10, 0),
      attack = Utils.randomIn(0, 0.1),
      release = Utils.randomIn(0, 0.1);

  return new CompressorNode({
    threshold: threshold,
    knee: knee,
    ratio: ratio,
    reduction: reduction,
    attack: attack,
    release: release
  });
};

export default CompressorNode;
