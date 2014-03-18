
var Utils = require('asNEAT/utils')['default'];

var Node = function(parameters) {
  _.defaults(this, parameters, this.defaultParameters);
  this.id = Node.getNextId();
};

Node.prototype.defaultParameters = {
  //parameterMutationChance: 0.1,
  //mutatableParameters: [
  //  { see Utils.mutateParameter documentation
  //    name,
  //    mutationDeltaChance,
  //    mutationDelta,
  //    randomMutationRange,
  //    discreteMutation
  //  }
  //]
}; 

// Refreshes any web audio context nodes
Node.prototype.refresh = function() {};

Node.prototype.toString = function() {
  return "Node";
};

/**
  Mutates at least one parameter
*/
Node.prototype.mutate = function() {
  var self = this,
      chance = this.parameterMutationChance,
      parameters = this.mutatableParameters,
      mutated = false;

  if (!parameters || parameters.length===0) return;

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
      discreteMutation: param.discreteMutation
    });
  }
};

Node.id=0;
Node.getNextId = function() {
  return Node.id++;
};

// Creates a random node
Node.random = function() {return null;};

export default Node;