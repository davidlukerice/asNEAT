
var Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context,
    name = "OutNode";

var OutNode = function(parameters) {
  Node.call(this, parameters);
  this.node = context.destination;
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
    name: name
  };
};
OutNode.prototype.toString = function() {
  return this.id+": OutNode";
};

export default OutNode;