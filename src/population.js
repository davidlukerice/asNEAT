
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
  populationCount: 9,
  crossoverRate: 0.7,
  mutationRate: 1.0
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

/**
  @param parents an array of networks
  @param params defaultParameters for the population
  @return Population
*/
Population.generateFromParents = function(parents, params) {
  var newPopulation = new Population(params),
      x, y;
  while(newPopulation.networks.length < newPopulation.populationCount) {
    x = Utils.randomElementIn(parents);
    if (parents.length >= 2 &&
        Utils.randomChance(newPopulation.crossoverRate))
    {
      y = Utils.randomElementIn(parents, x);
      x = x.crossWith(y);
    }
    else
      x = x.clone().mutate();
    newPopulation.networks.push(x);
  }
  return newPopulation;
};

export default Population;