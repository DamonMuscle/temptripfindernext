//>>built
define([],function(){return{declare:function(){var b=0,a=arguments;2>a.length&&console.error("drawing.util.oo.declare; not enough arguments");if(2==a.length){var c=a[0];var d=a[1]}else a=Array.prototype.slice.call(arguments),d=a.pop(),c=a.pop(),b=1;for(var e in d)c.prototype[e]=d[e];b&&(a.unshift(c),c=this.extend.apply(this,a));return c},extend:function(){var b=arguments,a=b[0];2>b.length&&console.error("drawing.util.oo.extend; not enough arguments");for(var c=function(){for(var f=1;f<b.length;f++)b[f].prototype.constructor.apply(this,
arguments);a.prototype.constructor.apply(this,arguments)},d=1;d<b.length;d++)for(var e in b[d].prototype)c.prototype[e]=b[d].prototype[e];for(e in a.prototype)c.prototype[e]=a.prototype[e];return c}}});