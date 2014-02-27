
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var OutNode = function() {
    this.node = ns.context.destination;
  };
  OutNode.prototype.refresh = function() {
  };

  ns.OutNode = OutNode;

})(this);