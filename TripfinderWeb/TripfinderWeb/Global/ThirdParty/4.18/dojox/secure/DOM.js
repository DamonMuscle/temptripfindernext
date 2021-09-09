//>>built
define(["dojo","dijit","dojox","dojo/require!dojox/lang/observable"],function(l,B,m){l.provide("dojox.secure.DOM");l.require("dojox.lang.observable");m.secure.DOM=function(h){function g(a){if(a){if(a.nodeType){var b=v(a);1==a.nodeType&&"function"==typeof b.style&&(b.style=z(a.style),b.ownerDocument=p,b.childNodes={__get__:function(e){return g(a.childNodes[e])},length:0});return b}if(a&&"object"==typeof a){if(a.__observable)return a.__observable;b=a instanceof Array?[]:{};a.__observable=b;for(var c in a)"__observable"!=
c&&(b[c]=g(a[c]));b.data__=a;return b}if("function"==typeof a){var d=function(e){return"function"==typeof e?function(){for(var f=0;f<arguments.length;f++)arguments[f]=g(arguments[f]);return d(e.apply(g(this),arguments))}:m.secure.unwrap(e)};return function(){a.safetyCheck&&a.safetyCheck.apply(d(this),arguments);for(var e=0;e<arguments.length;e++)arguments[e]=d(arguments[e]);return g(a.apply(d(this),arguments))}}}return a}function n(a){a+="";if(a.match(/behavior:|content:|javascript:|binding|expression|@import/))throw Error("Illegal CSS");
var b=h.id||(h.id="safe"+(""+Math.random()).substring(2));return a.replace(/(\}|^)\s*([^\{]*\{)/g,function(c,d,e){return d+" #"+b+" "+e})}function w(a){if(a.match(/:/)&&!a.match(/^(http|ftp|mailto)/))throw Error("Unsafe URL "+a);}function r(a){if(a&&1==a.nodeType){if(a.tagName.match(/script/i)){var b=a.src;b&&""!=b?(a.parentNode.removeChild(a),l.xhrGet({url:b,secure:!0}).addCallback(function(f){p.evaluate(f)})):(b=a.innerHTML,a.parentNode.removeChild(a),g.evaluate(b))}if(a.tagName.match(/link/i))throw Error("illegal tag");
if(a.tagName.match(/style/i)){var c=function(f){a.styleSheet?a.styleSheet.cssText=f:(f=q.createTextNode(f),a.childNodes[0]?a.replaceChild(f,a.childNodes[0]):a.appendChild(f))};(b=a.src)&&""!=b&&(alert("src"+b),a.src=null,l.xhrGet({url:b,secure:!0}).addCallback(function(f){c(n(f))}));c(n(a.innerHTML))}a.style&&n(a.style.cssText);a.href&&w(a.href);a.src&&w(a.src);var d;for(b=0;d=a.attributes[b++];)if("on"==d.name.substring(0,2)&&"null"!=d.value&&""!=d.value)throw Error("event handlers not allowed in the HTML, they must be set with element.addEventListener");
d=a.childNodes;b=0;for(var e=d.length;b<e;b++)r(d[b])}}function t(a){var b=document.createElement("div");if(a.match(/<object/i))throw Error("The object tag is not allowed");b.innerHTML=a;r(b);return b}function u(a,b){return function(c,d){r(d[b]);return c[a](d[0])}}function x(a){return m.lang.makeObservable(function(b,c){return b[c]},a,function(b,c,d,e){for(var f=0;f<e.length;f++)e[f]=unwrap(e[f]);return k[d]?g(k[d].call(b,c,e)):g(c[d].apply(c,e))},k)}unwrap=m.secure.unwrap;var q=h.ownerDocument,p=
{getElementById:function(a){a:if(a=q.getElementById(a)){var b=a;do if(b==h){a=g(a);break a}while(b=b.parentNode);a=null}return a},createElement:function(a){return g(q.createElement(a))},createTextNode:function(a){return g(q.createTextNode(a))},write:function(a){for(a=t(a);a.childNodes.length;)h.appendChild(a.childNodes[0])}};p.open=p.close=function(){};var y={innerHTML:function(a,b){console.log("setting innerHTML");a.innerHTML=t(b).innerHTML},outerHTML:function(a,b){throw Error("Can not set this property");
}},k={appendChild:u("appendChild",0),insertBefore:u("insertBefore",0),replaceChild:u("replaceChild",1),cloneNode:function(a,b){return a.cloneNode(b[0])},addEventListener:function(a,b){l.connect(a,"on"+b[0],this,function(c){c=v(c||window.event);b[1].call(this,c)})}};k.childNodes=k.style=k.ownerDocument=function(){};var v=x(function(a,b,c){if(y[b])y[b](a,c);a[b]=c}),A={behavior:1,MozBinding:1},z=x(function(a,b,c){A[b]||(a[b]=n(c))});g.safeHTML=t;g.safeCSS=n;return g};m.secure.unwrap=function(h){return h&&
h.data__||h}});