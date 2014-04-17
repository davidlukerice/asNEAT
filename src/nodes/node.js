
var Utils = require('asNEAT/utils')['default'],
    name = "Node";

var Node = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);

  this.hasChanged = false;

  // Only generate a new id if one isn't given in the parameters
  if (parameters && typeof parameters.id !== 'undefined')
    this.id = parameters.id;
  else
    this.id = Node.getNextId();
};

Node.prototype.name = name;
Node.prototype.defaultParameters = {
  parameterMutationChance: 0.1,
  mutatableParameters: [
  //  { see Utils.mutateParameter documentation
  //    name,
  //    mutationDeltaChance,
  //    mutationDelta,
  //    randomMutationRange,
  //    discreteMutation
  //  }
  ]
}; 

/**
  Creates a cloned node
  @return Node
*/
Node.prototype.clone = function() {
  throw "clone not implemented";
};

/**
  Refreshes any web audio context nodes
*/
Node.prototype.refresh = function() {
  throw "refresh not implemented";
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
*/
Node.prototype.mutate = function() {
  var self = this,
      chance = this.parameterMutationChance,
      parameters = this.mutatableParameters,
      mutated = false;

  if (!parameters || parameters.length===0) {
    Utils.log('no mutation parameters');
    return;
  }
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

  function mutate(param) {
    Utils.mutateParameter({
      obj: self,
      parameter: param.name,
      mutationDeltaChance: param.mutationDeltaChance,
      mutationDelta: param.mutationDelta,
      randomMutationRange: param.randomMutationRange,
      allowInverse: param.allowInverse,
      discreteMutation: param.discreteMutation
    }, this);
  }
};

Node.id=0;
Node.getNextId = function() {
  return Node.id++;
};

/**
  Creates a random node
  @return Node
  */
Node.random = function() {
  throw "static random not implemented";
};

export default Node;