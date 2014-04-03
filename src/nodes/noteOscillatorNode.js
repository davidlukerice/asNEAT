
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    context = require('asNEAT/asNEAT')['default'].context,
    name = "NoteOscillatorNode";
/**
  An OscillatorNode that clamps its frequency to an
  equal tempered scale
*/
var NoteOscillatorNode = function(parameters) {
  Node.call(this, parameters);
};

NoteOscillatorNode.prototype = Object.create(Node.prototype);
NoteOscillatorNode.prototype.name = name;
NoteOscillatorNode.prototype.defaultParameters = {
  name: name,

  type: 0,
  stepFromRootNote: 0,
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
      name: 'stepFromRootNote',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -20, max: 20},
      discreteMutation: true
    }
    // todo: detune?
  ]
};

NoteOscillatorNode.prototype.clone = function() {
  return new NoteOscillatorNode({
    id: this.id,
    type: this.type,
    stepFromRootNote: this.stepFromRootNote,
    detune: this.detune,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
NoteOscillatorNode.prototype.refresh = function() {
  var node = context.createOscillator();
  node.type = this.type;
  node.frequency.value = Utils.frequencyOfStepsFromRootNote(this.stepFromRootNote);
  // cache the current node?
  this.node = node;
};
NoteOscillatorNode.prototype.play = function() {
  var node = this.node;
  node.start(0);
  setTimeout(function() {
    node.stop(0);
  }, 500);
};

NoteOscillatorNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    type: OscillatorNode.TYPES.nameFor(this.type),
    stepFromRootNote: this.stepFromRootNote,
    //note: Utils.noteForFrequency(
    //        Utils.frequencyOfStepsFromRootNote(
    //          this.stepFromRootNote)),
    detune: this.detune,
  };
};

NoteOscillatorNode.prototype.toString = function() {
  return this.id+": NoteOscillatorNode("+this.type+","+this.stepFromRootNote+")";
};

NoteOscillatorNode.random = function() {
  var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
      stepFromRootNote = Utils.randomIndexIn(-20, 20);

  // stepFromRootNote - # of spets from A4=440hz on a tempered scale.

  // Q - 1, with a nominal range of 0.0001 to 1000.

  // gain - 0, with a nominal range of -40 to 40.

  return new NoteOscillatorNode({
    type: OscillatorNode.TYPES[typeI],
    stepFromRootNote: stepFromRootNote
    //detune: 0
  });
};

export default NoteOscillatorNode;