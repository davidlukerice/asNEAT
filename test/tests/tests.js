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

module("Network Tests");
var Network = require('asNEAT/network')['default'];

test("Same default objects/arrays not referenced by multiple networks", function() {
  var a = new Network();
  var b = new Network();
  notEqual(a.nodes, b.nodes, "Nodes not the same");
});