// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/maybe ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/Error ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../../../core/promiseUtils ../../../geometry/projection ../../layers/RefreshableLayerView ./LayerView3D ./TiledLayerView3D ../../layers/LayerView ../../support/drapedUtils ../../layers/TileLayerView".split(" "),
function(k,c,b,g,y,z,d,A,m,n,B,C,D,p,q,r,t,u,v,w,x){b=function(l){function e(){return l.apply(this,arguments)||this}k._inheritsLoose(e,l);var h=e.prototype;h.initialize=function(){if("web-tile"===this.layer.type){var a=this.layer.get("fullExtent.spatialReference");const f=this.layer.get("tileInfo.spatialReference");if(g.isNone(a)||g.isNone(f)||!q.canProjectWithoutEngine(a,f))a="defaults"===this.layer.originOf("fullExtent")||g.isNone(this.layer.fullExtent)?"SceneView requires fullExtent to be specified by the user on WebTileLayer":
"SceneView requires fullExtent to be specified in the same spatial reference as tileInfo on WebTileLayer",this.addResolvingPromise(p.reject(new n("layerview:incompatible-fullextent",a)))}this._addTilingSchemeMatchPromise()};h.createFetchPopupFeaturesQueryGeometry=function(a,f){return w.createQueryGeometry(a,f,this.view)};h.doRefresh=async function(a){this.suspended||this.emit("data-changed")};k._createClass(e,[{key:"imageFormatIsOpaque",get:function(){return"jpg"===this.layer.tileInfo.format}},{key:"hasMixedImageFormats",
get:function(){return"mixed"===this.layer.tileInfo.format}},{key:"dataLevelRange",get:function(){if(this.tileInfo){const a=this.tileInfo.lods;return this.levelRangeFromScaleRange(a[0].scale,a[a.length-1].scale)}return{minLevel:0,maxLevel:0}}}]);return e}(r.RefreshableLayerView(u.TiledLayerView3D(x.TileLayerView(t.LayerView3D(v)))));c.__decorate([d.property({readOnly:!0,dependsOn:["layer.tileInfo.format"]})],b.prototype,"imageFormatIsOpaque",null);c.__decorate([d.property({readOnly:!0,dependsOn:["layer.tileInfo.format"]})],
b.prototype,"hasMixedImageFormats",null);c.__decorate([d.property({aliasOf:"layer.fullExtent"})],b.prototype,"fullExtent",void 0);c.__decorate([d.property()],b.prototype,"layer",void 0);c.__decorate([d.property({aliasOf:"layer.tileInfo"})],b.prototype,"tileInfo",void 0);c.__decorate([d.property({readOnly:!0,dependsOn:["tileInfo","view.basemapTerrain.tilingScheme","layer.url"]})],b.prototype,"dataLevelRange",null);return b=c.__decorate([m.subclass("esri.views.3d.layers.TileLayerView3D")],b)});