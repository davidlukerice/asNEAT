
(function(global) {
  "use strict";

  var ns = (global.asNEAT = global.asNEAT || {});

  var Utils = {};

  Utils.IS_DEBUG = false;

  Utils.log = function(msg) {
    if (Utils.IS_DEBUG)
      console.log(msg)
  };

  Utils.error = function(msg) {
    throw msg;
  };

  Utils.randomIn = function(min,max) {
    return Math.random()*(max-min) + min;
  };

  Utils.randomIndexIn = function(min, max) {
    return Math.floor(Utils.randomIn(min, max));
  };

  Utils.randomChance = function() {
    return Math.random();
  };

  Utils.randomBool = function() {
    return !!Math.round(Math.random());
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

  ns.Utils = Utils;
})(this);