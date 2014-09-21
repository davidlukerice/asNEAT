module("Population Tests");
var Population = require('asNEAT/population')['default'],
    Network = require('asNEAT/network')['default'];

test('population count', function() {
  var popNum = 9,
      pop = Population.generateFromParents([], {
        numberOfNewParentMutations: popNum
      });
  equal(pop.networks.length, popNum, "generates correct population number");
});

test('generation number', function() {
  var n = new Network(),
      pop = new Population({
        networks: [n]
      }),
      newPop = Population.generateFromParents([n]);
  equal(pop.networks[0].generation, 0, "new networks are generation 0");
  equal(newPop.networks[0].generation, 1, "new population increments generation");
});

test('generateFromParents', function() {
  var pop = new Population.generateFromParents([], {
    mutationParams: {
      mutationDistance: 1.0
    }
  });
  equal(pop.mutationParams.mutationDistance, 1.0, "can change mutationDistance");
  equal(pop.mutationParams.splitMutationChance, 0.2, "other mutationParams remain the same");
});
