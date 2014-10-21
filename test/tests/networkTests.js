module("Network Tests");
var asNEAT = require('asNEAT/asNEAT')['default'],
    Connection = require('asNEAT/connection')['default'],
    CompressorNode = require('asNEAT/nodes/compressorNode')['default'],
    ConvolverNode = require('asNEAT/nodes/convolverNode')['default'],
    DelayNode = require('asNEAT/nodes/delayNode')['default'],
    FeedbackDelayNode = require('asNEAT/nodes/feedbackDelayNode')['default'],
    FilterNode = require('asNEAT/nodes/filterNode')['default'],
    GainNode = require('asNEAT/nodes/gainNode')['default'],
    NoteOscillatorNode = require('asNEAT/nodes/noteOscillatorNode')['default'],
    OscillatorNode = require('asNEAT/nodes/oscillatorNode')['default'],
    Network = require('asNEAT/network')['default'];

test('network', function() {
  var a = new Network();
  equal(a.connections.length, 1, "network starts with single connection");
});

test("Same default objects/arrays not referenced by multiple networks", function() {
  var a = new Network();
  var b = new Network();
  notEqual(a.nodes, b.nodes, "Nodes not the same");
});

test("crossWith", function() {
  var a,b,c,
      generation = 3;

  a = new Network();
  c = a.crossWith(a);
  ok(a.nodes.length === c.nodes.length,
    "crossing with itself contains same number of nodes");
  ok(a.connections.length === c.connections.length,
    "crossing with itself contains same number of connections");

  a = new Network();
  b = new Network({generation: generation});
  c = a.crossWith(b);
  equal(c.nodes.length, a.nodes.length+b.nodes.length-1,
    "Child has same number nodes as a+b, less the shared output node");
  equal(c.connections.length, a.connections.length+b.connections.length,
    "Child has same number connections");
  equal(c.generation, generation, "Child copies largest generation number");

  a = new Network();
  b = a.clone();
  a.splitMutation();
  b.addOscillator();
  c = a.crossWith(b);
  ok(c.nodes.length === (a.nodes.length+1) &&
     c.nodes.length === (b.nodes.length+1),
    "SplitMutation && addOscillator adds correct number nodes");
  ok(c.connections.length === (a.connections.length+1) &&
     c.connections.length === (b.connections.length+2),
    "SplitMutation && addOscillator adds correct number connections");
  ok(_.reduce(c.nodes, function(result, val){
    return result && (
      _.some(a.nodes, {'id': val.id}) ||
      _.some(b.nodes, {'id': val.id})
    );
  }, true), "C contains only nodes found in a and b");
  ok(_.reduce(c.connections, function(result, val){
    return result && (
      _.some(a.connections, {'id': val.id}) ||
      _.some(b.connections, {'id': val.id})
    );
  }, true), "C contains only connections found in a and b");

  equal(c.nodes.length, _.uniq(c.nodes, true, 'id').length,
    "C contains no duplicate nodes");
  equal(c.connections.length, _.uniq(c.connections, true, 'id').length,
    "C contains no duplicate connections");
});

test("split node", function() {
  var a = new Network(),
      connection = a.connections[0];

  a.splitMutation();
  equal(a.connections.length, 3, "connections increased (1_old+2_new)");
  ok(!connection.enabled, "old connection is disabled");
});

test("getNoteOscillatorNodes", function() {
  var a = new Network(),
      firstOscillator = a.nodes[1];

  equal(firstOscillator, a.getNoteOscillatorNodes()[0], "gets first oscillator");
  equal(a.getNoteOscillatorNodes().length, 1, "starts with one");

  a.addOscillator();
  equal(a.getNoteOscillatorNodes().length +a.getOscillatorNodes().length, 2,
    "addOscillator increases to 2");
  equal(a.getNoteOscillatorNodes().length +a.getOscillatorNodes().length,
    a.getOscillatorAndNoteOscillatorNodes().length,
    "getNoteOsc + getOsc === getOscAndNoteOsc");
});

test('mutate', function() {
  var a = new Network();
  a.mutate({
    splitMutationChance: 0.0,
    addOscillatorChance: 0.0,
    addConnectionChance: 0.0,
    mutateConnectionWeightsChance: 1.0,
    mutateNodeParametersChance: 0.0,
    mutationDistance: 0.1
  });
  ok(a.lastMutation.changeDescription === "Mutated connection gain", "Forces connection weight mutation");
});

test("mutations update lastMutation", function() {
  var a = new Network();
  equal(a.lastMutation, null, "starts null");
  testLastMutation(a.clone().splitMutation(), "splitMutation");
  testLastMutation(a.clone().addOscillator(), "addOscillator");
  testLastMutation(a.clone().addConnection(), "addConnection");
  testLastMutation(a.clone().mutateConnectionWeights(), "mutateConnectionWeights");
  testLastMutation(a.clone().mutateNodeParameters(), "mutateNodeParameters");

  function testLastMutation(net, msg) {
    ok(_.isArray(net.lastMutation.objectsChanged) &&
       _.isString(net.lastMutation.changeDescription), msg);
  }
});

test("createFromJSON", function() {
  var a = new Network();
  a.mutate().mutate().mutate().mutate();
  a.splitMutation();
  a.addOscillator();
  a.addConnection();
  var json = a.toJSON();
  var b = Network.createFromJSON(json);
  equal(a.nodes.length, b.nodes.length, "Preserves number of nodes");
  equal(a.connections.length, b.connections.length, "Preserves number of connections");

  var inOriginal = true;
  _.forEach(b.nodes, function(node) {
      inOriginal = inOriginal && _.find(a.nodes, {id:node.id});
  });
  ok(inOriginal, "every node found in original");

  inOriginal = true;
  _.forEach(b.connections, function(connection) {
      inOriginal = inOriginal && _.find(a.connections, {id:connection.id});
  });
  ok(inOriginal, "every connection found in original");

  // Manually test each node type
  var osc = NoteOscillatorNode.random();
  osc.noteOffset = 0;

  var compressorNode = CompressorNode.random(),
      convolverNode = ConvolverNode.random(),
      delayNode = DelayNode.random(),
      feedbackDelayNode = FeedbackDelayNode.random(),
      filterNode = FilterNode.random(),
      gainNode = GainNode.random(),
      oscillatorNode = OscillatorNode.random(),
      osc2 = NoteOscillatorNode.random();
  osc2.noteOffset = 2;
  var nodes = [
    asNEAT.globalOutNode,
    osc,
    compressorNode,
    convolverNode,
    delayNode,
    feedbackDelayNode,
    filterNode,
    gainNode,
    oscillatorNode,
    osc2
  ];
  var connections = [
    new Connection({ sourceNode: nodes[1], targetNode: nodes[0], weight: 0.5, enabled: false}),
    new Connection({ sourceNode: nodes[1], targetNode: nodes[2], weight: 0.1}),
    new Connection({ sourceNode: nodes[2], targetNode: nodes[3], weight: 1.0}),
    new Connection({ sourceNode: nodes[4], targetNode: nodes[5], weight: 1.0}),
    new Connection({ sourceNode: nodes[5], targetNode: nodes[6], weight: 1.0}),
    new Connection({ sourceNode: nodes[6], targetNode: nodes[7], weight: 1.0}),
    new Connection({ sourceNode: nodes[7], targetNode: nodes[0], weight: 1.0}),
    new Connection({ sourceNode: nodes[8], targetNode: nodes[1], weight: 1.0,
      targetParameter: 'frequency', targetParameterNodeName: 'oscNode'}),
    new Connection({ sourceNode: nodes[9], targetNode: nodes[0], weight: 1.0}),
  ];
  a = new Network({
    nodes: nodes,
    connections: connections
  });
  b = Network.createFromJSON(a.toJSON());
  // Compare nodes
  (function compare(a, b, i) {
    if (i===0) {
      return;
    }
    _.forEach(a, function(value, key) {
      if (typeof value === 'object') {
        compare(a[key], b[key], i-1);
        return;
      }
      equal(a[key], b[key], 'matching '+key+' = '+value);
    });
  })(a,b,3);
});

test('evolutionHistory', function() {
  var a = new Network();
  equal(a.evolutionHistory.length, 0, 'Instrument starts with no history');
  a.splitMutation();
  equal(a.evolutionHistory.length, 1, 'History increases by one');
  equal(a.evolutionHistory[a.evolutionHistory.length-1], 'sm', 'splitMutation logs correctly');
  a.addOscillator();
  equal(a.evolutionHistory[a.evolutionHistory.length-1], 'ao', 'addOscillator logs correctly');
  a.addConnection();
  equal(a.evolutionHistory[a.evolutionHistory.length-1], 'ac', 'addConnection logs correctly');
  a.mutateConnectionWeights();
  equal(a.evolutionHistory[a.evolutionHistory.length-1], 'mcw', 'mutateConnectionWeights logs correctly');
  a.mutateNodeParameters();
  equal(a.evolutionHistory[a.evolutionHistory.length-1], 'mnp', 'mutateNodeParameters logs correctly');

  var b = new Network();
  equal(b.evolutionHistory.length, 0, 'New instruments don\'t copy old history');
  b.splitMutation();
  b.splitMutation();
  var c = a.crossWith(b);
  equal(c.evolutionHistory[c.evolutionHistory.length-1], 'co', 'crossover logs correctly');
  equal(c.evolutionHistory.length, 8, 'crossover combines history');

  equal(c.clone().evolutionHistory.length, 8, 'clone preserves history');

  equal(Network.createFromJSON(c.toJSON()).evolutionHistory.length, 8, 'JSON preserves history');
});
