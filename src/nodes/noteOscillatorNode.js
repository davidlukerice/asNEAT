var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
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

  mutatableParameters: [
    {
      name: 'type',
      mutationDeltaChance: 0,
      randomMutationRange: {min: 0, max: 4},
      allowRandomInverse: false,
      discreteMutation: true
    },{
      name: 'noteOffset',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [1, 4], max: [5, 15]},
      allowDeltaInverse: true,
      randomMutationRange: {min: -20, max: 20},
      discreteMutation: true
    },{
      name: 'attackDuration',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [0.01, 0.05], max: [0.1, 0.3]},
      allowDeltaInverse: true,
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'decayDuration',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [0.01, 0.05], max: [0.1, 0.3]},
      allowDeltaInverse: true,
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'releaseDuration',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [0.01, 0.05], max: [0.1, 0.3]},
      allowDeltaInverse: true,
      randomMutationRange: {min: 0.01, max: 1.0}
    },{
      name: 'attackVolume',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [0.01, 0.05], max: [0.1, 0.3]},
      allowDeltaInverse: true,
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
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

NoteOscillatorNode.prototype.refresh = function(contextPair) {
  refresh.call(this, contextPair);
};
NoteOscillatorNode.prototype.offlineRefresh = function(contextPair) {
  refresh.call(this, contextPair, "offline");
};

function refresh(contextPair, prefix) {
  var oscillator = contextPair.context.createOscillator();
  oscillator.type = this.type;
  oscillator.frequency.value = Utils.frequencyOfStepsFromRootNote(
      this.stepFromRootNote + this.noteOffset);
  var gainNode = contextPair.context.createGain();
  oscillator.connect(gainNode);

  var oscName = prefix ? (prefix + 'OscNode') : 'oscNode';
  var nodeName = prefix ? (prefix + 'Node') : 'node';
  this[oscName] = oscillator;
  this[nodeName] = gainNode;
}

NoteOscillatorNode.prototype.play = function(context) {
  var gainNode = this.node,
      oscNode = this.oscNode;
  play.call(this, context, gainNode, oscNode);
};

NoteOscillatorNode.prototype.offlinePlay = function(context) {
  var gainNode = this.offlineNode,
      oscNode = this.offlineOscNode;
  play.call(this, context, gainNode, oscNode);
};

function play(context, gainNode, oscNode) {
  var self = this,
      waitTime = this.attackDuration + this.decayDuration + this.sustainDuration,
      attackVolume = this.attackVolume,
      attackDuration = this.attackDuration,
      sustainVolume = this.sustainVolume,
      decayDuration = this.decayDuration,
      releaseDuration = this.releaseDuration;
  OscillatorNode.setupEnvelope(context, gainNode, oscNode,
    attackVolume, attackDuration, sustainVolume, decayDuration);

  var timeToRelease = context.currentTime + waitTime;
  OscillatorNode.setupRelease(context, timeToRelease, gainNode, oscNode, releaseDuration);
}

/**
  Plays a note until the return handler is called
  @return function stop
**/
NoteOscillatorNode.prototype.playHold = function(context) {
  var self = this,
      waitTime = this.attackDuration + this.decayDuration + this.sustainDuration,
      gainNode = this.node,
      oscNode = this.oscNode,
      attackVolume = this.attackVolume,
      attackDuration = this.attackDuration,
      sustainVolume = this.sustainVolume,
      decayDuration = this.decayDuration,
      releaseDuration = this.releaseDuration;
  OscillatorNode.setupEnvelope(context, gainNode, oscNode,
    attackVolume, attackDuration, sustainVolume, decayDuration);
  return function stop() {
    var timeToRelease = context.currentTime;
    OscillatorNode.setupRelease(context, timeToRelease, gainNode, oscNode, releaseDuration);
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
    attackDuration: this.attackDuration,
    decayDuration: this.decayDuration,
    releaseDuration: this.releaseDuration,
    sustainDuration: this.sustainDuration,
    attackVolume: this.attackVolume,
    sustainVolume: this.sustainVolume
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
