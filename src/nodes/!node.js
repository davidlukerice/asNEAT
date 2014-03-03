
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
  }
  ns.Node = Node;

})(this);