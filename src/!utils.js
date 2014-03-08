
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

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
    if (min.min) {
      max = min.max;
      min = min.min;
    }
    return Math.random()*(max-min) + min;
  };

  /*
    @param min
    @param max up to but not including (aka, an array's length)
   */
  Utils.randomIndexIn = function(min, max) {
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

  ns.Utils = Utils;
})(this);