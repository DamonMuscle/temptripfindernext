//>>built
define(["./_base"],function(){dojo.experimental("dojox.timing.Streamer");return dojox.timing.Streamer=function(d,e,f,g,c){var h=[];this.interval=f||1E3;this.minimumSize=g||10;this.inputFunction=d||function(b){};this.outputFunction=e||function(b){};var a=new dojox.timing.Timer(this.interval);this.setInterval=function(b){this.interval=b;a.setInterval(b)};this.onTick=function(b){};this.start=function(){if("function"==typeof this.inputFunction&&"function"==typeof this.outputFunction)a.start();else throw Error("You cannot start a Streamer without an input and an output function.");
};this.onStart=function(){};this.stop=function(){a.stop()};this.onStop=function(){};a.onTick=this.tick;a.onStart=this.onStart;a.onStop=this.onStop;c&&h.concat(c)}});