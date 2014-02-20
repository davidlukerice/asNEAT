
this['asNEAT'] = this['asNEAT'] || {};

!function(global) {
  "use strict";

  var baseNS = 'asNEAT',
    ns = global[baseNS];

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  var context = new AudioContext();

  var Network = function(nodes, connections) {
    
    // nodes in order of: input / output / hidden
    // but is input nodes even a useful thing?
    this.nodes = nodes || [];
    this.connections = connections || [];

    if (!nodes) {
      this.nodes.push(new OscillatorNode());
      this.nodes.push(new OutNode());
    }
    if (!connections) {
      this.connections.push(new Connection(
        this.nodes[0], this.nodes[1]
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

  // TODO: Different kinds of connections?
  var Connection = function(inNode, outNode) {
    this.inNode = inNode;
    this.outNode = outNode;
  };
  Connection.prototype.connect = function() {
    this.inNode.node.connect(this.outNode.node);
  };

  var OscillatorNode = function(type, frequency) {
    this.type = type || 0;
    this.frequency = frequency || 1000;
  };
  // Refreshes the cached node to be played again
  OscillatorNode.prototype.refresh = function() {
    var node = context.createOscillator();
    node.type = this.type;
    node.frequency.value = this.frequency;
    // cache the current node?
    this.node = node;
  };
  OscillatorNode.prototype.play = function() {
    var node = this.node;
    node.start(0);
    setTimeout(function() {
      node.stop(0);
    }, 500);
  }

  var OutNode = function() {
    this.node = context.destination;
  };
  OutNode.prototype.refresh = function() {
  };

  ns.Network = Network;
  ns.Connection = Connection;
  ns.Node = Node;
;

}(this);