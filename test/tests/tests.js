module("Basic Tests");
 
test("testing runner", function() {
  ok(true, "true is truthy!");
  equal(1, true, "1 is truthy");
  notEqual(0, true, "0 is NOT truthy");
});

module("Util Tests");
var Utils = require('asNEAT/utils')['default'];

test("randomIn", function() {
  for (var i=0; i<20; ++i) {
    var min = Math.random()*100,
        max = min + Math.random()*100+1,
        randomIn = Utils.randomIn(min, max);
    ok(randomIn < max && randomIn >= min, "In Range ["+min+','+max+')');
  }
});

test("clamp", function() {
  var min = -10,
      max = 10;
  equal(Utils.clamp(5, min, max), 5, 'same within range');
  equal(Utils.clamp(20, min, max), max, 'clamps to max');
  equal(Utils.clamp(-20, min, max), min, 'clamps to min');
});

test("cantorPair", function() {
  var x = 3,
      y = 5,
      z = Utils.cantorPair(x, y);
  equal(x, Utils.reverseCantorPair(z).x, 'can reverse x');
  equal(y, Utils.reverseCantorPair(z).y, 'can reverse y');
});

test("extend", function() {
  var b = {},
      b2 = {},
      def = {a: 1, b:2, x: [], y: {}},
      par = {b:3};

  Utils.extend(b, def, par);
  Utils.extend(b2, def, par);

  equal(b.a, def.a, 'default remains');
  equal(b.b, par.b, 'parameter overrides');
  notEqual(b.x, b2.x, 'default arrays not equal');
  notEqual(b.y, b2.y, 'default objects not equal');
});

test("roundTo2Places", function() {
  equal(Utils.roundTo2Places(1), 1, 'identity');
  equal(Utils.roundTo2Places(1.005), 1.01, 'round up');
  equal(Utils.roundTo2Places(1.0049), 1.00, 'round down');
});

test("frequencyForNote", function() {
  equal(Utils.roundTo2Places(Utils.frequencyForNote('c3')), 130.81, 'c3');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('c4')), 261.63, 'c4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C4')), 261.63, 'C4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C4#')), 277.18, 'C4#');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('D4')), 293.66, 'D4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('E4b')), 311.13, 'E4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('E4')), 329.63, 'E4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('F4')), 349.23, 'F4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('F4#')), 369.99, 'F4#');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('G4')), 392.00, 'G4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('A4b')), 415.30, 'A4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('A4')), 440.00, 'A4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('B4b')), 466.16, 'B4b');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('B4')), 493.88, 'B4');
  equal(Utils.roundTo2Places(Utils.frequencyForNote('C5')), 523.25, 'C5');
});
test("frequencyOfStepsFromRootNote", function() {
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(-2)), 392.00, '-2');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(-1)), 415.30, '-1');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(0)), 440.00, '0');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(1)), 466.16, '1');
  equal(Utils.roundTo2Places(Utils.frequencyOfStepsFromRootNote(2)), 493.88, '2');
});

module("Network Tests");
var Network = require('asNEAT/network')['default'];

test('network', function() {
var a = new Network()
  equal(a.connections.length, 1, "network starts with single connection");
});

test("Same default objects/arrays not referenced by multiple networks", function() {
  var a = new Network();
  var b = new Network();
  notEqual(a.nodes, b.nodes, "Nodes not the same");
});

test("split node", function() {
  var a = new Network(),
      connection = a.connections[0];

  a.splitMutation();
  equal(a.connections.length, 3, "connections increased (1_old+2_new)");
  ok(!connection.enabled, "old connection is disabled");
});