
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var FilterNode = function(parameters) {
    ns.Node.call(this);
    _.defaults(this, parameters, this.defaultOptions);
  };

  FilterNode.prototype = new ns.Node();
  FilterNode.prototype.defaultOptions = {
    type: 0,
    frequency: 500,
    detune: 0,
    q: 1,
    gain: 0
  };
  // Refreshes the cached node to be played again
  FilterNode.prototype.refresh = function() {
    var node = ns.context.createBiquadFilter();
    node.type = this.type;
    node.frequency.value = this.frequency;
    node.detune.value = this.detune;
    node.Q.value = this.q;
    node.gain.value = this.gain;

    // cache the current node?
    this.node = node;
  };

  FilterNode.prototype.toString = function() {
    return this.id+": FilterNode("+this.type+","+this.frequency+")";
  };

  ns.FilterNode = FilterNode;

})(this);