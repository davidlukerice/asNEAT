
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {}),
      log = ns.Utils.log;

  // TODO: Different kinds of connections?
  var Connection = function(parameters) {
    _.defaults(this, parameters, this.defaultParameters);
    this.gainNode = null;
  };

  Connection.prototype.defaultParameters = {
    inNode: null,
    outNode: null,
    weight: 1.0,
    enabled: true,

    // Chance of mutating only by an amount in mutation delta
    // (ie. weight+=mutationDelta), otherwise (weight=mutationRange)
    mutationDeltaChance: 0.8,
    mutationDelta: {min: -0.2, max: 0.2},
    // note: the inverse is also possible (ex (-max, -min])
    randomMutationRange: {min: 0.1, max: 1.5}
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

  Connection.prototype.mutate = function() {
    log('mutating '+this.toString());

    // Only change the weight by a given delta
    if (ns.Utils.randomChance(this.mutationDeltaChance)) {
      var delta = ns.Utils.randomIn(this.mutationDelta);
      log('mutating by delta '+delta.toFixed(3));
      this.weight+=delta;
    }
    // Use a new random weight in range
    else {
      var range = this.randomMutationRange;
      var newWeight = ns.Utils.randomIn(range);
      // 50% chance of 
      if (ns.Utils.randomBool())
        newWeight*=-1;

      log('mutating with new Weight '+newWeight);
      this.weight = newWeight;
    }
  };

  Connection.prototype.toString = function() {
    return (this.enabled? "" : "*") +
            "connection("+this.weight.toFixed(2)+")("+
            this.inNode.id+" --> "+this.outNode.id+")";
  };

  ns.Connection = Connection;
})(this);