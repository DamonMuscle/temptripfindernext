// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","./tracking"],function(g,f){let h=function(){function d(a){this.notify=a;this._accessedProperties=new Set;this._observationHandles=[]}var b=d.prototype;b.destroy=function(){this._accessedProperties.clear();this.clearObservationHandles()};b.onPropertyAccessed=function(a){this._accessedProperties.add(a)};b.onTrackingEnd=function(){this._accessedProperties.forEach(a=>{this._observationHandles.push(a.observe(this))});this._accessedProperties.clear()};b.clearObservationHandles=function(){for(const a of this._observationHandles)a.remove();
this._observationHandles.length=0};return d}();g.autorun=function(d){let b=new h(function(){b&&!a&&(b.clearObservationHandles(),a=!0,f.runTracked(b,d),a=!1)}),a=!1;a=!0;f.runTracked(b,d);a=!1;return{remove:function(){b&&(b.destroy(),b=null)}}};g.wire=function(d,b){let a=new h(function(){if(a&&!e){var k=c;a.clearObservationHandles();e=!0;c=f.runTracked(a,d);e=!1;b(k,c)}}),c=null,e=!1;e=!0;c=f.runTracked(a,d);e=!1;return{remove:function(){a&&(a.destroy(),c=a=null)}}};g.wireAsync=function(d,b){function a(){if(!c)return null;
c.clearObservationHandles();return e=f.runTracked(c,d)}let c=new h(function(){b(e,a)}),e=null;a();return{remove:function(){c&&(c.destroy(),c=null);e=null}}};Object.defineProperty(g,"__esModule",{value:!0})});