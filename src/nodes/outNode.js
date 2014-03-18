
var Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context;

var OutNode = function() {
  Node.call(this);
  this.node = context.destination;
};

OutNode.prototype = new Node();
OutNode.prototype.refresh = function() {
};
OutNode.prototype.toString = function() {
  return this.id+": OutNode";
};

export default OutNode;