
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  ns.context = new AudioContext();

  // All the registered usable nodes
  ns.nodes = [
    // TODO: Should oscillator be somewhere else?
    //'OscillatorNode',
    'FilterNode',

    //delay
    //panner node
    //convolver
    //dynamics compressor
    //wave shaper node?
  ];

})(this);