
var Utils = require('asNEAT/utils')['default'],
    Node = require('asNEAT/nodes/node')['default'],
    context = require('asNEAT/asNEAT')['default'].context,
    name = "FeedbackDelayNode";

var FeedbackDelayNode = function(parameters) {
  Node.call(this, parameters);
};

FeedbackDelayNode.prototype = Object.create(Node.prototype);
FeedbackDelayNode.prototype.name = name;
FeedbackDelayNode.prototype.defaultParameters = {
  // in seconds
  delayTime: 0,

  // [0,1], although >=1 is allowed... not advised
  feedbackRatio: 0.2,

  parameterMutationChance: 0.1,
  mutatableParameters: [
    {
      name: 'delayTime',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.5, max: 0.5},
      randomMutationRange: {min: 0.0, max: 3.0}
    },{
      name: 'feedbackRatio',
      // doesn't make sense to change type by a delta
      mutationDeltaChance: 0.8,
      mutationDelta: {min: -0.2, max: 0.2},
      // TODO: set global min?
      randomMutationRange: {min: 0, max: 0.6}
    }
  ]
};

FeedbackDelayNode.prototype.clone = function() {
  return new FeedbackDelayNode({
    id: this.id,
    delayTime: this.delayTime,
    feedbackRatio: this.feedbackRatio,
    parameterMutationChance: this.parameterMutationChance,
    mutatableParameters: _.cloneDeep(this.mutatableParameters)
  });
};

// Refreshes the cached node to be played again
FeedbackDelayNode.prototype.refresh = function() {

  // base passthrough gain
  var passthroughGain = context.createGain();
  passthroughGain.gain.value = 1.0;

  var delayNode = context.createDelay();
  delayNode.delayTime.value = this.delayTime;

  // add an additional gain node for 'delay' feedback
  var feedbackGainNode = context.createGain();
  feedbackGainNode.gain.value = this.feedbackRatio;

  passthroughGain.connect(delayNode);
  delayNode.connect(feedbackGainNode);
  feedbackGainNode.connect(passthroughGain);

  this.node = passthroughGain;
};

FeedbackDelayNode.prototype.getParameters = function() {
  return {
    name: name,
    id: this.id,
    delayTime: this.delayTime,
    feedbackRatio: this.feedbackRatio
  };
};

FeedbackDelayNode.prototype.toString = function() {
  return this.id+": FeedbackDelayNode("+
    this.delayTime.toFixed(2)+","+
    this.feedbackRatio.toFixed(2)+")";
};

FeedbackDelayNode.random = function() {
  return new FeedbackDelayNode({
    delayTime: Utils.randomIn(0.0, 3.0),
    feedbackRatio: Utils.randomIn(0, 0.6)
  });
};

export default FeedbackDelayNode;