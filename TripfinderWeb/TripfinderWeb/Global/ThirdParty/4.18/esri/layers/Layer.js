// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("require ../chunks/_rollupPluginBabelHelpers ../chunks/tslib.es6 ../core/has ../config ../core/Logger ../core/accessorSupport/ensureType ../core/accessorSupport/decorators/property ../core/jsonMap ../core/accessorSupport/decorators/subclass ../core/Error ../core/urlUtils ../core/uuid ../portal/support/resourceExtension ../geometry/SpatialReference ../geometry/Extent ../geometry ../core/Evented ../core/Identifiable ../request ../core/Loadable".split(" "),function(m,n,c,b,u,p,D,d,E,v,w,x,F,G,
h,q,H,y,z,A,B){let C=0;const r=p.getLogger("esri.layers.Layer");b=function(t){function f(){var a=t.apply(this,arguments)||this;a.attributionDataUrl=null;a.fullExtent=new q(-180,-90,180,90,h.WGS84);a.id=Date.now().toString(16)+"-layer-"+C++;a.legendEnabled=!0;a.listMode="show";a.opacity=1;a.parent=null;a.popupEnabled=!0;a.attributionVisible=!0;a.spatialReference=h.WGS84;a.title=null;a.type=null;a.url=null;a.visible=!0;return a}n._inheritsLoose(f,t);f.fromArcGISServerUrl=async function(a){a="string"===
typeof a?{url:a}:a;const g=await new Promise(function(e,k){m(["./support/arcgisLayers"],e,k)});try{return await g.fromUrl(a)}catch(e){throw r.error("#fromArcGISServerUrl({ url: '"+a.url+"'})","Failed to create layer from arcgis server url",e),e;}};f.fromPortalItem=async function(a){a="portalItem"in a?a:{portalItem:a};const g=await new Promise(function(e,k){m(["../portal/support/portalLayers"],e,k)});try{return await g.fromItem(a)}catch(e){throw a=a&&a.portalItem,r.error("#fromPortalItem()","Failed to create layer from portal item (portal: '"+
(a&&a.portal&&a.portal.url||u.portalUrl)+"', id: '"+(a&&a.id||"unset")+"')",e),e;}};var l=f.prototype;l.initialize=function(){this.when().catch(a=>{var g,e;p.getLogger(this.declaredClass).error("#load()",`Failed to load layer (title: '${null!=(g=this.title)?g:"no title"}', id: '${null!=(e=this.id)?e:"no id"}')`,{error:a})})};l.destroy=function(){if(this.parent){const a=this.parent;"layers"in a&&a.layers.includes(this)?a.layers.remove(this):"tables"in a&&a.tables.includes(this)?a.tables.remove(this):
"baseLayers"in a&&a.baseLayers.includes(this)?a.baseLayers.remove(this):"baseLayers"in a&&a.referenceLayers.includes(this)&&a.referenceLayers.remove(this)}};l.fetchAttributionData=async function(){const a=this.attributionDataUrl;if(this.hasAttributionData&&a)return(await A(a,{query:{f:"json"},responseType:"json"})).data;throw new w("layer:no-attribution-data","Layer does not have attribution data");};n._createClass(f,[{key:"hasAttributionData",get:function(){return null!=this.attributionDataUrl}},
{key:"parsedUrl",get:function(){const a=this.url;return a?x.urlToObject(a):null}}]);return f}(y.EventedMixin(z.IdentifiableMixin(B)));c.__decorate([d.property({type:String})],b.prototype,"attributionDataUrl",void 0);c.__decorate([d.property({type:q})],b.prototype,"fullExtent",void 0);c.__decorate([d.property({readOnly:!0,dependsOn:["attributionDataUrl"]})],b.prototype,"hasAttributionData",null);c.__decorate([d.property({type:String})],b.prototype,"id",void 0);c.__decorate([d.property({type:Boolean,
nonNullable:!0})],b.prototype,"legendEnabled",void 0);c.__decorate([d.property({type:["show","hide","hide-children"]})],b.prototype,"listMode",void 0);c.__decorate([d.property({type:Number,range:{min:0,max:1},nonNullable:!0})],b.prototype,"opacity",void 0);c.__decorate([d.property()],b.prototype,"parent",void 0);c.__decorate([d.property({readOnly:!0,dependsOn:["url"]})],b.prototype,"parsedUrl",null);c.__decorate([d.property({type:Boolean})],b.prototype,"popupEnabled",void 0);c.__decorate([d.property({type:Boolean})],
b.prototype,"attributionVisible",void 0);c.__decorate([d.property({type:h})],b.prototype,"spatialReference",void 0);c.__decorate([d.property({type:String})],b.prototype,"title",void 0);c.__decorate([d.property({type:String,readOnly:!0,json:{read:!1}})],b.prototype,"type",void 0);c.__decorate([d.property()],b.prototype,"url",void 0);c.__decorate([d.property({type:Boolean,nonNullable:!0})],b.prototype,"visible",void 0);return b=c.__decorate([v.subclass("esri.layers.Layer")],b)});