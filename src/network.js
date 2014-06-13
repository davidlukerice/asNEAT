
var Utils = require('asNEAT/utils')['default'],
    NoteOscillatorNode = require('asNEAT/nodes/noteOscillatorNode')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    OutNode = require('asNEAT/nodes/outNode')['default'],
    Connection = require('asNEAT/connection')['default'],
    nodeTypes = require('asNEAT/asNEAT')['default'].nodeTypes,
    log = Utils.log,
    name = "Network",
    globalOutNode = new OutNode();

var Network = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);

  // {objectsChanged [], changeDescription string}
  this.lastMutation = null;

  if (this.nodes.length===0) {
    // Create a basic onscillator without any offset to start
    var osc = NoteOscillatorNode.random();
    osc.noteOffset = 0;
    this.nodes.push(globalOutNode);
    this.nodes.push(osc);
  }
  if (this.connections.length===0) {
    this.connections.push(new Connection({
      sourceNode: this.nodes[1],
      targetNode: this.nodes[0],
      weight: 0.5
    }));
  }

  // Only generate a new id if one isn't given in the parameters
  if (parameters && typeof parameters.id !== 'undefined')
    this.id = parameters.id;
  else
    this.id = Utils.createHash();
};

Network.prototype.name = name;
Network.prototype.defaultParameters = {
  nodes: [],
  connections: [],
  connectionMutationRate: 0.1,
  nodeMutationRate: 0.1,
  // percentage of addOscillatorMutations will
  // generate a node for fm, as opposed to strict audio output
  addOscillatorFMMutationRate: 0.5,

  // Percentage of addConnectionMutation will generate a connection
  // for fm, as opposed to a strict audio connection
  addConnectionFMMutationRate: 0.5
};
/*
  Creates a deep clone of this network
 */
Network.prototype.clone = function() {

  // Clone each node
  var clonedNodes = [];
  _.forEach(this.nodes, function(node) {
    clonedNodes.push(node.clone());
  });

  // Clone each connection
  var clonedConnections = [];
  _.forEach(this.connections, function(connection) {
    var clonedsourceNode = _.find(clonedNodes, {id: connection.sourceNode.id});
    var clonedtargetNode = _.find(clonedNodes, {id: connection.targetNode.id});
    clonedConnections.push(connection.clone(clonedsourceNode, clonedtargetNode));
  });

  return new Network({
    nodes: clonedNodes,
    connections: clonedConnections,
    connectionMutationRate: this.connectionMutationRate,
    nodeMutationRate: this.nodeMutationRate
  });
};
/**
  Creates a child network from this and the passed in otherNetwork
*/
Network.prototype.crossWith = function(otherNetwork) {
  var tNodes = this.nodes,
      oNodes = otherNetwork.nodes,
      tConnections = this.connections,
      oConnections = otherNetwork.connections,
      nodes = [], connections = [],
      newNetwork, tIndexes;

  function addNode(node, i) {
    var newNode = node.clone();
    if (typeof i === 'undefined') {
      nodes.push(newNode);
      tIndexes[node.id]=nodes.length-1;
    }
    else
      nodes[i] = newNode;
  }
  function addConnection(connection, i) {
    var source = _.find(nodes, {id: connection.sourceNode.id}),
        target = _.find(nodes, {id: connection.targetNode.id}),
        newConn = connection.clone(source, target);
    if (typeof i === 'undefined') {
      connections.push(newConn);
      tIndexes[connection.id]=connections.length-1;
    }
    else
      connections[i] = newConn;
  }

  // Add all of tElements first, then loop through and add
  // any oElements not in tElements or 50/50 chance.
  // This destroys 'creation order' of the nodes/connections
  // but doesn't matter
  function addElements(tElements, oElements, addHandler) {
    tIndexes = {};
    _.forEach(tElements, function(element) {
      addHandler(element);
    });
    _.forEach(oElements, function(element) {
      var i = tIndexes[element.id];
      // not found, then just push it in
      if (typeof i === "undefined")
        addHandler(element);
      // otherwise, 50/50 of using oNode
      else if (Utils.randomBool())
        addHandler(element, i);
    });
  }

  addElements(tNodes, oNodes, addNode);
  addElements(tConnections, oConnections, addConnection);

  newNetwork = new Network({
    nodes: nodes,
    connections: connections,
  });
  newNetwork.lastMutation = {
    // TODO: Highlight changed objects? maybe add in blue for first parent, red for other?
    objectsChanged: [],
    changeDescription: "Crossed instruments "+this.id+" & "+otherNetwork.id
  };
  updateObjectsInMutation(newNetwork.lastMutation);

  return newNetwork;
};
Network.prototype.play = function() {
  playPrep.call(this);

  // play the oscillators
  _.forEach(this.nodes, function(node) {
    if (node.play)
      node.play();
  });

  return this;
};

/**
  Plays the network until the return handler is called
  @return function stop
**/
Network.prototype.playHold = function() {
  playPrep.call(this);

  var stopHandlers = [];

  // play the oscillators
  _.forEach(this.nodes, function(node) {
    if (node.playHold)
      stopHandlers.push(node.playHold());
  });

  return function stop() {
    _.forEach(stopHandlers, function(handler) {
      handler();
    });
  };
};
function playPrep() {
  // refresh all the nodes since each can only play 
  // once (note: changing in the current webAudio draft)
  _.forEach(this.nodes, function(node) {
    node.refresh();
  });

  // setup all the connections
  _.forEach(this.connections, function(connection) {
    connection.connect();
  });
}

/**
  Randomly mutates the network based on weighted probabilities.
  @note Each one updates lastMutation
*/
Network.prototype.mutate = function() {
  // TODO: Other mutations?
  var mutations = [
    {weight: 0.2, element: this.splitMutation},
    {weight: 0.2, element: this.addOscillator},
    {weight: 0.2, element: this.addConnection},
    {weight: 0.2, element: this.mutateConnectionWeights},
    {weight: 0.2, element: this.mutateNodeParameters}
  ];

  // TODO: Check current generation for similar structural mutation
  // and copy connection id/ids (innovation number)
  var mutation = Utils.weightedSelection(mutations);
  mutation.call(this);
  
  // Clear old changed objects
  _.forEach(this.nodes, function(node) {
    node.hasChanged = false;
  });
  _.forEach(this.connections, function(connection) {
    connection.hasChanged = false;
  });

  updateObjectsInMutation(this.lastMutation);

  return this;
};

// Update newly changed objects
function updateObjectsInMutation(lastMutation) {
  if (lastMutation == null)
    throw "no last mutation from mutate";

  _.forEach(lastMutation.objectsChanged, function(objects) {
    objects.hasChanged = true;
  });
}

/*
  Randomly select a connection to split in two
*/
Network.prototype.splitMutation = function() {
  // Randomly select a connection
  var connections = this.getEnabledConnections(),
      connsLen = connections.length,
      randomI = Utils.randomIndexIn(0, connsLen),
      conn = connections[randomI],
      targetNode = conn.targetNode,
      typesLen = nodeTypes.length,
      typesI = Utils.randomIndexIn(0, typesLen),
      selectedType = nodeTypes[typesI],
      Node = require('asNEAT/nodes/'+selectedType)['default'],
      newNode, inConnection, outConnection, targetParameter,
      targetParameterNodeName;

  // "The new connection leading into the new node receives a weight of 1,
  // and the new connection leading out receives the same weight as the old
  // connection." ~ Stanley
  newNode = Node.random();

  inConnection = new Connection({
    sourceNode: conn.sourceNode,
    targetNode: newNode,
    weight: 1.0
  });

  outConnection = new Connection({
    sourceNode: newNode,
    targetNode: targetNode,
    targetParameter: conn.targetParameter,
    targetParameterNodeName: conn.targetParameterNodeName,
    weight: conn.weight,
    mutationDelta: _.cloneDeep(targetNode.mutationDelta),
    randomMutationRange: _.cloneDeep(targetNode.randomMutationRange)
  });

  conn.disable();
  this.nodes.push(newNode);
  this.connections.push(inConnection);
  this.connections.push(outConnection);

  log('splitting conn '+conn.toString()+' with '+newNode.toString());

  //{objectsChanged [], changeDescription string}
  this.lastMutation = {
    objectsChanged: [
      newNode,
      inConnection,
      outConnection
    ],

    changeDescription: "Split Connection"
  };

  return this;
};

/*
  Adds a single oscillator and connects it to a random input
  in one of the current nodes
 */
Network.prototype.addOscillator = function() {
  var oscillator, possibleTargets, target, connection;

  // Add FM Oscillator or audio oscillator
  if (Utils.randomChance(this.addOscillatorFMMutationRate)) {
    oscillator = OscillatorNode.random();

    // Pick random node that's connectable to connect to
    possibleTargets = _.filter(this.nodes, function(node) {
      return node.connectableParameters &&
             node.connectableParameters.length > 0;
    });
    target = Utils.randomElementIn(possibleTargets);
    var targetParameter = Utils.randomElementIn(target.connectableParameters);
    var ampMin = targetParameter.amplitudeScaling.min;
    var ampMax = targetParameter.amplitudeScaling.max;

    connection = new Connection({
      sourceNode: oscillator,
      targetNode: target,
      targetParameter: targetParameter.name,
      targetParameterNodeName: targetParameter.nodeName,
      weight: Utils.randomIn(ampMin, ampMax),
      mutationDelta: {min: ampMin/12, max: ampMin/12},
      randomMutationRange: {min: ampMin, max: ampMax}
    });

    log('adding fm oscillator('+targetParameter.name+') '+oscillator.toString());
  }
  else {
    oscillator = NoteOscillatorNode.random();
    // Pick a random non oscillator node
    possibleTargets = _.filter(this.nodes, function(node) {
      return node.name !== "OscillatorNode" &&
             node.name !== "NoteOscillatorNode";
    });
    target = Utils.randomElementIn(possibleTargets);

    connection = new Connection({
      sourceNode: oscillator,
      targetNode: target,
      weight: 0.5
    });

    log('adding audio oscillator '+oscillator.toString());
  }

  this.nodes.push(oscillator);
  this.connections.push(connection);

  //{objectsChanged [], changeDescription string}
  this.lastMutation = {
    objectsChanged: [
      oscillator,
      connection
    ],

    changeDescription: "Added Oscillator"
  };

  return this;
};

Network.prototype.addConnection = function() {
  var usingFM = Utils.randomChance(this.addConnectionFMMutationRate);
  var possibleConns = this.getPossibleNewConnections(usingFM);
  if (possibleConns.length===0) {
    log('no possible Connections');
    this.lastMutation = {
      objectsChanged: [],
      changeDescription: "No Mutation (No "+(usingFM ? "FM ":"")+"connections to add)"
    };
    return this;
  }

  var newConnection = Utils.randomElementIn(possibleConns);
  this.connections.push(newConnection);
  log('new connection: '+newConnection.toString());

  //{objectsChanged [], changeDescription string}
  this.lastMutation = {
    objectsChanged: [
      newConnection
    ],
    changeDescription: "Added Connection"
  };

  return this;
};
  Network.prototype.getPossibleNewConnections = function(usingFM) {
    // TODO: Just build the potential connections when new nodes are added/removed?
    //       perfomance hit when adding new nodes, but don't have to O(n^2) for adding a new connection.
    //       Would have to regenerate on copy though

    // TODO: allow multiple connections to different parameters between same nodes for FM synthesis
    var self = this,
        connections = [];

    // Loop through all non output nodes
    _.forEach(this.nodes, function(sourceNode) {
      if (sourceNode.name==="OutNode") 
        return;
      // Create possible connection if it (or its inverse)
      // doesn't exist already
      _.forEach(self.nodes, function(targetNode) {
        if (usingFM && 
            (!targetNode.connectableParameters ||
             targetNode.connectableParameters.length === 0))
          return;
        if (!usingFM &&
            (targetNode.name==="OscillatorNode" ||
             targetNode.name==="NoteOscillatorNode"))
          return;
        if (sourceNode===targetNode)
          return;

        var connExists = _.find(self.connections, function(conn) {
          return (conn.sourceNode === sourceNode &&
                  conn.targetNode === targetNode) ||
                 (conn.sourceNode === targetNode &&
                  conn.targetNode === sourceNode);
        });

        if (connExists)
          return;

        if (usingFM) {
          var targetParameter = Utils.randomElementIn(targetNode.connectableParameters);
          var ampMin = targetParameter.amplitudeScaling.min;
          var ampMax = targetParameter.amplitudeScaling.max;

          connections.push(new Connection({
            sourceNode: sourceNode,
            targetNode: targetNode,
            targetParameter: targetParameter.name,
            targetParameterNodeName: targetParameter.nodeName,
            weight: Utils.randomIn(ampMin, ampMax),
            mutationDelta: {min: ampMin/12, max: ampMin/12},
            randomMutationRange: {min: ampMin, max: ampMax}
          }));
        }
        else {
          connections.push(new Connection({
            sourceNode: sourceNode,
            targetNode: targetNode,
            // less than one to decrease risk of harsh feedback
            weight: 0.5
          }));          
        }
      });
    });
      
    return connections;
  };

/*
  For each connection, mutate based on the given probability
  @param forceMutation {bool} (default: true) Makes at least one connection mutate
*/
Network.prototype.mutateConnectionWeights = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.connectionMutationRate,
      anyMutations = false,
      objectsChanged = [];
  _.forEach(this.connections, function(conn) {
    if (Utils.random() <= mutationRate) {
      objectsChanged.push(conn.mutate());
      anyMutations = true;
    }
  });

  // If no connections were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing weight mutation');
    var conn = Utils.randomElementIn(this.connections);
    objectsChanged.push(conn.mutate());
  }

  //{objectsChanged [], changeDescription string}
  this.lastMutation = {
    objectsChanged: objectsChanged,
    changeDescription: "Mutated connection gain"
  };

  return this;
};

Network.prototype.mutateNodeParameters = function(forceMutation) {
  if (typeof(forceMutation)==='undefined') forceMutation = true;

  var mutationRate = this.nodeMutationRate,
      anyMutations = false,
      objectsChanged = [];
  _.forEach(this.nodes, function(node) {
    if (Utils.random() <= mutationRate) {
      objectsChanged.push(node.mutate());
      anyMutations = true;
    }
  });

  // If no nodes were mutated and forcing a mutation
  // mutate a random one
  if (!anyMutations && forceMutation) {
    log('forcing node mutation');
    var node = Utils.randomElementIn(this.nodes);
    objectsChanged.push(node.mutate());
  }
  //{objectsChanged [], changeDescription string}
  this.lastMutation = {
    objectsChanged: objectsChanged,
    changeDescription: "Mutated Node Parameters"
  };

  return this;
};

Network.prototype.getEnabledConnections = function() {
  return _.filter(this.connections, 'enabled');
};

Network.prototype.getNoteOscillatorNodes = function() {
  return _.filter(this.nodes, {name: 'NoteOscillatorNode'});
};
Network.prototype.getOscillatorNodes = function() {
  return _.filter(this.nodes, {name: 'OscillatorNode'});
};

/**
 Gets the non noteOscillator and oscillator nodes
*/
Network.prototype.getOscillatorAndNoteOscillatorNodes = function() {
  return _.filter(this.nodes, function(node) {
    return node.name === 'OscillatorNode' ||
           node.name === 'NoteOscillatorNode';
  });
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

Network.prototype.toJSON = function() {
  var json = {
    id: this.id,
    nodes: [],
    connections: []
  };
  _.forEach(this.nodes, function(node) {
    json.nodes.push(node.toJSON());
  });
  _.forEach(this.connections, function(connection) {
    json.connections.push(connection.toJSON());
  });
  return JSON.stringify(json);
};
Network.createFromJSON = function(json) {
  var obj = JSON.parse(json),
      createdNodes = [],
      createdConnections = [];

  _.forEach(obj.nodes, function(json) {
    var nodeParams = JSON.parse(json),
        type = Utils.lowerCaseFirstLetter(nodeParams.name),
        Node = require('asNEAT/nodes/'+type)['default'],
        createdNode = new Node(nodeParams);
    createdNodes.push(createdNode);
  });
  _.forEach(obj.connections, function(json) {
    var connectionParams = JSON.parse(json),
        sourceNodeId = connectionParams.sourceNode,
        targetNodeId = connectionParams.targetNode,
        sourceNode, targetNode, createdConnection;
    sourceNode = _.find(createdNodes, {id: sourceNodeId});
    targetNode = _.find(createdNodes, {id: targetNodeId});

    connectionParams.sourceNode = sourceNode;
    connectionParams.targetNode = targetNode;

    createdConnection = new Connection(connectionParams);
    createdConnections.push(createdConnection);
  });

  obj.nodes = createdNodes;
  obj.connections = createdConnections;
  return new Network(obj);
};

export default Network;