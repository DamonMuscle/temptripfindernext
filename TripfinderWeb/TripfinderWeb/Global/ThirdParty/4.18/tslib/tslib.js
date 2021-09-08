//>>built
/*
 *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
*****************************************************************************/
var __extends,__assign,__rest,__decorate,__param,__metadata,__awaiter,__generator,__exportStar,__values,__read,__spread,__spreadArrays,__await,__asyncGenerator,__asyncDelegator,__asyncValues,__makeTemplateObject,__importStar,__importDefault,__classPrivateFieldGet,__classPrivateFieldSet,__createBinding;
(function(l){function q(b,c){b!==a&&("function"===typeof Object.create?Object.defineProperty(b,"__esModule",{value:!0}):b.__esModule=!0);return function(e,d){return b[e]=c?c(e,d):d}}var a="object"===typeof global?global:"object"===typeof self?self:"object"===typeof this?this:{};"function"===typeof define&&define.amd?define("tslib",["exports"],function(b){l(q(a,q(b)))}):"object"===typeof module&&"object"===typeof module.exports?l(q(a,q(module.exports))):l(q(a))})(function(l){var q=Object.setPrototypeOf||
{__proto__:[]}instanceof Array&&function(a,b){a.__proto__=b}||function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c])};__extends=function(a,b){function c(){this.constructor=a}q(a,b);a.prototype=null===b?Object.create(b):(c.prototype=b.prototype,new c)};__assign=Object.assign||function(a){for(var b,c=1,e=arguments.length;c<e;c++){b=arguments[c];for(var d in b)Object.prototype.hasOwnProperty.call(b,d)&&(a[d]=b[d])}return a};__rest=function(a,b){var c={},e;for(e in a)Object.prototype.hasOwnProperty.call(a,
e)&&0>b.indexOf(e)&&(c[e]=a[e]);if(null!=a&&"function"===typeof Object.getOwnPropertySymbols){var d=0;for(e=Object.getOwnPropertySymbols(a);d<e.length;d++)0>b.indexOf(e[d])&&Object.prototype.propertyIsEnumerable.call(a,e[d])&&(c[e[d]]=a[e[d]])}return c};__decorate=function(a,b,c,e){var d=arguments.length,h=3>d?b:null===e?e=Object.getOwnPropertyDescriptor(b,c):e,k;if("object"===typeof Reflect&&"function"===typeof Reflect.decorate)h=Reflect.decorate(a,b,c,e);else for(var f=a.length-1;0<=f;f--)if(k=
a[f])h=(3>d?k(h):3<d?k(b,c,h):k(b,c))||h;return 3<d&&h&&Object.defineProperty(b,c,h),h};__param=function(a,b){return function(c,e){b(c,e,a)}};__metadata=function(a,b){if("object"===typeof Reflect&&"function"===typeof Reflect.metadata)return Reflect.metadata(a,b)};__awaiter=function(a,b,c,e){function d(h){return h instanceof c?h:new c(function(k){k(h)})}return new (c||(c=Promise))(function(h,k){function f(m){try{g(e.next(m))}catch(n){k(n)}}function p(m){try{g(e["throw"](m))}catch(n){k(n)}}function g(m){m.done?
h(m.value):d(m.value).then(f,p)}g((e=e.apply(a,b||[])).next())})};__generator=function(a,b){function c(g){return function(m){return e([g,m])}}function e(g){if(h)throw new TypeError("Generator is already executing.");for(;d;)try{if(h=1,k&&(f=g[0]&2?k["return"]:g[0]?k["throw"]||((f=k["return"])&&f.call(k),0):k.next)&&!(f=f.call(k,g[1])).done)return f;if(k=0,f)g=[g[0]&2,f.value];switch(g[0]){case 0:case 1:f=g;break;case 4:return d.label++,{value:g[1],done:!1};case 5:d.label++;k=g[1];g=[0];continue;case 7:g=
d.ops.pop();d.trys.pop();continue;default:if(!(f=d.trys,f=0<f.length&&f[f.length-1])&&(6===g[0]||2===g[0])){d=0;continue}if(3===g[0]&&(!f||g[1]>f[0]&&g[1]<f[3]))d.label=g[1];else if(6===g[0]&&d.label<f[1])d.label=f[1],f=g;else if(f&&d.label<f[2])d.label=f[2],d.ops.push(g);else{f[2]&&d.ops.pop();d.trys.pop();continue}}g=b.call(a,d)}catch(m){g=[6,m],k=0}finally{h=f=0}if(g[0]&5)throw g[1];return{value:g[0]?g[1]:void 0,done:!0}}var d={label:0,sent:function(){if(f[0]&1)throw f[1];return f[1]},trys:[],
ops:[]},h,k,f,p;return p={next:c(0),"throw":c(1),"return":c(2)},"function"===typeof Symbol&&(p[Symbol.iterator]=function(){return this}),p};__createBinding=function(a,b,c,e){void 0===e&&(e=c);a[e]=b[c]};__exportStar=function(a,b){for(var c in a)"default"===c||b.hasOwnProperty(c)||(b[c]=a[c])};__values=function(a){var b="function"===typeof Symbol&&Symbol.iterator,c=b&&a[b],e=0;if(c)return c.call(a);if(a&&"number"===typeof a.length)return{next:function(){a&&e>=a.length&&(a=void 0);return{value:a&&a[e++],
done:!a}}};throw new TypeError(b?"Object is not iterable.":"Symbol.iterator is not defined.");};__read=function(a,b){var c="function"===typeof Symbol&&a[Symbol.iterator];if(!c)return a;a=c.call(a);var e,d=[];try{for(;(void 0===b||0<b--)&&!(e=a.next()).done;)d.push(e.value)}catch(k){var h={error:k}}finally{try{e&&!e.done&&(c=a["return"])&&c.call(a)}finally{if(h)throw h.error;}}return d};__spread=function(){for(var a=[],b=0;b<arguments.length;b++)a=a.concat(__read(arguments[b]));return a};__spreadArrays=
function(){for(var a=0,b=0,c=arguments.length;b<c;b++)a+=arguments[b].length;a=Array(a);var e=0;for(b=0;b<c;b++)for(var d=arguments[b],h=0,k=d.length;h<k;h++,e++)a[e]=d[h];return a};__await=function(a){return this instanceof __await?(this.v=a,this):new __await(a)};__asyncGenerator=function(a,b,c){function e(n){p[n]&&(g[n]=function(r){return new Promise(function(t,u){1<m.push([n,r,t,u])||d(n,r)})})}function d(n,r){try{var t=p[n](r);t.value instanceof __await?Promise.resolve(t.value.v).then(h,k):f(m[0][2],
t)}catch(u){f(m[0][3],u)}}function h(n){d("next",n)}function k(n){d("throw",n)}function f(n,r){(n(r),m.shift(),m.length)&&d(m[0][0],m[0][1])}if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var p=c.apply(a,b||[]),g,m=[];return g={},e("next"),e("throw"),e("return"),g[Symbol.asyncIterator]=function(){return this},g};__asyncDelegator=function(a){function b(d,h){c[d]=a[d]?function(k){return(e=!e)?{value:__await(a[d](k)),done:"return"===d}:h?h(k):k}:h}var c,e;return c=
{},b("next"),b("throw",function(d){throw d;}),b("return"),c[Symbol.iterator]=function(){return this},c};__asyncValues=function(a){function b(h){d[h]=a[h]&&function(k){return new Promise(function(f,p){k=a[h](k);c(f,p,k.done,k.value)})}}function c(h,k,f,p){Promise.resolve(p).then(function(g){h({value:g,done:f})},k)}if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var e=a[Symbol.asyncIterator],d;return e?e.call(a):(a="function"===typeof __values?__values(a):a[Symbol.iterator](),
d={},b("next"),b("throw"),b("return"),d[Symbol.asyncIterator]=function(){return this},d)};__makeTemplateObject=function(a,b){Object.defineProperty?Object.defineProperty(a,"raw",{value:b}):a.raw=b;return a};__importStar=function(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.hasOwnProperty.call(a,c)&&(b[c]=a[c]);b["default"]=a;return b};__importDefault=function(a){return a&&a.__esModule?a:{"default":a}};__classPrivateFieldGet=function(a,b){if(!b.has(a))throw new TypeError("attempted to get private field on non-instance");
return b.get(a)};__classPrivateFieldSet=function(a,b,c){if(!b.has(a))throw new TypeError("attempted to set private field on non-instance");b.set(a,c);return c};l("__extends",__extends);l("__assign",__assign);l("__rest",__rest);l("__decorate",__decorate);l("__param",__param);l("__metadata",__metadata);l("__awaiter",__awaiter);l("__generator",__generator);l("__exportStar",__exportStar);l("__createBinding",__createBinding);l("__values",__values);l("__read",__read);l("__spread",__spread);l("__spreadArrays",
__spreadArrays);l("__await",__await);l("__asyncGenerator",__asyncGenerator);l("__asyncDelegator",__asyncDelegator);l("__asyncValues",__asyncValues);l("__makeTemplateObject",__makeTemplateObject);l("__importStar",__importStar);l("__importDefault",__importDefault);l("__classPrivateFieldGet",__classPrivateFieldGet);l("__classPrivateFieldSet",__classPrivateFieldSet)});