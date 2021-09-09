// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","./typedArrayUtil"],function(f,d){function k(a,c){let b;if(c)for(b in a)a.hasOwnProperty(b)&&(void 0===a[b]?delete a[b]:a[b]instanceof Object&&k(a[b],!0));else for(b in a)a.hasOwnProperty(b)&&void 0===a[b]&&delete a[b];return a}function g(a){if(!a||"object"!==typeof a||"function"===typeof a)return a;if(d.isInt8Array(a)||d.isUint8Array(a)||d.isUint8ClampedArray(a)||d.isInt16Array(a)||d.isUint16Array(a)||d.isInt32Array(a)||d.isUint32Array(a)||d.isFloat32Array(a)||d.isFloat64Array(a))return d.slice(a);
if(a instanceof Date)return new Date(a.getTime());if(a instanceof ArrayBuffer)return a.slice(0,a.byteLength);if(a instanceof Map){const c=new Map;a.forEach((b,e)=>{c.set(e,g(b))});return c}if(a instanceof Set){const c=new Set;a.forEach(b=>{c.add(g(b))});return c}return"function"===typeof a.clone?a.clone():"function"===typeof a.map&&"function"===typeof a.forEach?a.map(g):"function"===typeof a.notifyChange&&"function"===typeof a.watch?a.clone():l({},a,g)}function l(a,c,b){let e,h;const m={};for(e in c){h=
c[e];const n=!(e in m)||m[e]!==h;if(!(e in a)||a[e]!==h&&n)a[e]=b?b(h):h}return a}f.clone=g;f.equals=function(a,c){return a===c||"number"===typeof a&&isNaN(a)&&"number"===typeof c&&isNaN(c)||"function"===typeof(a||{}).getTime&&"function"===typeof(c||{}).getTime&&a.getTime()===c.getTime()||!1};f.fixJson=k;f.mixin=function(a={},...c){for(const b of c)l(a,b);return a};Object.defineProperty(f,"__esModule",{value:!0})});