//>>built
define("dojo/_base/kernel dojo/_base/array dojo/_base/config dojo/_base/window dojo/_base/Deferred dojo/ready".split(" "),function(l,g,q,r,t,p){return new function(){this._lazyNodes=[];var m=this;q.parseOnLoad&&p(90,function(){var c=g.filter(r.body().getElementsByTagName("*"),function(e){return"true"===e.getAttribute("lazy")||(e.getAttribute("data-dojo-props")||"").match(/lazy\s*:\s*true/)}),a,b,h,d;for(a=0;a<c.length;a++)g.forEach(["dojoType","data-dojo-type"],function(e){h=g.filter(c[a].getElementsByTagName("*"),
function(f){return f.getAttribute(e)});for(b=0;b<h.length;b++)d=h[b],d.setAttribute("__"+e,d.getAttribute(e)),d.removeAttribute(e),m._lazyNodes.push(d)})});p(function(){for(var c=0;c<m._lazyNodes.length;c++){var a=m._lazyNodes[c];g.forEach(["dojoType","data-dojo-type"],function(b){a.getAttribute("__"+b)&&(a.setAttribute(b,a.getAttribute("__"+b)),a.removeAttribute("__"+b))})}delete m._lazyNodes});this.instantiateLazyWidgets=function(c,a,b){var h=new t;a=a?a.split(/,/):[];for(var d=c.getElementsByTagName("*"),
e=d.length,f=0;f<e;f++){var k=d[f].getAttribute("dojoType")||d[f].getAttribute("data-dojo-type");k&&(a.push(k),k=(k=d[f].getAttribute("data-dojo-mixins"))?k.split(/, */):[],a=a.concat(k))}if(0===a.length)return!0;if(l.require)return g.forEach(a,function(n){l.require(n)}),l.parser.parse(c),b&&b(c),!0;a=g.map(a,function(n){return n.replace(/\./g,"/")});require(a,function(){l.parser.parse(c);b&&b(c);h.resolve(!0)});return h}}});