
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var GainNode = function(parameters) {
    ns.Node.call(this);
    _.defaults(this, parameters, this.defaultOptions);
  };

  GainNode.prototype = new ns.Node();
  GainNode.prototype.defaultOptions = {
    // Represents the amount of gain to apply. Its default value is 1
    // (no gain change). The nominal minValue is 0, but may be set
    // negative for phase inversion. The nominal maxValue is 1, but
    // higher values are allowed (no exception thrown).This parameter
    // is a-rate
    gain: 0
  };
  // Refreshes the cached node to be played again
  GainNode.prototype.refresh = function() {
    var node = ns.context.createGain();
    node.gain.value = this.gain;
    this.node = node;
  };

  GainNode.prototype.toString = function() {
    return this.id+": GainNode("+
      this.gain.toFixed(2)+")";
  };

  /*
    @return a GainNode with a gain of [0.5, 1.5) || (-1.5, -5.1]
  */
  GainNode.random = function() {
    var isInverse = ns.Utils.randomBool(),
        gain = ns.Utils.randomIn(0.5, 1.5);
    gain*= (isInverse? -1 : 1);

    return new GainNode({
      gain: gain
    });
  };

  ns.GainNode = GainNode;

})(this);

