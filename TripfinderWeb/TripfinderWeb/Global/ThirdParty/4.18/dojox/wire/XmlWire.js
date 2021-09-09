//>>built
define(["dojo","dijit","dojox","dojo/require!dojox/xml/parser,dojox/wire/Wire"],function(g,m,k){g.provide("dojox.wire.XmlWire");g.require("dojox.xml.parser");g.require("dojox.wire.Wire");g.declare("dojox.wire.XmlWire",k.wire.Wire,{_wireClass:"dojox.wire.XmlWire",constructor:function(a){},_getValue:function(a){if(!a||!this.path)return a;var c=this.path;if("/"==c.charAt(0)){var b=c.indexOf("/",1);c=c.substring(b+1)}c=c.split("/");var e=c.length-1;for(b=0;b<e;b++)if(a=this._getChildNode(a,c[b]),!a)return;
return this._getNodeValue(a,c[e])},_setValue:function(a,c){if(!this.path)return a;var b=a,e=this._getDocument(b),d=this.path;if("/"==d.charAt(0)){var f=d.indexOf("/",1);b||(a=d.substring(1,f),a=b=e.createElement(a));d=d.substring(f+1)}else if(!b)return;d=d.split("/");var l=d.length-1;for(f=0;f<l;f++){var h=this._getChildNode(b,d[f]);h||(h=e.createElement(d[f]),b.appendChild(h));b=h}this._setNodeValue(b,d[l],c);return a},_getNodeValue:function(a,c){var b=void 0;if("@"==c.charAt(0))b=c.substring(1),
b=a.getAttribute(b);else if("text()"==c){if(a=a.firstChild)b=a.nodeValue}else{b=[];for(var e=0;e<a.childNodes.length;e++){var d=a.childNodes[e];1===d.nodeType&&d.nodeName==c&&b.push(d)}}return b},_setNodeValue:function(a,c,b){if("@"==c.charAt(0))c=c.substring(1),b?a.setAttribute(c,b):a.removeAttribute(c);else if("text()"==c){for(;a.firstChild;)a.removeChild(a.firstChild);b&&(b=this._getDocument(a).createTextNode(b),a.appendChild(b))}},_getChildNode:function(a,c){var b=1,e=c.indexOf("[");0<=e&&(b=
c.indexOf("]"),b=c.substring(e+1,b),c=c.substring(0,e));e=1;for(var d=0;d<a.childNodes.length;d++){var f=a.childNodes[d];if(1===f.nodeType&&f.nodeName==c){if(e==b)return f;e++}}return null},_getDocument:function(a){return a?9==a.nodeType?a:a.ownerDocument:k.xml.parser.parse()}})});