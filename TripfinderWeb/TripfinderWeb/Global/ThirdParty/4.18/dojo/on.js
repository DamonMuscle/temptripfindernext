//>>built
define(["require","./_base/kernel","./sniff"],function(A,r,n){function t(b,c,a,d,e){if(d=c.match(/(.*):(.*)/))return c=d[2],d=d[1],g.selector(d,c).call(e,b,a);n("touch")&&u.test(c)&&(a=v(a));if(b.addEventListener){var f=c in p,h=f?p[c]:c;b.addEventListener(h,a,f);return{remove:function(){b.removeEventListener(h,a,f)}}}throw Error("Target must be an event emitter");}function w(){this.cancelable=!1;this.defaultPrevented=!0}function x(){this.bubbles=!1}n("dom")&&n("touch");var g=function(b,c,a,d){return"function"!=
typeof b.on||"function"==typeof c||b.nodeType?g.parse(b,c,a,t,d,this):b.on(c,a)};g.pausable=function(b,c,a,d){var e;b=g(b,c,function(){if(!e)return a.apply(this,arguments)},d);b.pause=function(){e=!0};b.resume=function(){e=!1};return b};g.once=function(b,c,a,d){var e=g(b,c,function(){e.remove();return a.apply(this,arguments)});return e};g.parse=function(b,c,a,d,e,f){var h;if(c.call)return c.call(f,b,a);c instanceof Array?h=c:-1<c.indexOf(",")&&(h=c.split(/\s*,\s*/));if(h){var k=[];c=0;for(var l;l=
h[c++];)k.push(g.parse(b,l,a,d,e,f));k.remove=function(){for(var m=0;m<k.length;m++)k[m].remove()};return k}return d(b,c,a,e,f)};var u=/^touch/;g.matches=function(b,c,a,d,e){e=e&&"function"==typeof e.matches?e:r.query;d=!1!==d;1!=b.nodeType&&(b=b.parentNode);for(;!e.matches(b,c,a);)if(b==a||!1===d||!(b=b.parentNode)||1!=b.nodeType)return!1;return b};g.selector=function(b,c,a){return function(d,e){function f(l){return g.matches(l,b,d,a,h)}var h="function"==typeof b?{matches:b}:this,k=c.bubble;return k?
g(d,k(f),e):g(d,c,function(l){var m=f(l.target);if(m)return l.selectorTarget=m,e.call(m,l)})}};var y=[].slice,z=g.emit=function(b,c,a){var d=y.call(arguments,2),e="on"+c;if("parentNode"in b){var f=d[0]={},h;for(h in a)f[h]=a[h];f.preventDefault=w;f.stopPropagation=x;f.target=b;f.type=c;a=f}do b[e]&&b[e].apply(b,d);while(a&&a.bubbles&&(b=b.parentNode));return a&&a.cancelable&&a},p={};g.emit=function(b,c,a){if(b.dispatchEvent&&document.createEvent){var d=(b.ownerDocument||document).createEvent("HTMLEvents");
d.initEvent(c,!!a.bubbles,!!a.cancelable);for(var e in a)e in d||(d[e]=a[e]);return b.dispatchEvent(d)&&d}return z.apply(g,arguments)};if(n("touch"))var q=window.orientation,v=function(b){return function(c){var a=c.corrected;if(!a){var d=c.type;try{delete c.type}catch(h){}if(c.type){a={};for(var e in c)a[e]=c[e];a.preventDefault=function(){c.preventDefault()};a.stopPropagation=function(){c.stopPropagation()}}else a=c,a.type=d;c.corrected=a;if("resize"==d){if(q==window.orientation)return null;q=window.orientation;
a.type="orientationchange";return b.call(this,a)}"rotation"in a||(a.rotation=0,a.scale=1);if(window.TouchEvent&&c instanceof TouchEvent){d=a.changedTouches[0];for(var f in d)delete a[f],a[f]=d[f]}}return b.call(this,a)}};return g});