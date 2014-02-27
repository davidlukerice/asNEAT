
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var Network = function(nodes, connections) {
    
    // nodes in order of: input / output / hidden
    // but is input nodes even a useful thing?
    this.nodes = nodes || [];
    this.connections = connections || [];

    if (!nodes) {
      this.nodes.push(new ns.OscillatorNode());
      this.nodes.push(new ns.OutNode());
    }
    if (!connections) {
      this.connections.push(new ns.Connection(
        this.nodes[0], this.nodes[1], 0.1
      ));
    }
  };
  Network.prototype.play = function() {
    // refresh all the nodes since each can only play 
    // once (note: changing in the current webAudio draft)
    _.forEach(this.nodes, function(node) {
      node.refresh();
    });

    // setup all the connections
    _.forEach(this.connections, function(connection) {
      connection.connect();
    });

    // play the oscillators
    this.nodes[0].play();
  };

  ns.Network = Network;

})(this);