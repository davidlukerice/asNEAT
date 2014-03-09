
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var DelayNode = function(parameters) {
    ns.Node.call(this, parameters);
  };

  DelayNode.prototype = new ns.Node();
  DelayNode.prototype.defaultParameters = {
    // in seconds
    delayTime: 0,

    // [0,1], although >=1 is allowed... not advised
    feedbackRatio: 0.2,

    parameterMutationChance: 0.1,
    mutatableParameters: [
      {
        name: 'delayTime',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -0.5, max: 0.5},
        randomMutationRange: {min: 0.0, max: 3.0}
      },{
        name: 'feedbackRatio',
        // doesn't make sense to change type by a delta
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -0.2, max: 0.2},
        // TODO: set global min?
        randomMutationRange: {min: 0, max: 0.6}
      }
    ]
  };
  // Refreshes the cached node to be played again
  DelayNode.prototype.refresh = function() {
    var delayNode = ns.context.createDelay();
    delayNode.delayTime = this.delayTime;

    // add an additional gain node for 'delay' feedback
    var gainNode = ns.context.createGain();
    gainNode.gain.value = this.feedbackRatio;

    delayNode.connect(gainNode);
    gainNode.connect(delayNode);

    this.node = delayNode;
  };

  DelayNode.prototype.toString = function() {
    return this.id+": DelayNode("+
      this.delayTime.toFixed(2)+","+
      this.feedbackRatio.toFixed(2)+")";
  };

  DelayNode.random = function() {
    return new DelayNode({
      delayTime: ns.Utils.randomIn(0.0, 3.0),
      feedbackRatio: ns.Utils.randomIn(0, 0.6)
    });
  };

  ns.DelayNode = DelayNode;

})(this);