
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  // TODO: Different kinds of connections?
  var Connection = function(inNode, outNode, weight) {
    this.inNode = inNode;
    this.outNode = outNode;
    this.weight = weight || 0.5;
    this.gainNode = null;
  };
  Connection.prototype.connect = function() {
    // The gainNode is what carries the connection's 
    // weight attribute
    this.gainNode = ns.context.createGain();
    this.gainNode.gain.value = this.weight;
    this.inNode.node.connect(this.gainNode);
    this.gainNode.connect(this.outNode.node);
  };

  ns.Connection = Connection;
})(this);