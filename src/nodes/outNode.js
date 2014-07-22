
var Node = require('asNEAT/nodes/node')['default'],
    name = "OutNode";

var OutNode = function(parameters) {
  Node.call(this, parameters);

  // force outNode to have an id of 0 so multiple
  // unlike networks can still be crossed
  this.id = 0;
};

OutNode.prototype = Object.create(Node.prototype);
OutNode.prototype.name = name;
OutNode.prototype.defaultParameters = {};
OutNode.prototype.clone = function() {
  return new OutNode({
    id: this.id
  });
};

OutNode.prototype.refresh = function(contextPair) {
  var localGain = contextPair.context.createGain();
  localGain.gain.value = 1.0;
  localGain.connect(contextPair.globalGain);
  this.node = localGain;
};

OutNode.prototype.offlineRefresh = function(contextPair) {
  var offlineLocalGain = contextPair.context.createGain();
  offlineLocalGain.gain.value = 1.0;
  offlineLocalGain.connect(contextPair.globalGain);
  this.offlineNode = offlineLocalGain;
};

OutNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id
  };
};
OutNode.prototype.toString = function() {
  return this.id+": OutNode";
};

export default OutNode;