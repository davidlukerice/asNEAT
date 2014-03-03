
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var OutNode = function() {
    ns.Node.call(this);
    this.node = ns.context.destination;
  };

  OutNode.prototype = new ns.Node();
  OutNode.prototype.refresh = function() {
  };
  OutNode.prototype.toString = function() {
    return this.id+": OutNode";
  };

  ns.OutNode = OutNode;

})(this);