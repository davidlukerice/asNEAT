
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});


  var OscillatorNode = function(type, frequency) {
    this.type = type || 0;
    this.frequency = frequency || 1000;
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

  ns.OscillatorNode = OscillatorNode;

})(this);