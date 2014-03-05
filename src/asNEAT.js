
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  ns.context = new AudioContext();

  // All the registered usable nodes
  // TODO: Give weights for selection in mutation?
  ns.nodes = [
    // TODO: Should oscillator be somewhere else?
    //'OscillatorNode',
    'FilterNode',
    'DelayNode',
    
    //'PannerNode'
    
    //convolver
    //dynamics compressor
    //wave shaper node?
  ];

})(this);