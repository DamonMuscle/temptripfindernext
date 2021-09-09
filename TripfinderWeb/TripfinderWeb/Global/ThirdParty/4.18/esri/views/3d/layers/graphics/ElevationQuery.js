// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../chunks/_rollupPluginBabelHelpers ../../../../core/maybe ../../../../core/arrayUtils ../../../../core/promiseUtils ../../../../geometry/Multipoint ../../../../geometry ../../../support/Scheduler".split(" "),function(n,r,p,t,g,u,q,v){q=function(){function k(a,c){this.spatialReference=a;this.view=c}var l=k.prototype;l.getElevation=function(a,c,d){return this.view.elevationProvider.getElevation(a,c,0,this.spatialReference,d)};l.queryElevation=async function(a,c,d,h,f){return this.view.elevationProvider.queryElevation(a,
c,0,this.spatialReference,f,d,h)};return k}();let x=function(){function k(a,c,d,h){this.spatialReference=c;this._getElevationQueryProvider=d;this._queries=[];this._queryOptions={...h,ignoreInvisibleLayers:!0};this._frameTask=a.registerTask(v.Task.ELEVATION_QUERY,()=>this._update(),()=>0<this._queries.length)}var l=k.prototype;l.destroy=function(){this._frameTask.remove()};l.queryElevation=function(a,c,d,h=0){return g.create((f,m)=>{const b={x:a,y:c,minDemResolution:h,result:{resolve:f,reject:m},signal:d};
this._queries.push(b);g.onAbort(d,()=>{t.remove(this._queries,b);m(g.createAbortError())})})};l._update=function(){const a=this._queries;this._queries=[];const c=this._getElevationQueryProvider();if(c){var d=a.map(b=>[b.x,b.y]),h=a.reduce((b,e)=>Math.min(b,e.minDemResolution),Infinity);d=new u({points:d,spatialReference:this.spatialReference});var f=1<a.length&&a.some(b=>!!b.signal)?g.createAbortController():null,m=p.isSome(f)?f.signal:a[0].signal;if(p.isSome(f)){let b=0;a.forEach(e=>g.onAbort(e.signal,
()=>{b++;e.result.reject(g.createAbortError());b===a.length&&f.abort()}))}c.queryElevation(d,{...this._queryOptions,minDemResolution:h,signal:m}).then(b=>{a.forEach((e,w)=>{p.isSome(e.signal)&&e.signal.aborted?e.result.reject(g.createAbortError()):e.result.resolve(b.geometry.points[w][2])})}).catch(b=>{a.forEach(e=>e.result.reject(b))})}else a.forEach(b=>b.result.reject())};r._createClass(k,[{key:"test",get:function(){const a=this;return{update:()=>0<a._queries.length&&a._update()}}}]);return k}();
n.ElevationQuery=x;n.ViewElevationProvider=q;Object.defineProperty(n,"__esModule",{value:!0})});