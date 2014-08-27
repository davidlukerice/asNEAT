
var Utils = require('asNEAT/utils')['default'],
    name = "Node";

var Node = function(parameters) {
  Utils.extend(this,
    _.defaults(
      this.defaultParameters,
      Node.prototype.defaultParameters
    ),
    parameters);

  this.hasChanged = false;

  // Only generate a new id if one isn't given in the parameters
  if (parameters && typeof parameters.id !== 'undefined')
    this.id = parameters.id;
  else
    this.id = Utils.createHash();
};

Node.prototype.name = name;
Node.prototype.defaultParameters = {
  parameterMutationInterpolationType: Utils.InterpolationType.EXPONENTIAL,
  parameterMutationChance: [0.05, 0.8],
  mutatableParameters: [
  //  { see Utils.mutateParameter documentation
  //    name,
  //    mutationDeltaChance: chance for mutating by delta or by ranomd change,
  //    mutationDelta: range that the parameter can be shifter by,
  //    randomMutationRange: range parameter can be randomly changed to,
  //    discreteMutation: if mutations should be integers
  //  }
  ],

  connectableParameters: [
    //{
    //  name: "frequency", : must be able to osc.connect(node.name)
    //  nodeName: "oscNode" : if the parameter is anything other than 'node' for the object
    //  amplitudeScaling: {min: -2000, max: 2000} : range of allowed amplitude
    //  modulating the parameter
    //  // TODO: Handle snapping to carrier frequency multiple?
    //  // http://greweb.me/2013/08/FM-audio-api/
    //}
  ]
};

/**
  Creates a cloned node
  @return Node
*/
Node.prototype.clone = function() {
  throw "clone not implemented";
};


// TODO: Merge refresh and offline refresh?

/**
  Refreshes any web audio context nodes
  @param contextPair {context, globalGain}
*/
Node.prototype.refresh = function(contextPair) {
  throw "refresh not implemented";
};

/**
  Refreshes any web audio offline nodes
  @param contextPair {context, globalGain}
*/
Node.prototype.offlineRefresh = function(contextPair) {
  throw "offline refresh not implemented";
};

/**
  Gets the various parameters characterizing this node
*/
Node.prototype.getParameters = function() {
  throw "getParameters not implemented";
};

Node.prototype.toString = function() {
  throw "toString not implemented";
};

/**
  Mutates at least one parameter
  @return this Node
*/
Node.prototype.mutate = function(params) {
  if (typeof params === 'undefined') params = {};
  _.defaults(params, {
    // {Number} [0.0, 1.0]
    mutationDistance: 0.5
  });

  var self = this,
      parameters = this.mutatableParameters,
      mutated = false;

  if (!parameters || parameters.length===0) {
    Utils.log('no mutation parameters');
    return this;
  }

  var chance = Utils.interpolate(
    this.parameterMutationInterpolationType,
    this.parameterMutationChance,
    params.mutationDistance);

  _.forEach(this.mutatableParameters, function(param) {
    if (!Utils.randomChance(chance))
      return true;
    mutate(param);
    mutated = true;
  });

  if (!mutated) {
    var param = Utils.randomElementIn(parameters);
    mutate(param);
  }

  return this;

  function mutate(param) {
    Utils.mutateParameter({
      obj: self,
      parameter: param.name,
      mutationDeltaInterpolationType: param.mutationDeltaInterpolationType,
      mutationDeltaChance: param.mutationDeltaChance,
      mutationDistance: params.mutationDistance,
      mutationDelta: param.mutationDelta,
      allowDeltaInverse: param.allowDeltaInverse,
      randomMutationRange: param.randomMutationRange,
      allowRandomInverse: param.allowRandomInverse,
      discreteMutation: param.discreteMutation
    });
  }
};

Node.prototype.toJSON = function() {
  var json = this.getParameters();
  return JSON.stringify(json);
};

/**
  Creates a random node
  @return Node
  */
Node.random = function() {
  throw "static random not implemented";
};

export default Node;
