// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports"],function(c){let e=function(){function a(){}a.parse=function(b){if(1<b.length)throw Error('"id" does not expect arguments');return new a};a.prototype.evaluate=function(b,d){return b.id};return a}(),f=function(){function a(){}a.parse=function(b){if(1<b.length)throw Error('"geometry-type" does not expect arguments');return new a};a.prototype.evaluate=function(b,d){switch(b.type){case 0:return"Unknown";case 1:return"Point";case 2:return"LineString";case 3:return"Polygon"}};return a}(),
g=function(){function a(){}a.parse=function(b){if(1<b.length)throw Error('"properties" does not expect arguments');return new a};a.prototype.evaluate=function(b,d){return b.values};return a}(),h=function(){function a(){}a.parse=function(b){if(1<b.length)throw Error('"zoom" does not expect arguments');return new a};a.prototype.evaluate=function(b,d){return d};return a}();c.GeomType=f;c.ID=e;c.Properties=g;c.Zoom=h;Object.defineProperty(c,"__esModule",{value:!0})});