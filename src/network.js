
var Utils = require('asNEAT/utils')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    OutNode = require('asNEAT/nodes/outNode')['default'],
    Connection = require('asNEAT/connection')['default'],
    nodeTypes = require('asNEAT/asNEAT')['default'].nodeTypes,
    log = Utils.log;

var Network = function(parameters) {
  _.defaults(this, parameters, this.defaultParameters);

  if (this.nodes.length===0) {
    this.nodes.push(OscillatorNode.random());
    this.nodes.push(new OutNode());
  }
  if (this.connections.length===0) {
    this.connections.push(new Connection({
      inNode: this.nodes[0],
      outNode: this.nodes[1],
      weight: 0.1
    }));
  }
};

Network.prototype.defaultParameters = {
  nodes: [],
  connections: [],
  connectionMutationRate: 0.1,
  nodeMutationRate: 0.1
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
    {weight: 0.25, element: this.splitMutation},
    {weight: 0.25, element: this.addOscillator},
    {weight: 0.25, element: this.mutateConnectionWeights},
    {weight: 0.25, element: this.mutateNodeParameters}
  ];
  var mutation = Utils.weightedSelection(mutations);
  mutation.call(this);

  // TODO: Other mutations?
};

/*
  Randomly select a connection to split in two
*/
Network.prototype.splitMutation = function() {
  // Randomly select a connection
  var connections = this.getEnabledConnections(),
      connsLen = connections.length,
      randomI = Utils.randomIndexIn(0, connsLen),
      conn = connections[randomI],
      typesLen = nodeTypes.length,
      typesI = Utils.randomIndexIn(0, typesLen),
      selectedType = nodeTypes[typesI],
      Node = require('asNEAT/nodes/'+selectedType)['default'];

  // TODO: Create a random new node

  // The first new connection matches the same weight
  // as the old one and the new connection after the 
  // split node is 1.0
  var newNode = Node.random(),
      toConnection = new Connection({
        inNode: conn.inNode,
        outNode: newNode,
        weight: conn.weight
      }),
      fromConnection = new Connection({
        inNode: newNode,
        outNode: conn.outNode
      });

  conn.disable();
  this.nodes.push(newNode);
  this.connections.push(toConnection);
  this.connections.push(fromConnection);

  log('splitting conn '+conn.toString()+' with '+newNode.toString());
};

/*
  Adds a single oscillator and connects it to a random input
  in one of the current nodes
 */
Network.prototype.addOscillator = function() {
  var oscillator = OscillatorNode.random();
  
  // TODO: will the out node always be [1]?
  var connection = new Connection({
    inNode: oscillator,
    outNode: this.nodes[1],
    weight: 0.5
  });

  this.nodes.push(oscillator);
  this.connections.push(connection);
  // TODO: find new input to make a connection to
  // TODO: For now, just connect it directly to the outNode

  log('adding oscillator '+oscillator.toString());
};

/*
  @param forceMutation {bool} (default: true) Makes at least one connection mutate
*/
Network.prototype.mutateConnectionWeights = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.connectionMutationRate,
      anyMutations = false;
  _.forEach(this.connections, function(conn) {
    if (Utils.random() <= mutationRate) {
      conn.mutate();
      anyMutations = true;
    }
  });

  // If no connections were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing weight mutation');
    var conn = Utils.randomElementIn(this.connections);
    conn.mutate();
  }
};

Network.prototype.mutateNodeParameters = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.nodeMutationRate,
      anyMutations = false;
  _.forEach(this.nodes, function(node) {
    if (Utils.random() <= mutationRate) {
      node.mutate();
      anyMutations = true;
    }
  });

  // If no nodes were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing node mutation');
    var node = Utils.randomElementIn(this.nodes);
    node.mutate();
  }
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

export default Network;