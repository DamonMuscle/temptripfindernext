// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
require({cache:{"esri/renderers/support/heatmapUtils":function(){define(["exports","../../core/global","../../core/mathUtils"],function(n,v,p){function y(a,b,d,h,g){a=new Uint32Array(a*a);b="buffer"in b?b:new Float64Array(b);d="buffer"in d?new Uint32Array(d.buffer):new Uint32Array((new Uint8Array(d)).buffer);g=d.length/(g-h);for(let k=0;k<b.length;k++)a[k]=d[p.clamp(Math.floor((b[k]-h)*g),0,d.length-1)];return a.buffer}function z(a){const b=Math.round(3*a),d=2*a*a,h=new Float64Array(2*b+1);for(let g=
0;g<=h.length;g++)h[g]=Math.exp(-Math.pow(g-b,2)/d)/Math.sqrt(2*Math.PI)*(a/2);return h}function x(a,b){return"function"===typeof a?a:a?"string"===typeof b?d=>-1*+d[a]:d=>+d[a]+b:()=>1}function F(a,b){return null!=a?"string"===typeof b?d=>-1*+d.readAttribute(a):d=>+d.readAttribute(a)+b:d=>1}const D=(()=>{if(!("document"in v))return()=>null;const a=document.createElement("canvas"),b=a.getContext("2d");a.height=512;a.width=1;return d=>{b.clearRect(0,0,1,a.height);const h=b.createLinearGradient(0,0,
0,a.height);for(const {ratio:g,color:k}of d.colorStops)h.addColorStop(Math.max(g,.001),`rgba(${k[0]}, ${k[1]}, ${k[2]}, ${k[3]})`);b.fillStyle=h;b.fillRect(0,0,1,a.height);return b.getImageData(0,0,1,a.height).data}})();n.calculateHeatmapIntensityInfo=function(a,b,d,h){const {blurRadius:g,fieldOffset:k,field:l}=b;b=new Float64Array(d*h);const f=z(g),m=Math.round(3*g);let w=Number.NEGATIVE_INFINITY;const q=x(l,k);for(const {geometry:e,attributes:t}of a){a=e.x-m;const u=e.y-m,r=Math.max(0,a);var c=
Math.max(0,u);const G=Math.min(h,e.y+m),H=Math.min(d,e.x+m),I=+q(t);for(let A=c;A<G;A++){const B=f[A-u];for(let C=r;C<H;C++)c=b[A*d+C]+=B*f[C-a]*I,c>w&&(w=c)}}return{matrix:b.buffer,max:w}};n.calculateHeatmapIntensityInfoReaders=function(a,b,d,h){const {blurRadius:g,fieldOffset:k,field:l}=b;b=new Float64Array(d*h);const f=z(g),m=Math.round(3*g);let w=Number.NEGATIVE_INFINITY;const q=F(l,k),c=new Set;for(const r of a)for(a=r.getCursor();a.next();){var e=a.getObjectId();if(c.has(e))continue;c.add(e);
var t=a.readLegacyPointGeometry();e=+q(a);const G=t.x-m,H=t.y-m,I=Math.max(0,G);var u=Math.max(0,H);const A=Math.min(h,t.y+m);t=Math.min(d,t.x+m);for(let B=u;B<A;B++){const C=f[B-H];for(let E=I;E<t;E++)u=b[B*d+E]+=C*f[E-G]*e,u>w&&(w=u)}}return{matrix:b.buffer,max:w}};n.createHeatmapImageData=y;n.createKernel=z;n.createValueFunction=x;n.createValueFunctionCursor=F;n.drawHeatmap=function(a,b,d,h,g,k){a.canvas.width=a.canvas.height=b;a.clearRect(0,0,b,b);const l=a.getImageData(0,0,b,b);d&&h&&l.data.set(new Uint8ClampedArray(y(b,
d,h,g,k)));a.putImageData(l,0,0)};n.generateGradient=D;Object.defineProperty(n,"__esModule",{value:!0})})},"esri/views/2d/layers/features/tileRenderers/BaseTileRenderer":function(){define("../../../../../chunks/_rollupPluginBabelHelpers ../../../../../chunks/tslib.es6 ../../../../../core/has ../../../../../core/Logger ../../../../../core/accessorSupport/ensureType ../../../../../core/accessorSupport/decorators/property ../../../../../core/jsonMap ../../../../../core/accessorSupport/decorators/subclass ../../../../../core/urlUtils ../../../../../core/uuid ../../../../../portal/support/resourceExtension ../../../../../core/HandleOwner".split(" "),
function(n,v,p,y,z,x,F,D,a,b,d,h){p=function(g){function k(f){f=g.call(this,f)||this;f.tiles=new Map;return f}n._inheritsLoose(k,g);var l=k.prototype;l.destroy=function(){this.tiles.clear();this.layer=this.layerView=this.tileInfoView=this.tiles=null};l.acquireTile=function(f){const m=this.createTile(f);m.once("isReady",()=>this.notifyChange("updating"));this.tiles.set(f.id,m);return m};l.forceAttributeTextureUpload=function(){};l.forEachTile=function(f){this.tiles.forEach(f)};l.releaseTile=function(f){this.tiles.delete(f.key.id);
this.disposeTile(f)};l.isUpdating=function(){let f=!0;this.tiles.forEach(m=>{f=f&&m.isReady});return!f};l.setHighlight=function(){};l.invalidateLabels=function(){};l.requestUpdate=function(){this.layerView.requestUpdate()};n._createClass(k,[{key:"updating",get:function(){return this.isUpdating()}}]);return k}(h.HandleOwner);v.__decorate([x.property()],p.prototype,"layer",void 0);v.__decorate([x.property()],p.prototype,"layerView",void 0);v.__decorate([x.property()],p.prototype,"tileInfoView",void 0);
v.__decorate([x.property()],p.prototype,"updating",null);return p=v.__decorate([D.subclass("esri.views.2d.layers.features.tileRenderers.BaseTileRenderer")],p)})},"esri/views/2d/layers/features/tileRenderers/support/HeatmapSource":function(){define(["exports","../../../../../../renderers/support/heatmapUtils"],function(n,v){let p=function(){function y(){this.gradient=null;this.width=this.height=512}y.prototype.render=function(z){v.drawHeatmap(z,512,this.intensities,this.gradient,this.minPixelIntensity,
this.maxPixelIntensity)};return y}();n.HeatmapSource=p;Object.defineProperty(n,"__esModule",{value:!0})})},"*noref":1}});
define("../../../../../chunks/_rollupPluginBabelHelpers ../../../../../chunks/tslib.es6 ../../../../../core/has ../../../../../core/Logger ../../../../../core/accessorSupport/ensureType ../../../../../core/accessorSupport/decorators/property ../../../../../core/jsonMap ../../../../../core/accessorSupport/decorators/subclass ../../../../../core/urlUtils ../../../../../core/uuid ../../../../../portal/support/resourceExtension ../../../../../core/promiseUtils ../../../../../renderers/support/heatmapUtils ../../../engine/BitmapTileContainer ./BaseTileRenderer ./support/HeatmapSource".split(" "),function(n,
v,p,y,z,x,F,D,a,b,d,h,g,k,l,f){p=function(m){function w(c){var e=m.call(this,c)||this;e._intensityInfo={minPixelIntensity:0,maxPixelIntensity:0};e.featuresView={attributeView:{initialize:()=>{},requestUpdate:()=>{}},requestRender:()=>{}};e._container=new k.BitmapTileContainer(c.tileInfoView);return e}n._inheritsLoose(w,m);var q=w.prototype;q.createTile=function(c){const e=this._container.createTile(c);this.tileInfoView.getTileCoords(e.bitmap,c);e.bitmap.resolution=this.tileInfoView.getTileResolution(c);
return e};q.onConfigUpdate=function(){const c=this.layer.renderer;if("heatmap"===c.type){const {minPixelIntensity:e,maxPixelIntensity:t}=c;this._intensityInfo.minPixelIntensity=e;this._intensityInfo.maxPixelIntensity=t;this._gradient=g.generateGradient(c.toJSON());this.tiles.forEach(u=>{const r=u.bitmap.source;r&&(r.minPixelIntensity=e,r.maxPixelIntensity=t,r.gradient=this._gradient,u.bitmap.invalidateTexture())})}};q.hitTest=function(){return h.resolve([])};q.install=function(c){c.addChild(this._container)};
q.uninstall=function(c){this._container.removeAllChildren();c.removeChild(this._container)};q.disposeTile=function(c){this._container.removeChild(c);c.destroy()};q.supportsRenderer=function(c){return c&&"heatmap"===c.type};q.onTileData=function(c){const e=this.tiles.get(c.tileKey);if(e){c=c.intensityInfo;var {minPixelIntensity:t,maxPixelIntensity:u}=this._intensityInfo,r=e.bitmap.source||new f.HeatmapSource;r.intensities=c&&c.matrix||null;r.minPixelIntensity=t;r.maxPixelIntensity=u;r.gradient=this._gradient;
e.bitmap.source=r;this._container.addChild(e);this.requestUpdate()}};q.onTileError=function(c){console.error(c)};q.lockGPUUploads=function(){};q.unlockGPUUploads=function(){};return w}(l);return p=v.__decorate([D.subclass("esri.views.2d.layers.features.tileRenderers.HeatmapTileRenderer")],p)});