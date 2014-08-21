
var ns = {};

window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  function() {this.supported = false;};
ns.context = new window.AudioContext();
if (typeof ns.context.supported === 'undefined')
  ns.context.supported = true;

window.OfflineAudioContext = window.OfflineAudioContext ||
  window.webkitOfflineAudioContext ||
  function() {this.supported = false;};

// only create the gain if context is found
// (helps on tests)
if (ns.context.supported) {
  ns.globalGain = ns.context.createGain();
  ns.globalGain.gain.value = 0.5;
  ns.globalGain.connect(ns.context.destination);
}

// A list of all created outNodes, so they can all be reset
// from one place if needed (hard panic reset)
ns.OutNodes = [];
ns.resetOutNodes = function() {
  _.forEach(ns.OutNodes, function(outNode) {
    outNode.resetLocalGain();
  });
};
ns.resetOutNodes();

/**
  Get a new usable offlineContext since you can only
  render a single time for each one (aka, can't reuse)
*/
ns.createOfflineContextAndGain = function() {
  var offlineContext = new window.OfflineAudioContext(2, 10 * 44100, 44100),
      offlineGlobalGain;
  if (typeof offlineContext.supported === 'undefined')
    offlineContext.supported = true;

  if (offlineContext.supported) {
    offlineGlobalGain = offlineContext.createGain();
    offlineGlobalGain.gain.value = ns.globalGain.gain.value;
    offlineGlobalGain.connect(offlineContext.destination);
  }

  return {
    context: offlineContext,
    globalGain: offlineGlobalGain
  };
};

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

export default ns;
