
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var OscillatorNode = function(parameters) {
    ns.Node.call(this);
    _.defaults(this, parameters, this.defaultOptions);
  };

  OscillatorNode.prototype = new ns.Node();

  OscillatorNode.prototype.defaultOptions = {
    type: 0,
    frequency: 1000,
    detune: 0
  };

  // Refreshes the cached node to be played again
  OscillatorNode.prototype.refresh = function() {
    var node = ns.context.createOscillator();
    node.type = this.type;
    node.frequency.value = this.frequency;
    // cache the current node?
    this.node = node;
  };
  OscillatorNode.prototype.play = function() {
    var node = this.node;
    node.start(0);
    setTimeout(function() {
      node.stop(0);
    }, 500);
  };

  OscillatorNode.prototype.toString = function() {
    return this.id+": OscillatorNode("+this.type+","+this.frequency+")";
  };

  ns.OscillatorNode = OscillatorNode;

})(this);