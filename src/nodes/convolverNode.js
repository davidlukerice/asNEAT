
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context,
    name = "ConvolverNode";

var ConvolverNode = function(parameters) {
  Node.call(this, parameters);

  // TODO: Different types of convolution instead of just noise
  if (this.audioBuffer === null && context.supported) {
    var noiseBuffer = context.createBuffer(2, 0.5 * context.sampleRate, context.sampleRate),
        left = noiseBuffer.getChannelData(0),
        right = noiseBuffer.getChannelData(1);

    for (var i = 0; i < noiseBuffer.length; i++) {
        left[i] = Math.random() * 2 - 1;
        right[i] = Math.random() * 2 - 1;
    }

    this.audioBuffer = noiseBuffer;
  }

};

ConvolverNode.prototype = Object.create(Node.prototype);
ConvolverNode.prototype.name = name;
ConvolverNode.prototype.defaultParameters = {
  audioBuffer: null
};

ConvolverNode.prototype.clone = function() {
  return new ConvolverNode({
    id: this.id,
    audioBuffer: this.audioBuffer,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};


ConvolverNode.prototype.refresh = function(contextPair) {
  refresh.call(this, contextPair);
};

ConvolverNode.prototype.offlineRefresh = function(contextPair) {
  refresh.call(this, contextPair, "offline");
};

function refresh(contextPair, prefix) {
  var node = contextPair.context.createConvolver();
  node.buffer = this.audioBuffer;

  var nodeName = prefix ? (prefix+'Node') : 'node';
  this[nodeName] = node;
}

ConvolverNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id
  };
};

ConvolverNode.prototype.toString = function() {
  return this.id+": ConvolverNode()";
};

/*
  @return a ConvolverNode
*/
ConvolverNode.random = function() {
  return new ConvolverNode();
};

export default ConvolverNode;
