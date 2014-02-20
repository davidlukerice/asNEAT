
this['asNEAT'] = this['asNEAT'] || {};

!function(global) {
  "use strict";

  var baseNS = 'asNEAT',
    ns = global[baseNS];

  window.AudioContext = window.AudioContext ||
    window.webkitAudioContext;
  var context = new AudioContext();

  var Node = function() {

  };

  // simple function to play a sound
  Node.prototype.play = function() {
    var osc = context.createOscillator();
    osc.type = 0;
    osc.frequency.value = 1000;
    osc.connect(context.destination);
    osc.start(0);
    setTimeout(function() {
      osc.stop(0);
    }, 500);
  }

  ns.Node = Node;
;

}(this);