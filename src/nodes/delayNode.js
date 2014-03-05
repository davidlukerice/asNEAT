
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var DelayNode = function(parameters) {
    ns.Node.call(this);
    _.defaults(this, parameters, this.defaultOptions);
  };

  DelayNode.prototype = new ns.Node();
  DelayNode.prototype.defaultOptions = {
    // in seconds
    delayTime: 0
  };
  // Refreshes the cached node to be played again
  DelayNode.prototype.refresh = function() {
    var node = ns.context.createDelay();
    node.delayTime = this.delayTime;

    // cache the current node?
    this.node = node;
  };

  DelayNode.prototype.toString = function() {
    return this.id+": DelayNode("+this.delayTime.toFixed(2)+")";
  };

  DelayNode.random = function() {
    // TODO: Tweak possible delays to that of typical delay pedals?
    var delayTime = ns.Utils.randomIn(0.0, 3.0);

    return new DelayNode({
      delayTime: delayTime
    });
  };

  ns.DelayNode = DelayNode;

})(this);