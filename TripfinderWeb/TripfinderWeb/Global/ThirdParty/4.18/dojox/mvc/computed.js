//>>built
define(["dojo/_base/array","dojo/_base/lang","dojo/has"],function(k,p,v){function w(b,a,e){var d;b&&p.isFunction(b.watch)?d=b.watch(a,function(f,q,c){y(q,c)||e(c,q)}):console.log("Attempt to observe non-stateful "+b+" with "+a+". Observation not happening.");return{remove:function(){d&&d.remove()}}}function l(b){return k.map(b,function(a){return a.each?k.map(a.target,function(e){return e.get?e.get(a.targetProp):e[a.targetProp]}):a.target.get?a.target.get(a.targetProp):a.target[a.targetProp]})}function u(b){for(var a=
null;a=b.shift();)a.remove()}v.add("object-is-api",p.isFunction(Object.is));var r=Array.prototype,y=v("object-is-api")?Object.is:function(b,a){return b===a&&(0!==b||1/b===1/a)||b!==b&&a!==a};return function(b,a,e){function d(c){try{var m=e.apply(b,c);var t=!0}catch(g){console.error("Error during computed property callback: "+(g&&g.stack||g))}t&&(p.isFunction(b.set)?b.set(a,m):b[a]=m)}if(null==b)throw Error("Computed property cannot be applied to null.");if("*"===a)throw Error("Wildcard property cannot be used for computed properties.");
var f=r.slice.call(arguments,3),q=k.map(f,function(c,m){function t(n){return w(n,c.targetProp,function(){d(l(f))})}if("*"===c.targetProp)throw Error("Wildcard property cannot be used for computed properties.");if(c.each){var g,x=k.map(c.target,t);c.target&&p.isFunction(c.target.watchElements)?g=c.target.watchElements(function(n,h,z){u(r.splice.apply(x,[n,h.length].concat(k.map(z,t))));d(l(f))}):console.log("Attempt to observe non-stateful-array "+c.target+". Observation not happening.");return{remove:function(){g&&
g.remove();u(x)}}}return w(c.target,c.targetProp,function(n){var h=[];r.push.apply(h,l(f.slice(0,m)));h.push(n);r.push.apply(h,l(f.slice(m+1)));d(h)})});d(l(f));return{remove:function(){u(q)}}}});