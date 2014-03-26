
var ns = {};

window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  function() {this.supported = false;};
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

export default ns;