// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../chunks/_rollupPluginBabelHelpers ../chunks/tslib.es6 ../core/has ../core/Logger ../core/accessorSupport/ensureType ../core/accessorSupport/decorators/property ../core/jsonMap ../core/accessorSupport/decorators/subclass ../core/Error ../core/urlUtils ../core/uuid ../portal/support/resourceExtension ../core/promiseUtils ../core/scheduling ./Layer ../core/MultiOriginJSONSupport ./mixins/PortalLayer".split(" "),function(m,c,b,w,x,d,y,n,p,z,A,B,q,r,t,u,v){b=function(e){function f(a){a=e.call(this,
a)||this;a.resourceInfo=null;a.type="unknown";return a}m._inheritsLoose(f,e);var g=f.prototype;g.initialize=function(){this.addResolvingPromise(q.create((a,h)=>{r.schedule(()=>{const k=this.resourceInfo&&(this.resourceInfo.layerType||this.resourceInfo.type);let l="Unknown layer type";k&&(l+=" "+k);h(new p("layer:unknown-layer-type",l,{layerType:k}))})}))};g.read=function(a,h){e.prototype.read.call(this,{resourceInfo:a},h)};g.write=function(){return null};return f}(v.PortalLayer(u.MultiOriginJSONMixin(t)));
c.__decorate([d.property({readOnly:!0})],b.prototype,"resourceInfo",void 0);c.__decorate([d.property({type:["show","hide"]})],b.prototype,"listMode",void 0);c.__decorate([d.property({json:{read:!1},readOnly:!0,value:"unknown"})],b.prototype,"type",void 0);return b=c.__decorate([n.subclass("esri.layers.UnknownLayer")],b)});