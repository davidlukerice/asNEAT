
var Utils = require('asNEAT/utils')['default'],
    Network = require('asNEAT/network')['default'],
    log = Utils.log,
    name = "Population";

/**
  A collection of instruments
*/
var Population = function(parameters) {
  Utils.extend(this, this.defaultParameters, parameters);
};

Population.prototype.name = name;
Population.prototype.defaultParameters = {
  networks: [],
  networkParameters: {},
  numberOfMutationsPerGeneration: 1,
  numberOfNewParentMutations: 3,
  populationCount: 9,
  crossoverRate: 0.1,
  mutationRate: 1.0,
  mutationParams: {
    mutationDistance: 0.5,
    splitMutationChance: 0.2,
    addOscillatorChance: 0.1,
    addConnectionChance: 0.2,
    mutateConnectionWeightsChance: 0.25,
    mutateNodeParametersChance: 0.25
  }
};

/*
  Creates a deep clone of this Population
 */
Population.prototype.clone = function() {
  var clonedNetworks = [];
  _.forEach(this.networks, function(network){
    clonedNetworks.push(network.clone());
  });
  return new Population({
    networks: clonedNetworks,
    networkParameters: _.cloneDeep(this.networkParameters),
    numberOfMutationsPerGeneration: this.numberOfMutationsPerGeneration,
    numberOfNewParentMutations: this.numberOfNewParentMutations,
    populationCount: this.populationCount,
    crossoverRate: this.crossoverRate,
    mutationRate: this.mutationRate
  });
};

Population.prototype.toString = function() {
  var str = "Networks["+this.networks.length+"]:<br>";
  str+= "crossoverRate: "+this.crossoverRate+"<br>";
  str+= "mutationRate: "+this.mutationRate+"<br>";
  return str;
};

Population.prototype.GenerateNewRandomParent = function() {
  var newParent = new Network(this.networkParameters),
      i, num;
  for (i=0, num=this.numberOfNewParentMutations; i<num; ++i)
    newParent.mutate(this.mutationParams);
  return newParent;
};

/**
  @param parents an array of networks (can be empty)
  @param params defaultParameters for the population
  @return Population
*/
Population.generateFromParents = function(parents, params) {
  var newPopulation = new Population(params),
      numMutations = newPopulation.numberOfMutationsPerGeneration,
      networkParams = newPopulation.networkParameters,
      hasAnyParents = parents.length > 0,
      hasOnlyOneParent = parents.length === 1,
      x, y, i, isCrossed, tempLastMutation;
  while(newPopulation.networks.length < newPopulation.populationCount) {
    isCrossed = false;

    if (hasAnyParents)
      x = Utils.randomElementIn(parents);
    else
      x = newPopulation.GenerateNewRandomParent();

    if (Utils.randomChance(newPopulation.crossoverRate)) {
      if (!hasAnyParents || hasOnlyOneParent)
        y = newPopulation.GenerateNewRandomParent();
      else
        y = Utils.randomElementIn(parents, x);

      x = x.crossWith(y);
      isCrossed = true;
    }

    if (Utils.randomChance(newPopulation.mutationRate)) {
      if (isCrossed)
        tempLastMutation = x.lastMutation;

      x = x.clone();
      for (i=0; i<numMutations; ++i)
        x.mutate(params.mutationParams);

      if (isCrossed) {
        x.lastMutation.objectsChanged = tempLastMutation.objectsChanged.concat(
          x.lastMutation.objectsChanged);
        x.lastMutation.changeDescription = tempLastMutation.changeDescription+" & "+
          x.lastMutation.changeDescription;
      }
    }

    newPopulation.networks.push(x);
  }
  return newPopulation;
};

export default Population;
