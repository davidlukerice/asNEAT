
var asNEAT = require('asNEAT/asNEAT')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    name = "OutNode";

/**
  Connections
  [otherNode] --> [outNode[node] --> outNode[secondaryNode]] --> [globalGain]
*/
var OutNode = function(parameters) {
  Node.call(this, parameters);

  // force outNode to have an id of 0 so multiple
  // unlike networks can still be crossed
  this.id = 0;

  if (!asNEAT.context.supported)
    return;

  // Secondary gain can be used for processor nodes so they
  // won't loose connections whenever local is refresh (happens
  // during an asNEAT resetGlobalOutNode during a 'panic' action)
  var secondaryNode = asNEAT.context.createGain();
  secondaryNode.gain.value = 1.0;
  secondaryNode.connect(asNEAT.globalGain);
  this.secondaryNode = secondaryNode;

  // Create the internal gain
  this.resetLocalGain();

  // register the outNode
  asNEAT.OutNodes.push(this);
};

OutNode.prototype = Object.create(Node.prototype);
OutNode.prototype.name = name;
OutNode.prototype.defaultParameters = {};
OutNode.prototype.clone = function() {
  return this;
};

OutNode.prototype.refresh = function(contextPair) {
};

OutNode.prototype.offlineRefresh = function(contextPair) {
  var offlineLocalGain = contextPair.context.createGain();
  offlineLocalGain.gain.value = 1.0;
  offlineLocalGain.connect(contextPair.globalGain);
  this.offlineNode = offlineLocalGain;
};

OutNode.prototype.resetLocalGain = function() {
  var oldGain = this.node;
  if (oldGain) {
    oldGain.gain.value = 0;
    oldGain.disconnect();
  }

  var localGain = asNEAT.context.createGain();
  localGain.gain.value = 1.0;
  localGain.connect(this.secondaryNode);
  this.node = localGain;
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
