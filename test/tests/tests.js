module("Basic Tests");
 
test("testing runner", function() {
  ok(true, "true is truthy!");
  equal(1, true, "1 is truthy");
  notEqual(0, true, "0 is NOT truthy");
});