
var Node = require('asNEAT/nodes/node')['default'],
    asNEAT = require('asNEAT/asNEAT')['default'],
    context = asNEAT.context,
    offlineContext = asNEAT.offlineContext,
    name = "OutNode";

var OutNode = function(parameters) {
  Node.call(this, parameters);

  // force outNode to have an id of 0 so multiple
  // unlike networks can still be crossed
  this.id = 0;
  
  this.globalGain = asNEAT.globalGain;
  this.offlineGlobalGain = asNEAT.offlineGlobalGain;

  if (!context.supported)
    return;

  var localGain = context.createGain();
  localGain.gain.value = 1.0;
  localGain.connect(this.globalGain);
  this.node = localGain;

  var offlineLocalGain = offlineContext.createGain();
  offlineLocalGain.gain.value = 1.0;
  offlineLocalGain.connect(this.offlineGlobalGain);
  this.offlineNode = offlineLocalGain;
};

OutNode.prototype = Object.create(Node.prototype);
OutNode.prototype.name = name;
OutNode.prototype.defaultParameters = {};
OutNode.prototype.clone = function() {
  return new OutNode({
    id: this.id
  });
};
OutNode.prototype.refresh = function() {
};
OutNode.prototype.offlineRefresh = function() {
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