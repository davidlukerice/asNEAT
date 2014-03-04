// Note: Yes the ! in the name is intentional. It makes sure the concat puts node before
// any of its children. I know its bad but that should be fixed whenever I add in the es6
// transpiler.

(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var Node = function() {
    this.id = Node.getNextId();
  };
  Node.prototype.refresh = function() {
  };
  Node.prototype.toString = function() {
    return "Node";
  };
  
  Node.id=0;
  Node.getNextId = function() {
    return Node.id++;
  };
  
  ns.Node = Node;

})(this);