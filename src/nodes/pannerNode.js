
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var PannerNode = function(parameters) {
    ns.Node.call(this);
    _.defaults(this, parameters, this.defaultParameters);
  };

  PannerNode.prototype = new ns.Node();
  PannerNode.prototype.defaultParameters = {
    // position
    x: 0,
    y: 0,
    z: 0
  };
  // Refreshes the cached node to be played again
  PannerNode.prototype.refresh = function() {
    var node = ns.context.createPanner();
    node.setPosition(this.x, this.y, this.z);
    //node.setVelocity
    //node.setOrientation
    //other parameters: distance model, sound cone, &c...

    // cache the current node?
    this.node = node;
  };

  PannerNode.prototype.toString = function() {
    return this.id+": PannerNode("+this.x.toFixed(2)+
      ", "+this.y.toFixed(2)+", "+this.z.toFixed(2)+")";
  };

  PannerNode.random = function() {
    var x = ns.Utils.randomIn(-5.0, 5.0),
        y = ns.Utils.randomIn(-5.0, 5.0),
        z = ns.Utils.randomIn(-5.0, 5.0);

    return new PannerNode({
      x:x,
      y:y,
      z:z
    });
  };

  ns.PannerNode = PannerNode;

})(this);