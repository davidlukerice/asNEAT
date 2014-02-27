
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  ns.context = new AudioContext();

})(this);