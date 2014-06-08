
var Node = require('asNEAT/nodes/node')['default'],
    asNEAT = require('asNEAT/asNEAT')['default'],
    context = asNEAT.context,
    name = "OutNode";

var OutNode = function(parameters) {
  Node.call(this, parameters);
  this.globalGain = asNEAT.globalGain;

  if (!context.supported)
    return;

  var localGain = context.createGain();
  localGain.gain.value = 1.0;
  localGain.connect(this.globalGain);
  this.node = localGain;
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