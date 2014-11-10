module("Node Tests");
var asNEAT = require('asNEAT/asNEAT')['default'],
    CompressorNode = require('asNEAT/nodes/compressorNode')['default'],
    ConvolverNode = require('asNEAT/nodes/convolverNode')['default'],
    DelayNode = require('asNEAT/nodes/delayNode')['default'],
    FeedbackDelayNode = require('asNEAT/nodes/feedbackDelayNode')['default'],
    FilterNode = require('asNEAT/nodes/filterNode')['default'],
    GainNode = require('asNEAT/nodes/gainNode')['default'],
    NoteOscillatorNode = require('asNEAT/nodes/noteOscillatorNode')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    Network = require('asNEAT/network')['default'];


test('NoteOscillatorNode', function() {
  var node = new NoteOscillatorNode();
  for (var i=0; i<100; ++i)
    node.mutate();
  ok(node.attackDuration > 0, "Attack duration always greater than 0");
  ok(node.decayDuration > 0, "Decay duration always greater than 0");
  ok(node.releaseDuration > 0, "Release duration always greater than 0");
  ok(node.sustainDuration > 0, "Sustain duration always greater than 0");
});

test('OscillatorNode', function() {
  var node = new OscillatorNode();
  for (var i=0; i<100; ++i)
    node.mutate();
  ok(node.attackDuration > 0, "Attack duration always greater than 0");
  ok(node.decayDuration > 0, "Decay duration always greater than 0");
  ok(node.releaseDuration > 0, "Release duration always greater than 0");
  ok(node.sustainDuration > 0, "Sustain duration always greater than 0");
});
