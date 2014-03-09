
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var FilterNode = function(parameters) {
    ns.Node.call(this, parameters);
  };

  FilterNode.prototype = new ns.Node();
  FilterNode.prototype.defaultParameters = {
    type: 0,
    frequency: 500,
    detune: 0,
    q: 1,
    gain: 1,

    parameterMutationChance: 0.1,
    mutatableParameters: [
      {
        name: 'type',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0,
        randomMutationRange: {min: 0, max: 8},
        discreteMutation: true
      },{
        name: 'frequency',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -500, max: 500},
        // TODO: set global min?
        randomMutationRange: {min: 27.5, max: 1046.5}
      }
      // todo: other parameters
    ]
  };
  // Refreshes the cached node to be played again
  FilterNode.prototype.refresh = function() {
    var node = ns.context.createBiquadFilter();
    node.type = this.type;
    node.frequency.value = this.frequency;
    node.detune.value = this.detune;
    node.Q.value = this.q;
    node.gain.value = this.gain;

    // cache the current node?
    this.node = node;
  };

  FilterNode.prototype.toString = function() {
    return this.id+": FilterNode("+this.type+","+this.frequency.toFixed(2)+")";
  };

  FilterNode.TYPES = [
    "lowpass",
    "highpass",
    "bandpass",
    "lowshelf",
    "highshelf",
    "peaking",
    "notch",
    "allpass"
  ];
  FilterNode.random = function() {
    var typeI = ns.Utils.randomIndexIn(0,FilterNode.TYPES.length),
        // A0 to C8
        freq = ns.Utils.randomIn(27.5, 1046.5);

    // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
    // Q - 1, with a nominal range of 0.0001 to 1000.
    // gain - 0, with a nominal range of -40 to 40.

    return new FilterNode({
      type: FilterNode.TYPES[typeI],
      frequency: freq,
      // TODO: specefic ranges based on type
      //detune: 0,
      //q: 1,
      //gain: 1
    });
  };

  ns.FilterNode = FilterNode;

})(this);