
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
ns.offlineContext = new window.OfflineAudioContext();
if (typeof ns.offlineContext.supported === 'undefined')
  ns.offlineContext.supported = true;

// only create the gain if context is found
// (helps on tests)
if (ns.context.supported) {
  ns.globalGain = ns.context.createGain();
  ns.globalGain.gain.value = 0.5;
  ns.globalGain.connect(ns.context.destination);
}

if (ns.offlineContext.supported) {
  ns.offlineGlobalGain = ns.offlineContext.createGain();
  ns.offlineGlobalGain.gain.value = 0.5;
  ns.offlineGlobalGain.connect(ns.OfflineAudioContext.destination);
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

export default ns;