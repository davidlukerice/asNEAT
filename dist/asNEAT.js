/* asNEAT 0.2.0 2014-06-03 */
define("asNEAT/asNEAT", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var ns = {};
    
    window.AudioContext = window.AudioContext ||
      window.webkitAudioContext ||
      function() {this.supported = false;};
    ns.context = new window.AudioContext();
    if (typeof ns.context.supported === 'undefined')
      ns.context.supported = true;
    
    // only create the gain if context is found
    // (helps on tests)
    if (ns.context.createGain) {
      ns.globalGain = ns.context.createGain();
      ns.globalGain.gain.value = 1.0;
      ns.globalGain.connect(ns.context.destination);
    }
    
    
    // All the registered usable nodes
    // TODO: Give weights for selection in mutation?
    ns.nodeTypes = [
      'gainNode',
      'filterNode',
      'delayNode',
      'feedbackDelayNode',
      
      //'pannerNode' // Implemented, but doesn't do much without other mutations
      
      'compressorNode',
      'convolverNode'
    
      //wave shaper node? // like distortion? eq?
    ];
    
    __exports__["default"] = ns;
  });
define("asNEAT/connection", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        log = Utils.log,
        context = require('asNEAT/asNEAT')['default'].context,
        name = "Connection";
    
    // TODO: Different kinds of connections?
    var Connection = function(parameters) {
      Utils.extend(this, this.defaultParameters, parameters);
      this.gainNode = null;
      this.hasChanged = false;
      this.id = Utils.cantorPair(this.sourceNode.id, this.targetNode.id);
    };
    
    Connection.prototype.name = name;
    Connection.prototype.defaultParameters = {
      sourceNode: null,
      targetNode: null,
      
      // null if connecting to audio input of targetNode
      targetParameter: null,
    
      weight: 1.0,
      enabled: true,
    
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.2, max: 0.2},
      randomMutationRange: {min: 0.1, max: 1.5},
      discreteMutation: false
    };
    
    /**
      @param clonedsourceNode {Node} (optional)
      @param clonedtargetNode {Node} (optional)
    */
    Connection.prototype.clone = function(clonedsourceNode, clonedtargetNode) {
      var sourceNode = clonedsourceNode || this.sourceNode.clone();
      var targetNode = clonedtargetNode || this.targetNode.clone();
      return new Connection({
        sourceNode: sourceNode,
        targetNode: targetNode,
        targetParameter: this.targetParameter,
        weight: this.weight,
        enabled: this.enabled,
        mutationDeltaChance: this.mutationDeltaChance,
        mutationDelta: _.clone(this.mutationDelta),
        randomMutationRange: _.clone(this.randomMutationRange),
        discreteMutation: this.discreteMutation
      });
    };
    Connection.prototype.connect = function() {
      if (!this.enabled) return;
    
      // The gainNode is what carries the connection's 
      // weight attribute
      this.gainNode = context.createGain();
      this.gainNode.gain.value = this.weight;
      this.sourceNode.node.connect(this.gainNode);
    
      var param = this.targetParameter;
      if (param === null)
        this.gainNode.connect(this.targetNode.node);
      else
        this.gainNode.connect(this.targetNode.node[param]);
    
      return this;
    };
    
    Connection.prototype.disable = function() {
      this.enabled = false;
      return this;
    };
    
    Connection.prototype.mutate = function() {
      var mutationInfo = Utils.mutateParameter({
        obj: this,
        parameter: 'weight',
        mutationDeltaChance: this.mutationDeltaChance,
        mutationDelta: this.mutationDelta,
        randomMutationRange: this.randomMutationRange
      });
      return this;
    };
    
    Connection.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        weight: this.weight,
        enabled: this.enabled,
        sourceNode: this.sourceNode.name,
        targetNode: this.targetNode.name,
        targetParameter: this.targetParameter
      };
    };
    
    Connection.prototype.toString = function() {
      return (this.enabled? "" : "*") +
              "connection("+this.weight.toFixed(2)+")("+
              this.sourceNode.id+" --> "+this.targetNode.id+
              (this.targetParameter ? (": "+this.targetParameter) : "" )+")";
    };
    
    __exports__["default"] = Connection;
  });
define("asNEAT/network", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
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
        this.id = Network.getNextId();
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
          nodes = [], connections = [], tI, oI,
          tLen, oLen, tItem, oItem, newNetwork;
    
      // Copy over nodes in order of index
      function pushTNode() {
        nodes.push(tItem.clone());
        tItem = tNodes[tI++];
      }
      function pushONode() {
        nodes.push(oItem.clone());
        oItem = oNodes[oI++];
      }
      function pushTConnection() {
        var source = _.find(nodes, {id: tItem.sourceNode.id});
        var target = _.find(nodes, {id: tItem.targetNode.id});
        connections.push(tItem.clone(source, target));
        tItem = tConnections[tI++];
      }
      function pushOConnection() {
        var source = _.find(nodes, {id: oItem.sourceNode.id});
        var target = _.find(nodes, {id: oItem.targetNode.id});
        connections.push(oItem.clone(source, target));
        oItem = oConnections[oI++];
      }
    
      function mergeElements(tElements, oElements, pushTHandler, pushOHandler) {
        tI = 0; oI=0;
        tLen = tElements.length;
        oLen = oElements.length;
        tItem = tElements[tI++];
        oItem = oElements[oI++];
    
        while(tI <= tLen || oI <= oLen) {
          if (tItem && !oItem)
            pushTHandler();
          else if (!tItem && oItem)
            pushOHandler();
          else if (tItem.id === oItem.id) {
            if (Utils.randomBool()) {
              pushTHandler();
              oItem = oElements[oI++];
            }
            else {
              pushOHandler();
              tItem = tElements[tI++];
            }
          }
          else if (tItem.id < oItem.id)
            pushTHandler();
          // oItem.id < tItem.id
          else
            pushOHandler();
        }
      }
    
      mergeElements(tNodes, oNodes, pushTNode, pushONode);
      mergeElements(tConnections, oConnections, pushTConnection, pushOConnection);
    
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
      // TODO: Better way to access just the oscillator nodes
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
      // TODO: Better way to access just the oscillator nodes
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
          newNode, inConnection, outConnection, targetParameter;
    
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
    /**
     Gets the non noteOscillatorNode oscillator nodes
    */
    Network.prototype.getOscillatorNodes = function() {
      return _.filter(this.nodes, {name: 'OscillatorNode'});
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
    
    Network.id=0;
    Network.getNextId = function() {
      return Network.id++;
    };
    
    __exports__["default"] = Network;
  });
define("asNEAT/nodes/compressorNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "CompressorNode";
    
    var CompressorNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    CompressorNode.prototype = Object.create(Node.prototype);
    CompressorNode.prototype.name = name;
    CompressorNode.prototype.defaultParameters = {
      // The decibel value above which the compression will start taking effect.
      // Its default value is -24, with a nominal range of -100 to 0.
      threshold: 0,
    
      // A decibel value representing the range above the threshold where the curve
      // smoothly transitions to the "ratio" portion. Its default value is 30, with
      // a nominal range of 0 to 40.
      knee: 0,
    
      // The amount of dB change in input for a 1 dB change in output. Its default
      // value is 12, with a nominal range of 1 to 20.
      ratio: 0,
    
      // A read-only decibel value for metering purposes, representing the current
      // amount of gain reduction that the compressor is applying to the signal.
      // If fed no signal the value will be 0 (no gain reduction). The nominal range
      // is -20 to 0.
      reduction: 0,
    
      // The amount of time (in seconds) to reduce the gain by 10dB. Its default
      // value is 0.003, with a nominal range of 0 to 1.
      attack: 0,
    
      // The amount of time (in seconds) to increase the gain by 10dB. Its default
      // value is 0.250, with a nominal range of 0 to 1.
      release: 0,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'threshold',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: -50, max: 10}
        },{
          name: 'knee',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: 20, max: 40}
        },{
          name: 'ratio',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -1, max: 1},
          // TODO: set global min?
          randomMutationRange: {min: 8, max: 16}
        },{
          name: 'reduction',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -1, max: 1},
          // TODO: set global min?
          randomMutationRange: {min: -10, max: 0}
        },{
          name: 'attack',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.02, max: 0.02},
          // TODO: set global min?
          randomMutationRange: {min: 0, max: 0.1}
        },{
          name: 'release',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.1, max: 0.1},
          // TODO: set global min?
          randomMutationRange: {min: 0, max: 0.1}
        }
      ]
    };
    
    CompressorNode.prototype.clone = function() {
      return new CompressorNode({
        id: this.id,
        threshold: this.threshold,
        knee: this.knee,
        ratio: this.ratio,
        reduction: this.reduction,
        attack: this.attack,
        release: this.release,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    CompressorNode.prototype.refresh = function() {
      var node = context.createDynamicsCompressor();
      node.threshold.value = this.threshold;
      node.knee.value = this.knee;
      node.ratio.value = this.ratio;
      node.reduction.value = this.reduction;
      node.attack.value = this.attack;
      node.release.value = this.release;
    
      // cache the current node?
      this.node = node;
    };
    
    CompressorNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        threshold: this.threshold,
        knee: this.knee,
        ratio: this.ratio,
        reduction: this.reduction,
        attack: this.attack,
        release: this.release
      };
    };
    
    CompressorNode.prototype.toString = function() {
      return this.id+": CompressorNode("+
        this.threshold.toFixed(2)+","+
        this.knee.toFixed(2)+","+
        this.ratio.toFixed(2)+","+
        this.reduction.toFixed(2)+","+
        this.attack.toFixed(2)+","+
        this.release.toFixed(2)+")";
    };
    
    CompressorNode.random = function() {
      var threshold = Utils.randomIn(-50, 10),
          knee = Utils.randomIn(20, 40),
          ratio = Utils.randomIn(8, 16),
          reduction = Utils.randomIn(-10, 0),
          attack = Utils.randomIn(0, 0.1),
          release = Utils.randomIn(0, 0.1);
    
      return new CompressorNode({
        threshold: threshold,
        knee: knee,
        ratio: ratio,
        reduction: reduction,
        attack: attack,
        release: release
      });
    };
    
    __exports__["default"] = CompressorNode;
  });
define("asNEAT/nodes/convolverNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "ConvolverNode";
    
    var ConvolverNode = function(parameters) {
      Node.call(this, parameters);
    
      // TODO: Different types of convolution instead of just noise
      if (this.audioBuffer === null && context.supported) {
        var noiseBuffer = context.createBuffer(2, 0.5 * context.sampleRate, context.sampleRate),
            left = noiseBuffer.getChannelData(0),
            right = noiseBuffer.getChannelData(1);
    
        for (var i = 0; i < noiseBuffer.length; i++) {
            left[i] = Math.random() * 2 - 1;
            right[i] = Math.random() * 2 - 1;
        }
    
        this.audioBuffer = noiseBuffer;    
      }
    
    };
    
    ConvolverNode.prototype = Object.create(Node.prototype);
    ConvolverNode.prototype.name = name;
    ConvolverNode.prototype.defaultParameters = {
      audioBuffer: null,
      parameterMutationChance: 0.1
    };
    
    ConvolverNode.prototype.clone = function() {
      return new ConvolverNode({
        id: this.id,
        audioBuffer: this.audioBuffer,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    
    // Refreshes the cached node to be played again
    ConvolverNode.prototype.refresh = function() {
      var node = context.createConvolver();
      node.buffer = this.audioBuffer;
      this.node = node;
    };
    
    ConvolverNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id
      };
    };
    
    ConvolverNode.prototype.toString = function() {
      return this.id+": ConvolverNode()";
    };
    
    /*
      @return a ConvolverNode
    */
    ConvolverNode.random = function() {
      return new ConvolverNode();
    };
    
    __exports__["default"] = ConvolverNode;
  });
define("asNEAT/nodes/delayNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "DelayNode";
    
    var DelayNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    DelayNode.prototype = Object.create(Node.prototype);
    DelayNode.prototype.name = name;
    DelayNode.prototype.defaultParameters = {
      // in seconds
      delayTime: 0,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'delayTime',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.5, max: 0.5},
          randomMutationRange: {min: 0.0, max: 3.0}
        }
      ]
    };
    
    DelayNode.prototype.clone = function() {
      return new DelayNode({
        id: this.id,
        delayTime: this.delayTime,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    DelayNode.prototype.refresh = function() {
      var delayNode = context.createDelay();
      delayNode.delayTime.value = this.delayTime;
      this.node = delayNode;
    };
    
    DelayNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        delayTime: this.delayTime
      };
    };
    
    DelayNode.prototype.toString = function() {
      return this.id+": DelayNode("+
        this.delayTime.toFixed(2)+")";
    };
    
    DelayNode.random = function() {
      return new DelayNode({
        delayTime: Utils.randomIn(0.0, 3.0)
      });
    };
    
    __exports__["default"] = DelayNode;
  });
define("asNEAT/nodes/feedbackDelayNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "FeedbackDelayNode";
    
    var FeedbackDelayNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    FeedbackDelayNode.prototype = Object.create(Node.prototype);
    FeedbackDelayNode.prototype.name = name;
    FeedbackDelayNode.prototype.defaultParameters = {
      // in seconds
      delayTime: 0,
    
      // [0,1], although >=1 is allowed... not advised
      feedbackRatio: 0.2,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'delayTime',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.5, max: 0.5},
          randomMutationRange: {min: 0.0, max: 3.0}
        },{
          name: 'feedbackRatio',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.2, max: 0.2},
          // TODO: set global min?
          randomMutationRange: {min: 0, max: 0.6}
        }
      ]
    };
    
    FeedbackDelayNode.prototype.clone = function() {
      return new FeedbackDelayNode({
        id: this.id,
        delayTime: this.delayTime,
        feedbackRatio: this.feedbackRatio,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    FeedbackDelayNode.prototype.refresh = function() {
      var delayNode = context.createDelay();
      delayNode.delayTime.value = this.delayTime;
    
      // add an additional gain node for 'delay' feedback
      var gainNode = context.createGain();
      gainNode.gain.value = this.feedbackRatio;
    
    
      // TODO: Add a base passthrough? or just allow that to evolve?
      delayNode.connect(gainNode);
      gainNode.connect(delayNode);
    
      this.node = delayNode;
    };
    
    FeedbackDelayNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        delayTime: this.delayTime,
        feedbackRatio: this.feedbackRatio
      };
    };
    
    FeedbackDelayNode.prototype.toString = function() {
      return this.id+": FeedbackDelayNode("+
        this.delayTime.toFixed(2)+","+
        this.feedbackRatio.toFixed(2)+")";
    };
    
    FeedbackDelayNode.random = function() {
      return new FeedbackDelayNode({
        delayTime: Utils.randomIn(0.0, 3.0),
        feedbackRatio: Utils.randomIn(0, 0.6)
      });
    };
    
    __exports__["default"] = FeedbackDelayNode;
  });
define("asNEAT/nodes/filterNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "FilterNode",
        freqMin = 0,
        freqMax = 1500,
        qMin = 0.0001,
        qMax = 20,
        gainMin = -5,
        gainMax = 5;
    
    var FilterNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    FilterNode.prototype = Object.create(Node.prototype);
    FilterNode.prototype.name = name;
    FilterNode.prototype.defaultParameters = {
      type: 0,
      frequency: 500,
      detune: 0,
      q: 1,
      gain: 1,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'type',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0,
          randomMutationRange: {min: 0, max: 8},
          allowInverse: false,
          discreteMutation: true
        },{
          name: 'frequency',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -500, max: 500},
          // TODO: set global min?
          randomMutationRange: {min: 27.5, max: 1046.5}
        }
        // todo: other parameters
      ],
      connectableParameters: [
        {
          name: "frequency",
          amplitudeScaling: {min: freqMin, max: freqMax}
        },
        {
          name: "q",
          amplitudeScaling: {min: qMin, max: qMin}
        },
        {
          name: "gain",
          amplitudeScaling: {min: gainMin, max: gainMax}
        }
      ]
    };
    
    FilterNode.prototype.clone = function() {
      return new FilterNode({
        id: this.id,
        type: this.type,
        frequency: this.frequency,
        detune: this.detune,
        q: this.q,
        gain: this.gain,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    FilterNode.prototype.refresh = function() {
      var node = context.createBiquadFilter();
      node.type = this.type;
      node.frequency.value = this.frequency;
      node.detune.value = this.detune;
      node.Q.value = this.q;
      node.gain.value = this.gain;
    
      // cache the current node?
      this.node = node;
    };
    
    FilterNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        type: FilterNode.TYPES.nameFor(this.type),
        frequency: this.frequency,
        detune: this.detune,
        q: this.q,
        gain: this.gain,
      };
    };
    
    FilterNode.prototype.toString = function() {
      return this.id+": FilterNode("+this.type+","+this.frequency.toFixed(2)+")";
    };
    
    FilterNode.TYPES = [
      "lowpass",
      "highpass",
      "bandpass",
      "lowshelf",
      "highshelf",
      "peaking",
      "notch",
      "allpass"
    ];
    FilterNode.TYPES.nameFor = function(type) {
      if (typeof type ==="string") return type;
      return FilterNode.TYPES[type];
    };
    FilterNode.random = function() {
      var typeI = Utils.randomIndexIn(0,FilterNode.TYPES.length),
          // A0 to C8
          freq = Utils.randomIn(freqMin, freqMax),
          q = Utils.randomIn(qMin, qMax),
          gain = Utils.randomIn(gainMin, gainMax);
    
      // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
      // Q - 1, with a nominal range of 0.0001 to 1000.
      // gain - 0, with a nominal range of -40 to 40.
    
      return new FilterNode({
        type: FilterNode.TYPES[typeI],
        frequency: freq,
        // TODO: specefic ranges based on type
        q: q,
        gain: gain
        //detune: 0,
      });
    };
    
    __exports__["default"] = FilterNode;
  });
define("asNEAT/nodes/gainNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "GainNode",
        gainMin = 0.5,
        gainMax = 1.5;
    
    var GainNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    GainNode.prototype = Object.create(Node.prototype);
    GainNode.prototype.name = name;
    GainNode.prototype.defaultParameters = {
      // Represents the amount of gain to apply. Its default value is 1
      // (no gain change). The nominal minValue is 0, but may be set
      // negative for phase inversion. The nominal maxValue is 1, but
      // higher values are allowed (no exception thrown).This parameter
      // is a-rate
      gain: 1,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'gain',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -0.2, max: 0.2},
          // TODO: set global min?
          randomMutationRange: {min: -1, max: 1}
        }
      ],
      connectableParameters: [
        {
          name: "gain",
          amplitudeScaling: {min: -1*gainMax, max: gainMax}
        }
      ]
    };
    
    GainNode.prototype.clone = function() {
      return new GainNode({
        id: this.id,
        gain: this.gain,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    
    // Refreshes the cached node to be played again
    GainNode.prototype.refresh = function() {
      var node = context.createGain();
      node.gain.value = this.gain;
      this.node = node;
    };
    
    GainNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        gain: this.gain
      };
    };
    
    GainNode.prototype.toString = function() {
      return this.id+": GainNode("+
        this.gain.toFixed(2)+")";
    };
    
    /*
      @return a GainNode with a gain of [0.5, 1.5) || (-1.5, -5.1]
    */
    GainNode.random = function() {
      var isInverse = Utils.randomBool(),
          gain = Utils.randomIn(gainMin, gainMax);
      gain*= (isInverse? -1 : 1);
    
      return new GainNode({
        gain: gain
      });
    };
    
    __exports__["default"] = GainNode;
  });
define("asNEAT/nodes/node", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        name = "Node";
    
    var Node = function(parameters) {
      Utils.extend(this, this.defaultParameters, parameters);
    
      this.hasChanged = false;
    
      // Only generate a new id if one isn't given in the parameters
      if (parameters && typeof parameters.id !== 'undefined')
        this.id = parameters.id;
      else
        this.id = Node.getNextId();
    };
    
    Node.prototype.name = name;
    Node.prototype.defaultParameters = {
      parameterMutationChance: 0.1,
      mutatableParameters: [
      //  { see Utils.mutateParameter documentation
      //    name,
      //    mutationDeltaChance: chance for mutating by delta or by ranomd change,
      //    mutationDelta: range that the parameter can be shifter by,
      //    randomMutationRange: range parameter can be randomly changed to,
      //    discreteMutation: if mutations should be integers
      //  }
      ],
    
      connectableParameters: [
        //{
        //  name: "frequency", : must be able to osc.connect(node.name)
        //  amplitudeScaling: {min: -2000, max: 2000} : range of allowed amplitude
        //  modulating the parameter
        //  // TODO: Handle snapping to carrier frequency multiple?
        //  // http://greweb.me/2013/08/FM-audio-api/
        //}
      ]
    }; 
    
    /**
      Creates a cloned node
      @return Node
    */
    Node.prototype.clone = function() {
      throw "clone not implemented";
    };
    
    /**
      Refreshes any web audio context nodes
    */
    Node.prototype.refresh = function() {
      throw "refresh not implemented";
    };
    
    /**
      Gets the various parameters characterizing this node
    */
    Node.prototype.getParameters = function() {
      throw "getParameters not implemented";
    };
    
    Node.prototype.toString = function() {
      throw "toString not implemented";
    };
    
    /**
      Mutates at least one parameter
      @return this Node
    */
    Node.prototype.mutate = function() {
      var self = this,
          chance = this.parameterMutationChance,
          parameters = this.mutatableParameters,
          mutated = false;
    
      if (!parameters || parameters.length===0) {
        Utils.log('no mutation parameters');
        return this;
      }
      _.forEach(this.mutatableParameters, function(param) {
        if (!Utils.randomChance(chance))
          return true;
        mutate(param);
        mutated = true;
      });
    
      if (!mutated) {
        var param = Utils.randomElementIn(parameters);
        mutate(param);
      }
    
      return this;
    
      function mutate(param) {
        Utils.mutateParameter({
          obj: self,
          parameter: param.name,
          mutationDeltaChance: param.mutationDeltaChance,
          mutationDelta: param.mutationDelta,
          randomMutationRange: param.randomMutationRange,
          allowInverse: param.allowInverse,
          discreteMutation: param.discreteMutation
        }, this);
      }
    };
    
    Node.id=0;
    Node.getNextId = function() {
      return Node.id++;
    };
    
    /**
      Creates a random node
      @return Node
      */
    Node.random = function() {
      throw "static random not implemented";
    };
    
    __exports__["default"] = Node;
  });
define("asNEAT/nodes/noteOscillatorNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "NoteOscillatorNode";
    /**
      An OscillatorNode that clamps its frequency to an
      equal tempered scale
    */
    var NoteOscillatorNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    NoteOscillatorNode.prototype = Object.create(Node.prototype);
    NoteOscillatorNode.prototype.name = name;
    NoteOscillatorNode.prototype.defaultParameters = {
      name: name,
    
      type: 0,
    
      // Offset from root (currently A4=440) to play
      // @note This parameter isn't evolved but is useful when
      // playing a set note from either an onscreen or MIDI keyboard
      stepFromRootNote: 0,
      
      // offset from note determined by root_stepFromRootNote
      noteOffset: 0,
      
      detune: 0,
      
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'type',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0,
          randomMutationRange: {min: 0, max: 4},
          allowInverse: false,
          discreteMutation: true
        },{
          name: 'noteOffset',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: -20, max: 20},
          discreteMutation: true
        }
        // todo: detune?
      ],
      connectableParameters: [
        {
          name: "frequency",
          amplitudeScaling: {min: -2000, max: 2000}
        }
      ]
    };
    
    NoteOscillatorNode.prototype.clone = function() {
      return new NoteOscillatorNode({
        id: this.id,
        type: this.type,
        noteOffset: this.noteOffset,
        detune: this.detune,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    NoteOscillatorNode.prototype.refresh = function() {
      var node = context.createOscillator();
      node.type = this.type;
      node.frequency.value = Utils.frequencyOfStepsFromRootNote(
          this.stepFromRootNote + this.noteOffset);
      // cache the current node?
      this.node = node;
    };
    NoteOscillatorNode.prototype.play = function() {
      var node = this.node;
      node.start(0);
      setTimeout(function() {
        node.stop(0);
      }, 500);
    };
    
    /**
      Plays a note until the return handler is called
      @return function stop
    **/
    NoteOscillatorNode.prototype.playHold = function() {
      var node = this.node;
      node.start(0);
      return function stop() {
        node.stop(0);
      };
    };
    
    NoteOscillatorNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        type: OscillatorNode.TYPES.nameFor(this.type),
        noteOffset: this.noteOffset,
        //note: Utils.noteForFrequency(
        //        Utils.frequencyOfStepsFromRootNote(
        //          this.noteOffset)),
        detune: this.detune,
      };
    };
    
    NoteOscillatorNode.prototype.toString = function() {
      return this.id+": NoteOscillatorNode("+this.type+","+this.noteOffset+")";
    };
    
    NoteOscillatorNode.random = function() {
      var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
          noteOffset = Utils.randomIndexIn(-20, 20);
    
      // noteOffset - # of steps from the root note (default A4=440hz) on a tempered scale.
      // Q - 1, with a nominal range of 0.0001 to 1000.
      // gain - 0, with a nominal range of -40 to 40.
    
      return new NoteOscillatorNode({
        type: OscillatorNode.TYPES[typeI],
        noteOffset: noteOffset
        //detune: 0
      });
    };
    
    __exports__["default"] = NoteOscillatorNode;
  });
define("asNEAT/nodes/oscillatorNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "OscillatorNode",
        A0 = 27.5,
        C6 = 1046.5,
        C8 = 4186.0;
    
    var OscillatorNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    OscillatorNode.prototype = Object.create(Node.prototype);
    OscillatorNode.prototype.name = name;
    
    OscillatorNode.prototype.defaultParameters = {
      type: 0,
      frequency: 1000,
      detune: 0,
      
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'type',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0,
          randomMutationRange: {min: 0, max: 4},
          allowInverse: false,
          discreteMutation: true
        },{
          name: 'frequency',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -500, max: 500},
          // TODO: set global min?
          randomMutationRange: {min: A0, max: C6}
        }
        // todo: detune?
      ],
      connectableParameters: [
        {
          name: "frequency",
          amplitudeScaling: {min: -2000, max: 2000}
        }
      ]
    };
    
    OscillatorNode.prototype.clone = function() {
      return new OscillatorNode({
        id: this.id,
        type: this.type,
        frequency: this.frequency,
        detune: this.detune,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
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
    };
    
    /**
      Plays a note until the return handler is called
      @return function stop
    **/
    OscillatorNode.prototype.playHold = function() {
      var node = this.node;
      node.start(0);
      return function stop() {
        node.stop(0);
      };
    };
    
    OscillatorNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        type: OscillatorNode.TYPES.nameFor(this.type),
        frequency: this.frequency,
        detune: this.detune
      };
    };
    
    OscillatorNode.prototype.toString = function() {
      return this.id+": OscillatorNode("+this.type+","+this.frequency.toFixed(2)+")";
    };
    
    
    OscillatorNode.TYPES = [
      "sine",
      "square",
      "sawtooth",
      "triangle"
      //"custom"
    ];
    OscillatorNode.TYPES.nameFor = function(type) {
      if (typeof type ==="string") return type;
      return OscillatorNode.TYPES[type];
    };
    OscillatorNode.random = function() {
      var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
          freq = Utils.randomIn(A0, C6);
    
      // From w3 spec
      // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
      // Q - 1, with a nominal range of 0.0001 to 1000.
      // gain - 0, with a nominal range of -40 to 40.
    
      return new OscillatorNode({
        type: OscillatorNode.TYPES[typeI],
        frequency: freq
        //detune: 0
      });
    };
    
    __exports__["default"] = OscillatorNode;
  });
define("asNEAT/nodes/outNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Node = require('asNEAT/nodes/node')['default'],
        asNEAT = require('asNEAT/asNEAT')['default'],
        name = "OutNode";
    
    var OutNode = function(parameters) {
      Node.call(this, parameters);
      this.node = asNEAT.globalGain;
    };
    
    OutNode.prototype = Object.create(Node.prototype);
    OutNode.prototype.name = name;
    OutNode.prototype.defaultParameters = {};
    OutNode.prototype.clone = function() {
      return new OutNode({
        id: this.id
      });
    };
    OutNode.prototype.refresh = function() {
    };
    OutNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id
      };
    };
    OutNode.prototype.toString = function() {
      return this.id+": OutNode";
    };
    
    __exports__["default"] = OutNode;
  });
define("asNEAT/nodes/pannerNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        name = "PannerNode";
    
    var PannerNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    PannerNode.prototype = Object.create(Node.prototype);
    PannerNode.prototype.name = name;
    PannerNode.prototype.defaultParameters = {
      // position
      x: 0,
      y: 0,
      z: 0,
    
      parameterMutationChance: 0.1,
      mutatableParameters: [
        {
          name: 'x',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: -5, max: 5}
        },{
          name: 'y',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: -5, max: 5}
        },{
          name: 'z',
          // doesn't make sense to change type by a delta
          mutationDeltaChance: 0.8,
          mutationDelta: {min: -5, max: 5},
          // TODO: set global min?
          randomMutationRange: {min: -5, max: 5}
        }
      ]
    };
    
    PannerNode.prototype.clone = function() {
      return new PannerNode({
        id: this.id,
        x: this.x,
        y: this.y,
        z: this.z,
        parameterMutationChance: this.parameterMutationChance,
        mutatableParameters: _.cloneDeep(this.mutatableParameters)
      });
    };
    
    // Refreshes the cached node to be played again
    PannerNode.prototype.refresh = function() {
      var node = context.createPanner();
      node.setPosition(this.x, this.y, this.z);
      //node.setVelocity
      //node.setOrientation
      //other parameters: distance model, sound cone, &c...
    
      // cache the current node?
      this.node = node;
    };
    
    PannerNode.prototype.getParameters = function() {
      return {
        name: name,
        id: this.id,
        x: this.x.toFixed(2),
        y: this.y.toFixed(2),
        z: this.z.toFixed(2)
      };
    };
    
    PannerNode.prototype.toString = function() {
      return this.id+": PannerNode("+this.x.toFixed(2)+
        ", "+this.y.toFixed(2)+", "+this.z.toFixed(2)+")";
    };
    
    PannerNode.random = function() {
      var x = Utils.randomIn(-5.0, 5.0),
          y = Utils.randomIn(-5.0, 5.0),
          z = Utils.randomIn(-5.0, 5.0);
    
      return new PannerNode({
        x:x,
        y:y,
        z:z
      });
    };
    
    __exports__["default"] = PannerNode;
  });
define("asNEAT/population", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Network = require('asNEAT/network')['default'],
        log = Utils.log,
        name = "Population";
    
    /**
      A collection of instruments
    */
    var Population = function(parameters) {
      Utils.extend(this, this.defaultParameters, parameters);
    };
    
    Population.prototype.name = name;
    Population.prototype.defaultParameters = {
      networks: [],
      populationCount: 9,
      crossoverRate: 0.3,
      mutationRate: 1.0
    };
    
    /*
      Creates a deep clone of this Population
     */
    Population.prototype.clone = function() {
      var clonedNetworks = [];
      _.forEach(this.networks, function(network){
        clonedNetworks.push(network.clone());
      });
      return new Population({
        networks: clonedNetworks,
        populationCount: this.populationCount,
        crossoverRate: this.crossoverRate,
        mutationRate: this.mutationRate
      });
    };
    
    Population.prototype.toString = function() {
      var str = "Networks["+this.networks.length+"]:<br>";
      str+= "crossoverRate: "+this.crossoverRate+"<br>";
      str+= "mutationRate: "+this.mutationRate+"<br>";
      return str;
    };
    
    /**
      @param parents an array of networks
      @param params defaultParameters for the population
      @return Population
    */
    Population.generateFromParents = function(parents, params) {
      var newPopulation = new Population(params),
          x, y, isCrossed, tempLastMutation;
      while(newPopulation.networks.length < newPopulation.populationCount) {
        isCrossed = false;
    
        x = Utils.randomElementIn(parents);
        if (parents.length >= 2 &&
            Utils.randomChance(newPopulation.crossoverRate))
        {
          y = Utils.randomElementIn(parents, x);
          x = x.crossWith(y);
          isCrossed = true;
        }
        
        if (Utils.randomChance(newPopulation.mutationRate)) {
          if (isCrossed)
            tempLastMutation = x.lastMutation;
    
          x = x.clone().mutate();
    
          if (isCrossed) {
            x.lastMutation.objectsChanged = tempLastMutation.objectsChanged.concat(
              x.lastMutation.objectsChanged);
            x.lastMutation.changeDescription = tempLastMutation.changeDescription+" & "+
              x.lastMutation.changeDescription;
          }
        }
    
        newPopulation.networks.push(x);
      }
      return newPopulation;
    };
    
    __exports__["default"] = Population;
  });
define("asNEAT/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = {};
    
    Utils.IS_DEBUG = true;
    
    Utils.log = function(msg) {
      if (!Utils.IS_DEBUG) return;
      
      console.log(msg);
      if (typeof $ !== "undefined")
        $('.log').prepend('<div>'+msg+'</div>');
    };
    
    Utils.error = function(msg) {
      throw msg;
    };
    
    Utils.random = function() {
      return Math.random();
    };
    
    /*
      @params (min, max) or ({min, max})
    */
    Utils.randomIn = function(min, max) {
      if (_.isObject(min)) {
        max = min.max;
        min = min.min;
      }
      return Math.random()*(max-min) + min;
    };
    
    /*
      @params (min, max) or ({min, max})
      @param min
      @param max up to but not including (aka, an array's length for finding
                 an index)
     */
    Utils.randomIndexIn = function(min, max) {
      if (_.isObject(min)) {
        max = min.max;
        min = min.min;
      }
      return Math.floor(Utils.randomIn(min, max));
    };
    
    /*
      @param chance {number} [0,1]
      @return If a random number was generated less than the chance
    */
    Utils.randomChance = function(chance) {
      return Utils.random() <= chance;
    };
    
    Utils.randomBool = function() {
      return !!Math.round(Math.random());
    };
    
    /** 
      @param xs {array} [x1, x2,...]
      @param notX An element in xs to not select
      @return A random element in xs, undefined if xs is empty
    */
    Utils.randomElementIn = function(xs, notX) {
      if (xs.length===0) return;
      if (notX)
        return Utils.randomElementIn(_.reject(xs, notX));
    
      var index = Utils.randomIndexIn(0, xs.length);
      return xs[index];
    };
    
    /**
     * Clamps the given number to the min or max
     * @param x 
     * @param min
     * @param max
     * @return A number in [min, max]
     **/
    Utils.clamp = function(x, min, max) {
      if (x > max)
        return max;
      if (x < min)
        return min;
      return x;
    };
    
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    Utils.shuffle = function(v) {
      for(var j, x, i = v.length; 
        i;
        j = parseInt(Math.random() * i),
          x = v[--i],
          v[i] = v[j],
          v[j] = x);
      return v;
    };
    
    /*
      @param xs [{weight, element},...] with sum(weights)===1.0
    */
    Utils.weightedSelection = function(xs) {
      var r = Math.random(),
          sum = 0, element;
      _.forEach(xs, function(x) {
        sum+=x.weight;
        if (r <= sum) {
          element = x.element;
          return false;
        }
      });
      return element;
    };
    
    /*
      Mutates the given
      @param params
      @return {mutatedParameter, changeDescription}
     */
    Utils.mutateParameter = function(params, target) {
      var delta, range, newParam;
    
      _.defaults(params, {
        obj: null,
        parameter: 'param',
        
        // Chance of mutating only by an amount in mutation delta
        // (ie. weight+=mutationDelta), otherwise (weight=mutationRange)
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -0.2, max: 0.2},
    
        mutateDelta: function() {
          if (params.discreteMutation)
            delta = Utils.randomIndexIn(params.mutationDelta);
          else
            delta = Utils.randomIn(params.mutationDelta);
          Utils.log('mutating by delta '+delta.toFixed(3));
          params.obj[params.parameter]+=delta;
    
          return {
            mutatedParameter: params.parameter,
            changeDescription: "by delta "+delta.toFixed(3)
          };
        },
    
        // note: the inverse is also possible (ex (-max, -min]) when
        // allowInverse is true
        randomMutationRange: {min: 0.1, max: 1.5},
    
        mutateRandom: function() {
          range = params.randomMutationRange;
          if (params.discreteMutation)
            newParam = Utils.randomIndexIn(range);
          else
            newParam = Utils.randomIn(range);
    
          // 50% chance of negative
          if (params.allowInverse && Utils.randomBool())
            newParam*=-1;
    
          Utils.log('mutating with new param '+newParam);
          params.obj[params.parameter] = newParam;
          return {
            mutatedParameter: params.parameter,
            changeDescription: "to "+newParam
          };
        },
    
        allowInverse: true,
        // true if only integers are allowed (ie for an index), otherwise
        // uses floating point
        discreteMutation: false
      });
    
      Utils.log('mutating('+params.parameter+') '+params.obj);
    
      
    
      // Only change the weight by a given delta
      if (Utils.randomChance(params.mutationDeltaChance))
        return params.mutateDelta.call(target);
      // Use a new random weight in range
      else
        return params.mutateRandom.call(target);
    };
    
    /*
      Generates a reversible unique number from two numbers
    */
    Utils.cantorPair = function(x, y) {
      return ((x+y)*(x+y+1)) / 2 + y;
    };
    Utils.reverseCantorPair = function(z) {
      var t = Math.floor((-1 + Math.sqrt(1+8*z))/2);
      var x = t*(t+3)/2 - z;
      var y = z - t*(t+1)/2;
      return {x:x, y:y};
    };
    
    /**
      extend function that clones the default parameters
      @param arguments
    */
    Utils.extend = function(self, defaultParameters, parameters) {
      // deep clone the defaultParameters so [] and {} aren't referenced by
      // multiple objects
      _.assign(self, _.cloneDeep(defaultParameters), parameters);
    };
    
    Utils.roundTo2Places = function(num) {
      return +(Math.round(num + "e+2")  + "e-2");
    };
    
    var TWELTH_ROOT = Math.pow(2,1/12);
    var A4 = 440;
    var DISTANCE_FROM_A = {
      c:-9, d:-7, e:-5, f:-4, g:-2, a:0, b:2
    };
    /**
      Gets the frequency based on an equal tempered scale
      with A4 = 440
      @param note (ex: 'c4', 'c4#', 'C4b')
    */
    Utils.frequencyForNote = function(note) {
      var steps = Utils.stepsFromRootNote(note);
      return Utils.frequencyOfStepsFromRootNote(steps);
    };
    
    Utils.stepsFromRootNote = function(note) {
      note = note.toLowerCase().split('');
      var letter = note[0],
          octave = parseInt(note[1], 10),
          modifier = note[2],
          steps = DISTANCE_FROM_A[letter];
      if (modifier==='#')
        ++steps;
      else if (modifier==='b')
        --steps;
    
      steps+= 12 * (octave-4);
      return steps;
    };
    
    Utils.noteForFrequency = function() {
      // TODO: reverse frequencyForNote
      // TODO: Tests for frequencyForNote(noteForFrequency(x))===x
    };
    
    Utils.frequencyOfStepsFromRootNote = function(steps) {
      return A4 * Math.pow(TWELTH_ROOT, steps);
    };
    
    __exports__["default"] = Utils;
  });