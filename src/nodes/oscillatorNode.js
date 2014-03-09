
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {}),
      A0 = 27.5,
      C6 = 1046.5,
      C8 = 4186.0;

  var OscillatorNode = function(parameters) {
    ns.Node.call(this, parameters);
  };

  OscillatorNode.prototype = new ns.Node();

  OscillatorNode.prototype.defaultParameters = {
    type: 0,
    frequency: 1000,
    detune: 0,
    
    parameterMutationChance: 0.1,
    mutatableParameters: [
      {
        name: 'type',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0,
        randomMutationRange: {min: 0, max: 4},
        discreteMutation: true
      },{
        name: 'frequency',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -500, max: 500},
        // TODO: set global min?
        randomMutationRange: {min: A0, max: C6}
      }
      // todo: detune?
    ]
  };

  // Refreshes the cached node to be played again
  OscillatorNode.prototype.refresh = function() {
    var node = ns.context.createOscillator();
    node.type = this.type;
    node.frequency.value = this.frequency;
    // cache the current node?
    this.node = node;
  };
  OscillatorNode.prototype.play = function() {
    var node = this.node;
    node.start(0);
    setTimeout(function() {
      node.stop(0);
    }, 500);
  };

  OscillatorNode.prototype.toString = function() {
    return this.id+": OscillatorNode("+this.type+","+this.frequency.toFixed(2)+")";
  };


  OscillatorNode.TYPES = [
    "sine",
    "square",
    "sawtooth",
    "triangle"
    //"custom"
  ];
  OscillatorNode.random = function() {
    var typeI = ns.Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
        freq = ns.Utils.randomIn(A0, C6);
    // todo: only allow standard notes?

    // From w3 spec
    // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
    // Q - 1, with a nominal range of 0.0001 to 1000.
    // gain - 0, with a nominal range of -40 to 40.

    return new OscillatorNode({
      type: OscillatorNode.TYPES[typeI],
      frequency: freq
      //detune: 0
    });
  };

  ns.OscillatorNode = OscillatorNode;

})(this);