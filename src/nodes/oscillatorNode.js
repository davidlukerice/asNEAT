
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context,
    name = "OscillatorNode",
    A0 = 27.5,
    C6 = 1046.5,
    C8 = 4186.0;

var OscillatorNode = function(parameters) {
  Node.call(this, parameters);
};

OscillatorNode.prototype = Object.create(Node.prototype);
OscillatorNode.prototype.name = name;

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
      allowInverse: false,
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

OscillatorNode.prototype.clone = function() {
  return new OscillatorNode({
    id: this.id,
    type: this.type,
    frequency: this.frequency,
    detune: this.detune,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
OscillatorNode.prototype.refresh = function() {
  var node = context.createOscillator();
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

OscillatorNode.prototype.getParameters = function() {
  return {
    name: name,
    type: OscillatorNode.TYPES.nameFor(this.type),
    frequency: this.frequency,
    detune: this.detune
  };
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
OscillatorNode.TYPES.nameFor = function(type) {
  if (typeof type ==="string") return type;
  return OscillatorNode.TYPES[type];
};
OscillatorNode.random = function() {
  var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
      freq = Utils.randomIn(A0, C6);

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

export default OscillatorNode;