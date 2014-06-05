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
  
  // ADSR model
  attackDuration: 0.2,
  decayDuration: 0.4,
  releaseDuration: 0.2,

  // For single playback
  sustainDuration: 0.5,
  
  attackVolume: 1.1,
  sustainVolume: 1.0,

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
    },{
      name: 'attackDuration',
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.1, max: 0.1},
      // TODO: set global min?
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'decayDuration',
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.1, max: 0.1},
      // TODO: set global min?
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'releaseDuration',
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.1, max: 0.1},
      // TODO: set global min?
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'attackVolume',
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.1, max: 0.1},
      // TODO: set global min?
      randomMutationRange: {min: 0.5, max: 1.5}
    }
  ],
  connectableParameters: [
    {
      name: "frequency",
      nodeName: "oscNode",
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
    attackDuration: this.attackDuration,
    decayDuration: this.decayDuration,
    releaseDuration: this.releaseDuration,
    sustainDuration: this.sustainDuration,
    attackVolume: this.attackVolume,
    sustainVolume: this.sustainVolume,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
NoteOscillatorNode.prototype.refresh = function() {
  var oscillator = context.createOscillator();
  oscillator.type = this.type;
  oscillator.frequency.value = Utils.frequencyOfStepsFromRootNote(
      this.stepFromRootNote + this.noteOffset);
  this.oscNode = oscillator;

  var gainNode = context.createGain();
  this.node = gainNode;
  oscillator.connect(gainNode);
};
NoteOscillatorNode.prototype.play = function() {
  var self = this,
      waitTime = this.attackDuration + this.decayDuration + this.sustainDuration;
  OscillatorNode.setupEnvelope.call(this);
  setTimeout(function() {
    OscillatorNode.setupRelease.call(self);
  }, waitTime * 1000);
};

/**
  Plays a note until the return handler is called
  @return function stop
**/
NoteOscillatorNode.prototype.playHold = function() {
  var self = this;
  OscillatorNode.setupEnvelope.call(this);

  return function stop() {
    OscillatorNode.setupRelease.call(self);
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
  return this.id+": NoteOscillatorNode("+this.type+","+this.noteOffset+
    ", ADSR: "+this.attackDuration.toFixed(2)+" ("+this.attackVolume.toFixed(2)+"), "+
             this.decayDuration.toFixed(2)+", "+
             this.sustainDuration.toFixed(2)+" ("+this.sustainVolume.toFixed(2)+"), "+
             this.releaseDuration.toFixed(2)+")";
};

NoteOscillatorNode.random = function() {
  var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
      noteOffset = Utils.randomIndexIn(-20, 20),
      attackDuration = Utils.randomIn(0.01, 1.0),
      decayDuration = Utils.randomIn(0.01, 1.0),
      releaseDuration = Utils.randomIn(0.01, 1.0),
      attackVolume = Utils.randomIn(0.5, 1.5);

  // noteOffset - # of steps from the root note (default A4=440hz) on a tempered scale.
  // Q - 1, with a nominal range of 0.0001 to 1000.
  // gain - 0, with a nominal range of -40 to 40.

  return new NoteOscillatorNode({
    type: OscillatorNode.TYPES[typeI],
    noteOffset: noteOffset,
    attackDuration: attackDuration,
    decayDuration: decayDuration,
    releaseDuration: releaseDuration,
    attackVolume: attackVolume
  });
};

export default NoteOscillatorNode;
