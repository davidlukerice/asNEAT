
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    name = "OscillatorNode",
    utils = {},
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

  // ADSR model
  attackDuration: 0.2,
  decayDuration: 0.4,
  releaseDuration: 0.2,
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
      name: 'frequency',
      mutationDeltaChance: 0.8,
      mutationDeltaInterpolationType: Utils.InterpolationType.EXPONENTIAL,
      mutationDelta: {min: [10, 200], max: [50, 800]},
      allowDeltaInverse: true,
      randomMutationRange: {min: A0, max: C6}
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
      deltaRange: {min: [10, 200], max: [300, 700]},
      randomRange: {min: -2000, max: 2000}
    }
  ]
};

OscillatorNode.prototype.clone = function() {
  return new OscillatorNode({
    id: this.id,
    type: this.type,
    frequency: this.frequency,
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

// Refreshes the cached node to be played again
OscillatorNode.prototype.refresh = function(contextPair) {
  refresh.call(this, contextPair);
};

OscillatorNode.prototype.offlineRefresh = function(contextPair) {
  refresh.call(this, contextPair, "offline");
};

function refresh(contextPair, prefix) {
  var oscillator = contextPair.context.createOscillator();
  oscillator.type = this.type;
  oscillator.frequency.value = this.frequency;
  var gainNode = contextPair.context.createGain();
  oscillator.connect(gainNode);

  var oscName = prefix ? (prefix + 'OscNode') : 'oscNode';
  var nodeName = prefix ? (prefix + 'Node') : 'node';
  this[oscName] = oscillator;
  this[nodeName] = gainNode;
}

OscillatorNode.prototype.play = function(context) {
  var gainNode = this.node,
      oscNode = this.oscNode;
  play.call(this, context, gainNode, oscNode);
};
OscillatorNode.prototype.offlinePlay = function(context) {
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
OscillatorNode.prototype.playHold = function(context) {
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

OscillatorNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    type: OscillatorNode.TYPES.nameFor(this.type),
    frequency: this.frequency,
    detune: this.detune,
    attackDuration: this.attackDuration,
    decayDuration: this.decayDuration,
    releaseDuration: this.releaseDuration,
    sustainDuration: this.sustainDuration,
    attackVolume: this.attackVolume,
    sustainVolume: this.sustainVolume
  };
};

OscillatorNode.prototype.toString = function() {
  return this.id+": OscillatorNode(t:"+this.type+", f:"+this.frequency.toFixed(2)+
    ", ADSR: "+this.attackDuration.toFixed(2)+" ("+this.attackVolume.toFixed(2)+"), "+
             this.decayDuration.toFixed(2)+", "+
             this.sustainDuration.toFixed(2)+" ("+this.sustainVolume.toFixed(2)+"), "+
             this.releaseDuration.toFixed(2)+")";
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
      freq = Utils.randomIn(A0, C6),
      attackDuration = Utils.randomIn(0.01, 1.0),
      decayDuration = Utils.randomIn(0.01, 1.0),
      releaseDuration = Utils.randomIn(0.01, 1.0),
      attackVolume = Utils.randomIn(0.5, 1.5);

  // From w3 spec
  // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
  // Q - 1, with a nominal range of 0.0001 to 1000.
  // gain - 0, with a nominal range of -40 to 40.

  return new OscillatorNode({
    type: OscillatorNode.TYPES[typeI],
    frequency: freq,
    attackDuration: attackDuration,
    decayDuration: decayDuration,
    releaseDuration: releaseDuration,
    attackVolume: attackVolume
  });
};

// All params passed in in case the calling oscillator has changed its parameters before releasing the osc
OscillatorNode.setupEnvelope = function(context, gainNode, oscNode, attackVolume, attackDuration, sustainVolume, decayDuration) {
  var time = context.currentTime;
  gainNode.gain.cancelScheduledValues(time);
  gainNode.gain.value = 1.0;
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(attackVolume, time + attackDuration);
  gainNode.gain.linearRampToValueAtTime(sustainVolume, time + attackDuration + decayDuration);
  oscNode.start(0);
};

/**
  @param context
  @param releaseTime (in seconds)
  @Param gainNode
  @param oscNode
  @param releaseDuration
*/
OscillatorNode.setupRelease = function(context, releaseTime, gainNode, oscNode, releaseDuration) {
  var currentTime = context.currentTime;
  if (releaseTime <= currentTime)
    gainNode.gain.cancelScheduledValues(0);

  gainNode.gain.setValueAtTime(gainNode.gain.value, releaseTime);
  gainNode.gain.linearRampToValueAtTime(0, releaseTime + releaseDuration);
  oscNode.stop(releaseTime + releaseDuration);
};

export default OscillatorNode;
