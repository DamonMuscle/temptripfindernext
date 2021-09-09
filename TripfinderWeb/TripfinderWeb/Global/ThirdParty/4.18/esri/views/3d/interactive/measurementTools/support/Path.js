// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../../../chunks/_rollupPluginBabelHelpers ../../../../../chunks/tslib.es6 ../../../../../core/has ../../../../../core/Logger ../../../../../core/accessorSupport/ensureType ../../../../../core/accessorSupport/decorators/property ../../../../../core/jsonMap ../../../../../core/accessorSupport/decorators/subclass ../../../../../core/urlUtils ../../../../../core/uuid ../../../../../portal/support/resourceExtension ../../../../../core/Accessor ../../../../../geometry/Polygon ../../../../../core/Evented ../../../../../core/Collection".split(" "),
function(k,f,c,t,u,g,v,m,w,x,y,n,p,q,r){c=function(l){function h(){var a=l.apply(this,arguments)||this;a.vertices=new r;return a}k._inheritsLoose(h,l);var d=h.prototype;d.clear=function(){this.vertices.removeAll();this.emit("cleared",{});this._notifyFrontBack()};d.vertex=function(a){return this.vertices.items[a]};d.add=function(a){this.vertices.add(a);a=this.vertices.length-1;this._notifyFrontBack();this.emit("vertex-added",{index:a});return a};d.remove=function(a){this.vertices.removeAt(a);this._notifyFrontBack();
this.emit("vertex-removed",{index:a})};d.update=function(a,b){null!=b&&(this.vertices.splice(a,1,b),this._notifyFrontBack());this.emit("vertex-updated",{index:a})};d._notifyFrontBack=function(){this.notifyChange("front");this.notifyChange("back")};d.toPolygon=function(){const a=[];if(0===this.vertices.length)return null;this.vertices.forEach(e=>{a.push(e.hasZ?[e.x,e.y,e.z]:[e.x,e.y])});const b=this.vertices.getItemAt(0);a.push(b.hasZ?[b.x,b.y,b.z]:[b.x,b.y]);return new p({rings:[a],spatialReference:b.spatialReference})};
k._createClass(h,[{key:"front",get:function(){return this.vertices.items[0]||null}},{key:"back",get:function(){return this.vertices.items[this.vertices.length-1]||null}}]);return h}(q.EventedMixin(n));f.__decorate([g.property({readOnly:!0})],c.prototype,"vertices",void 0);f.__decorate([g.property({aliasOf:"vertices.length"})],c.prototype,"length",void 0);f.__decorate([g.property({readOnly:!0})],c.prototype,"front",null);f.__decorate([g.property({readOnly:!0})],c.prototype,"back",null);return c=f.__decorate([m.subclass("esri.views.3d.interactive.measurementTools.support.Path")],
c)});