// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../../../layers/support/ExportImageParameters ../../support/drapedUtils ../../layers/MapImageLayerView ./DynamicLayerView3D".split(" "),function(f,
g,c,q,r,t,u,h,v,w,x,k,l,m,n){c=function(e){function d(){var a=e.apply(this,arguments)||this;a.updateWhenStationary=!0;return a}f._inheritsLoose(d,e);var b=d.prototype;b.initialize=function(){this.imageParameters=new k.ExportImageParameters({view:this.view,layer:this.layer});this.updatingHandles.add(this.imageParameters,"version",()=>{this.updatingHandles.addPromise(this.refreshDebounced())})};b.destroy=function(){this.imageParameters&&(this.imageParameters.destroy(),this.imageParameters=null)};b.createFetchPopupFeaturesQueryGeometry=
function(a,p){return l.createQueryGeometry(a,p,this.view)};b.getFetchOptions=function(){return{timeExtent:this.imageParameters.timeExtent,timestamp:this.refreshTimestamp}};return d}(m.MapImageLayerView(n));return c=g.__decorate([h.subclass("esri.views.3d.layers.MapImageLayerView3D")],c)});