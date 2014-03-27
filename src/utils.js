
var Utils = {};

Utils.IS_DEBUG = true;

Utils.log = function(msg) {
  if (!Utils.IS_DEBUG) return;
  
  console.log(msg);
  if ($)
    $('.log').prepend('<div>'+msg+'</div>');
};

Utils.error = function(msg) {
  throw msg;
};

Utils.random = function() {
  return Math.random();
};

/*
  @params (min, max) or ({min, max})
*/
Utils.randomIn = function(min, max) {
  if (_.isObject(min)) {
    max = min.max;
    min = min.min;
  }
  return Math.random()*(max-min) + min;
};

/*
  @params (min, max) or ({min, max})
  @param min
  @param max up to but not including (aka, an array's length for finding
             an index)
 */
Utils.randomIndexIn = function(min, max) {
  if (_.isObject(min)) {
    max = min.max;
    min = min.min;
  }
  return Math.floor(Utils.randomIn(min, max));
};

/*
  @param chance {number} [0,1]
  @return If a random number was generated less than the chance
*/
Utils.randomChance = function(chance) {
  return Utils.random() <= chance;
};

Utils.randomBool = function() {
  return !!Math.round(Math.random());
};

/** 
  @param xs {array} [x1, x2,...]
  @return A random element in xs, undefined if xs is empty
*/
Utils.randomElementIn = function(xs) {
  if (xs.length===0) return;

  var index = Utils.randomIndexIn(0, xs.length);
  return xs[index];
};

/**
 * Clamps the given number to the min or max
 * @param x 
 * @param min
 * @param max
 * @return A number in [min, max]
 **/
Utils.clamp = function(x, min, max) {
  if (x > max)
    return max;
  if (x < min)
    return min;
  return x;
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [rev. #1]
Utils.shuffle = function(v) {
  for(var j, x, i = v.length; 
    i;
    j = parseInt(Math.random() * i),
      x = v[--i],
      v[i] = v[j],
      v[j] = x);
  return v;
};

/*
  @param xs [{weight, element},...] with sum(weights)===1.0
*/
Utils.weightedSelection = function(xs) {
  var r = Math.random(),
      sum = 0, element;
  _.forEach(xs, function(x) {
    sum+=x.weight;
    if (r <= sum) {
      element = x.element;
      return false;
    }
  });
  return element;
};

/*
  Mutates the given
  @param params
 */
Utils.mutateParameter = function(params, target) {
  var delta, range, newParam;

  _.defaults(params, {
    obj: null,
    parameter: 'param',
    
    // Chance of mutating only by an amount in mutation delta
    // (ie. weight+=mutationDelta), otherwise (weight=mutationRange)
    mutationDeltaChance: 0.8,
    mutationDelta: {min: -0.2, max: 0.2},

    mutateDelta: function() {
      if (params.discreteMutation)
        delta = Utils.randomIndexIn(params.mutationDelta);
      else
        delta = Utils.randomIn(params.mutationDelta);
      Utils.log('mutating by delta '+delta.toFixed(3));
      params.obj[params.parameter]+=delta;
    },

    // note: the inverse is also possible (ex (-max, -min]) when
    // allowInverse is true
    randomMutationRange: {min: 0.1, max: 1.5},

    mutateRandom: function() {
      range = params.randomMutationRange;
      if (params.discreteMutation)
        newParam = Utils.randomIndexIn(range);
      else
        newParam = Utils.randomIn(range);

      // 50% chance of negative
      if (params.allowInverse && Utils.randomBool())
        newParam*=-1;

      Utils.log('mutating with new param '+newParam);
      params.obj[params.parameter] = newParam;
    },

    allowInverse: true,
    // true if only integers are allowed (ie for an index), otherwise
    // uses floating point
    discreteMutation: false
  });

  Utils.log('mutating('+params.parameter+') '+params.obj);

  

  // Only change the weight by a given delta
  if (Utils.randomChance(params.mutationDeltaChance))
    params.mutateDelta.call(target);
  // Use a new random weight in range
  else
    params.mutateRandom.call(target);
};

/*
  Generates a reversible unique number from two numbers
*/
Utils.cantorPair = function(x, y) {
  return ((x+y)*(x+y+1)) / 2 + y;
};
Utils.reverseCantorPair = function(z) {
  var t = Math.floor((-1 + Math.sqrt(1+8*z))/2);
  var x = t*(t+3)/2 - z;
  var y = z - t*(t+1)/2;
  return {x:x, y:y};
};

/**
  extend function that clones the default parameters
  @param arguments
*/
Utils.extend = function(self, defaultParameters, parameters) {
  // deep clone the defaultParameters so [] and {} aren't referenced by
  // multiple objects
  _.assign(self, _.cloneDeep(defaultParameters), parameters);
};

Utils.roundTo2Places = function(num) {
  return +(Math.round(num + "e+2")  + "e-2");
};

var TWELTH_ROOT = Math.pow(2,1/12);
var A4 = 440;
var DISTANCE_FROM_A = {
  c:-9, d:-7, e:-5, f:-4, g:-2, a:0, b:2
};
/**
  Gets the frequency based on an equal tempered scale
  with A4 = 440
  @param note (ex: 'c4', 'c4#', 'C4b')
*/
Utils.frequencyForNote = function(note) {
  note = note.toLowerCase().split('');
  var letter = note[0],
      octave = parseInt(note[1], 10),
      modifier = note[2],
      diff = DISTANCE_FROM_A[letter];
  if (modifier==='#')
    ++diff;
  else if (modifier==='b')
    --diff;

  diff+= 12 * (octave-4);

  return Utils.frequencyOfStepsFromRootNote(diff);
};

Utils.frequencyOfStepsFromRootNote = function(steps) {
  return A4 * Math.pow(TWELTH_ROOT, steps);
};

export default Utils;