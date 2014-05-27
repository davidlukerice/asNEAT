
var ns = {};

window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  function() {this.supported = false;};
ns.context = new window.AudioContext();

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
  
  'compressorNode'

  //convolver // Not worth it atm
  //wave shaper node? // like distortion? eq?
];

export default ns;