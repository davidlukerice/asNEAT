
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  ns.context = new AudioContext();

  // All the registered usable nodes
  // TODO: Give weights for selection in mutation?
  ns.nodes = [
    'GainNode',
    'FilterNode',
    'DelayNode',
    
    //'PannerNode' // Implemented, but doesn't do much without other mutations
    
    'CompressorNode'

    //convolver // Not worth it atm
    //wave shaper node?
  ];

})(this);