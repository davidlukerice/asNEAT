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

  // Offset from root (currently A4=440) to play
  // @note This parameter isn't evolved but is useful when
  // playing a set note from either an onscreen or MIDI keyboard
  stepFromRootNote: 0,
  
  // offset from note determined by root_stepFromRootNote
  noteOffset: 0,
  
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
      name: 'noteOffset',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -5, max: 5},
      // TODO: set global min?
      randomMutationRange: {min: -20, max: 20},
      discreteMutation: true
    }
    // todo: detune?
  ],
  connectableParameters: [
    {
      name: "frequency",
      amplitudeScaling: {min: -2000, max: 2000}
    }
  ]
};

NoteOscillatorNode.prototype.clone = function() {
  return new NoteOscillatorNode({
    id: this.id,
    type: this.type,
    noteOffset: this.noteOffset,
    detune: this.detune,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
NoteOscillatorNode.prototype.refresh = function() {
  var node = context.createOscillator();
  node.type = this.type;
  node.frequency.value = Utils.frequencyOfStepsFromRootNote(
      this.stepFromRootNote + this.noteOffset);
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

/**
  Plays a note until the return handler is called
  @return function stop
**/
NoteOscillatorNode.prototype.playHold = function() {
  var node = this.node;
  node.start(0);
  return function stop() {
    node.stop(0);
  };
};

NoteOscillatorNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    type: OscillatorNode.TYPES.nameFor(this.type),
    noteOffset: this.noteOffset,
    //note: Utils.noteForFrequency(
    //        Utils.frequencyOfStepsFromRootNote(
    //          this.noteOffset)),
    detune: this.detune,
  };
};

NoteOscillatorNode.prototype.toString = function() {
  return this.id+": NoteOscillatorNode("+this.type+","+this.noteOffset+")";
};

NoteOscillatorNode.random = function() {
  var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
      noteOffset = Utils.randomIndexIn(-20, 20);

  // noteOffset - # of steps from the root note (default A4=440hz) on a tempered scale.
  // Q - 1, with a nominal range of 0.0001 to 1000.
  // gain - 0, with a nominal range of -40 to 40.

  return new NoteOscillatorNode({
    type: OscillatorNode.TYPES[typeI],
    noteOffset: noteOffset
    //detune: 0
  });
};

export default NoteOscillatorNode;
