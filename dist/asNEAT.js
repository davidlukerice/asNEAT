/* asNEAT 0.4.0 2014-03-17 */
define("asNEAT/asNEAT", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var ns = {};
    
    window.AudioContext = window.AudioContext ||
      window.webkitAudioContext;
    ns.context = new window.AudioContext();
    
    // All the registered usable nodes
    // TODO: Give weights for selection in mutation?
    ns.nodeTypes = [
      'gainNode',
      'filterNode',
      'delayNode',
      
      //'pannerNode' // Implemented, but doesn't do much without other mutations
      
      'compressorNode'
    
      //convolver // Not worth it atm
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
        context = require('asNEAT/asNEAT')['default'].context;
    
    // TODO: Different kinds of connections?
    var Connection = function(parameters) {
      _.defaults(this, parameters, this.defaultParameters);
      this.gainNode = null;
      this.id = Utils.cantorPair(this.inNode.id, this.outNode.id);
    };
    
    Connection.prototype.defaultParameters = {
      inNode: null,
      outNode: null,
      weight: 1.0,
      enabled: true,
    
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.2, max: 0.2},
      randomMutationRange: {min: 0.1, max: 1.5},
      discreteMutation: false
    };
    Connection.prototype.connect = function() {
      if (!this.enabled) return;
    
      // The gainNode is what carries the connection's 
      // weight attribute
      this.gainNode = context.createGain();
      this.gainNode.gain.value = this.weight;
      this.inNode.node.connect(this.gainNode);
      this.gainNode.connect(this.outNode.node);
    };
    
    Connection.prototype.disable = function() {
      this.enabled = false;
    };
    
    Connection.prototype.mutate = function() {
      Utils.mutateParameter({
        obj: this,
        parameter: 'weight',
        mutationDeltaChance: this.mutationDeltaChance,
        mutationDelta: this.mutationDelta,
        randomMutationRange: this.randomMutationRange
      });
    };
    
    Connection.prototype.toString = function() {
      return (this.enabled? "" : "*") +
              "connection("+this.weight.toFixed(2)+")("+
              this.inNode.id+" --> "+this.outNode.id+")";
    };
    
    __exports__["default"] = Connection;
  });
define("asNEAT/network", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
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
    
    __exports__["default"] = Network;
  });
define("asNEAT/nodes/compressorNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context;
    
    var CompressorNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    CompressorNode.prototype = new Node();
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
define("asNEAT/nodes/delayNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context;
    
    var DelayNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    DelayNode.prototype = new Node();
    DelayNode.prototype.defaultParameters = {
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
    // Refreshes the cached node to be played again
    DelayNode.prototype.refresh = function() {
      var delayNode = context.createDelay();
      delayNode.delayTime = this.delayTime;
    
      // add an additional gain node for 'delay' feedback
      var gainNode = context.createGain();
      gainNode.gain.value = this.feedbackRatio;
    
      delayNode.connect(gainNode);
      gainNode.connect(delayNode);
    
      this.node = delayNode;
    };
    
    DelayNode.prototype.toString = function() {
      return this.id+": DelayNode("+
        this.delayTime.toFixed(2)+","+
        this.feedbackRatio.toFixed(2)+")";
    };
    
    DelayNode.random = function() {
      return new DelayNode({
        delayTime: Utils.randomIn(0.0, 3.0),
        feedbackRatio: Utils.randomIn(0, 0.6)
      });
    };
    
    __exports__["default"] = DelayNode;
  });
define("asNEAT/nodes/filterNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context;
    
    var FilterNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    FilterNode.prototype = new Node();
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
      ]
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
    FilterNode.random = function() {
      var typeI = Utils.randomIndexIn(0,FilterNode.TYPES.length),
          // A0 to C8
          freq = Utils.randomIn(27.5, 1046.5);
    
      // frequency - 350Hz, with a nominal range of 10 to the Nyquist frequency (half the sample-rate).
      // Q - 1, with a nominal range of 0.0001 to 1000.
      // gain - 0, with a nominal range of -40 to 40.
    
      return new FilterNode({
        type: FilterNode.TYPES[typeI],
        frequency: freq,
        // TODO: specefic ranges based on type
        //detune: 0,
        //q: 1,
        //gain: 1
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
        context = require('asNEAT/asNEAT')['default'].context;
    
    var GainNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    GainNode.prototype = new Node();
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
      ]
    };
    // Refreshes the cached node to be played again
    GainNode.prototype.refresh = function() {
      var node = context.createGain();
      node.gain.value = this.gain;
      this.node = node;
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
          gain = Utils.randomIn(0.5, 1.5);
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
    
    var Utils = require('asNEAT/utils')['default'];
    
    var Node = function(parameters) {
      _.defaults(this, parameters, this.defaultParameters);
      this.id = Node.getNextId();
    };
    
    Node.prototype.defaultParameters = {
      //parameterMutationChance: 0.1,
      //mutatableParameters: [
      //  { see Utils.mutateParameter documentation
      //    name,
      //    mutationDeltaChance,
      //    mutationDelta,
      //    randomMutationRange,
      //    discreteMutation
      //  }
      //]
    }; 
    
    // Refreshes any web audio context nodes
    Node.prototype.refresh = function() {};
    
    Node.prototype.toString = function() {
      return "Node";
    };
    
    /**
      Mutates at least one parameter
    */
    Node.prototype.mutate = function() {
      var self = this,
          chance = this.parameterMutationChance,
          parameters = this.mutatableParameters,
          mutated = false;
    
      if (!parameters || parameters.length===0) return;
    
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
    
      function mutate(param) {
        Utils.mutateParameter({
          obj: self,
          parameter: param.name,
          mutationDeltaChance: param.mutationDeltaChance,
          mutationDelta: param.mutationDelta,
          randomMutationRange: param.randomMutationRange,
          discreteMutation: param.discreteMutation
        });
      }
    };
    
    Node.id=0;
    Node.getNextId = function() {
      return Node.id++;
    };
    
    // Creates a random node
    Node.random = function() {return null;};
    
    __exports__["default"] = Node;
  });
define("asNEAT/nodes/oscillatorNode", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = require('asNEAT/utils')['default'],
        Node = require('asNEAT/nodes/node')['default'],
        context = require('asNEAT/asNEAT')['default'].context,
        A0 = 27.5,
        C6 = 1046.5,
        C8 = 4186.0;
    
    var OscillatorNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    OscillatorNode.prototype = new Node();
    
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
      ]
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
    OscillatorNode.random = function() {
      var typeI = Utils.randomIndexIn(0,OscillatorNode.TYPES.length),
          freq = Utils.randomIn(A0, C6);
      // todo: only allow standard notes?
    
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
        context = require('asNEAT/asNEAT')['default'].context;
    
    var OutNode = function() {
      Node.call(this);
      this.node = context.destination;
    };
    
    OutNode.prototype = new Node();
    OutNode.prototype.refresh = function() {
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
        context = require('asNEAT/asNEAT')['default'].context;
    
    var PannerNode = function(parameters) {
      Node.call(this, parameters);
    };
    
    PannerNode.prototype = new Node();
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
define("asNEAT/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var Utils = {};
    
    Utils.IS_DEBUG = true;
    
    Utils.log = function(msg) {
      if (!Utils.IS_DEBUG) return;
      
      console.log(msg);
      if ($)
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
      @return A random element in xs, undefined if xs is empty
    */
    Utils.randomElementIn = function(xs) {
      if (xs.length===0) return;
    
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
     */
    Utils.mutateParameter = function(params) {
      _.defaults(params, {
        obj: null,
        parameter: 'param',
        
        // Chance of mutating only by an amount in mutation delta
        // (ie. weight+=mutationDelta), otherwise (weight=mutationRange)
        mutationDeltaChance: 0.8,
        mutationDelta: {min: -0.2, max: 0.2},
        // note: the inverse is also possible (ex (-max, -min])
        randomMutationRange: {min: 0.1, max: 1.5},
        // true if only integers are allowed (ie for an index), otherwise
        // uses floating point
        discreteMutation: false
      });
    
      Utils.log('mutating('+params.parameter+') '+params.obj);
    
      var delta, range, newParam;
    
      // Only change the weight by a given delta
      if (Utils.randomChance(params.mutationDeltaChance)) {
        if (params.discreteMutation)
          delta = Utils.randomIndexIn(params.mutationDelta);
        else
          delta = Utils.randomIn(params.mutationDelta);
        Utils.log('mutating by delta '+delta.toFixed(3));
        params.obj[params.parameter]+=delta;
      }
      // Use a new random weight in range
      else {
        range = params.randomMutationRange;
        if (params.discreteMutation)
          newParam = Utils.randomIndexIn(range);
        else
          newParam = Utils.randomIn(range);
    
        // 50% chance of 
        if (Utils.randomBool())
          newParam*=-1;
    
        Utils.log('mutating with new param '+newParam);
        params.obj[params.parameter] = newParam;
      }
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
    
    __exports__["default"] = Utils;
  });