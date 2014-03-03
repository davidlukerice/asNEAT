
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  // TODO: Different kinds of connections?
  var Connection = function(inNode, outNode, weight) {
    this.inNode = inNode;
    this.outNode = outNode;
    this.weight = weight || 0.5;
    this.gainNode = null;
    this.enabled = true;
  };
  Connection.prototype.connect = function() {
    if (!this.enabled) return;

    // The gainNode is what carries the connection's 
    // weight attribute
    this.gainNode = ns.context.createGain();
    this.gainNode.gain.value = this.weight;
    this.inNode.node.connect(this.gainNode);
    this.gainNode.connect(this.outNode.node);
  };

  Connection.prototype.disable = function() {
    this.enabled = false;
  };

  Connection.prototype.toString = function() {
    return (this.enabled? "" : "*") +
            "connection("+this.weight+")("+
            this.inNode.id+" --> "+this.outNode.id+")";
  }

  ns.Connection = Connection;
})(this);