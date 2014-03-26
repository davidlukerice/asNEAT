module("Basic Tests");
 
test("testing runner", function() {
  ok(true, "true is truthy!");
  equal(1, true, "1 is truthy");
  notEqual(0, true, "0 is NOT truthy");
});

module("Util Test");

module("Network Test");

var Network = require('asNEAT/network')['default'];

test("Same default objects/arrays not referenced by multiple networks", function() {
  var a = new Network();
  var b = new Network();
  notEqual(a.nodes, b.nodes, "Nodes not the same");
});