
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
  Network.prototype.mutate = function() {
    // TODO: Randomly select mutation?
    this.splitMutation();

    // TODO: Add Connection
    // TODO: Mutate a weight
    // TODO: Mutate a node
    // TODO: Other mutations?
  };

  /*
    Randomly select a connection to split in two
  */
  Network.prototype.splitMutation = function() {
    // Randomly select a connection
    var connections = this.connections,
        len = connections.length,
        randomIndex = ns.Utils.randomIndexIn(0, len),
        conn = connections[randomIndex];

    // TODO: Create a random new node
    // TODO: Random weight? or just stick with 0.5?
    var newNode = new ns.FilterNode(),
        toConnection = new ns.Connection(conn.inNode, newNode),
        fromConnection = new ns.Connection(newNode, conn.outNode);
    conn.disable();
    this.nodes.push(newNode);
    this.connections.push(toConnection);
    this.connections.push(fromConnection);
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