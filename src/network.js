
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var Network = function(parameters) {
    _.defaults(this, parameters, this.defaultParameters);

    // nodes in order of: input / output / hidden
    // but is input nodes even a useful thing?
    this.nodes = nodes || [];
    this.connections = connections || [];

    if (!nodes) {
      this.nodes.push(ns.OscillatorNode.random());
      this.nodes.push(new ns.OutNode());
    }
    if (!connections) {
      this.connections.push(new ns.Connection({
        inNode: this.nodes[0],
        outNode: this.nodes[1],
        weight: 0.1
      }));
    }
  };

  Network.prototype.defaultParameters = {
    nodes: null,
    connections: null,
    connectionMutationRate:  0.1
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
    // TODO: Better way to access just the oscillator nodes
    _.forEach(this.nodes, function(node) {
      if (node.play)
        node.play();
    });
  };
  Network.prototype.mutate = function() {
    var mutations = [
      {weight: 0.5, element: this.splitMutation},
      {weight: 0.5, element: this.addOscillator}
    ];
    var mutation = ns.Utils.weightedSelection(mutations);
    mutation();

    // TODO: Add Connection
    // TODO: Add oscillator ( part of new connection?)
    // TODO: Mutate a weight
    // TODO: Mutate a node parameter
    // TODO: Other mutations?
  };

  /*
    Randomly select a connection to split in two
  */
  Network.prototype.splitMutation = function() {
    // Randomly select a connection
    var connections = this.getEnabledConnections(),
        connsLen = connections.length,
        randomI = ns.Utils.randomIndexIn(0, connsLen),
        conn = connections[randomI],
        nodes = ns.nodes,
        nodesLen = nodes.length,
        nodesI = ns.Utils.randomIndexIn(0, nodesLen),
        nodeType = nodes[nodesI];

    // TODO: Create a random new node

    // The first new connection matches the same weight
    // as the old one and the new connection after the 
    // split node is 1.0
    var newNode = ns[nodeType].random(),
        toConnection = new ns.Connection({
          inNode: conn.inNode,
          outNode: newNode,
          weight: conn.weight
        }),
        fromConnection = new ns.Connection({
          inNode: newNode,
          outNode: conn.outNode
        });

    conn.disable();
    this.nodes.push(newNode);
    this.connections.push(toConnection);
    this.connections.push(fromConnection);
  };

  /*
    Adds a single oscillator and connects it to a random input
    in one of the current nodes
   */
  Network.prototype.addOscillator = function() {
    var oscillator = ns.OscillatorNode.random();
    
    // TODO: will the out node always be [1]?
    var connection = new ns.Connection({
      inNode: oscillator,
      outNode: this.nodes[1],
      weight: 0.5
    });

    this.nodes.push(oscillator);
    this.connections.push(connection);
    // TODO: find new input to make a connection to
    // TODO: For now, just connect it directly to the outNode
  };

  Network.prototype.getEnabledConnections = function() {
    // TODO: Cache if a performance issue
    return _.filter(this.connections, 'enabled');
  };

  Network.prototype.toString = function() {
    var str = "Nodes:<br>";
    _.forEach(this.nodes, function(ele) {
      str+=ele.toString()+"<br>";
    });

    str += "<br>Connections:<br>";
    _.forEach(this.connections, function(ele) {
      str+=ele.toString()+"<br>";
    });

    return str;
  };

  ns.Network = Network;

})(this);