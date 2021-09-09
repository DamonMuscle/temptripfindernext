/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{_ as r}from"../chunks/tslib.es6.js";import"../chunks/ArrayPool.js";import"../chunks/object.js";import"../chunks/deprecate.js";import{clone as o}from"../core/lang.js";import"../config.js";import"../chunks/Logger.js";import"../chunks/string.js";import"../chunks/metadata.js";import{property as s}from"../core/accessorSupport/decorators/property.js";import"../core/Accessor.js";import"../chunks/PropertyOrigin.js";import"../core/scheduling.js";import"../core/promiseUtils.js";import"../chunks/Message.js";import"../core/Error.js";import"../chunks/ensureType.js";import{subclass as t}from"../core/accessorSupport/decorators/subclass.js";import"../chunks/Evented.js";import e from"../core/Collection.js";import"../chunks/collectionUtils.js";import"../chunks/JSONSupport.js";import"../chunks/Promise.js";import"../chunks/Loadable.js";import"../core/urlUtils.js";import"../core/accessorSupport/decorators/cast.js";import"../chunks/jsonMap.js";import{e as i}from"../chunks/enumeration.js";import"../chunks/reader.js";import"../chunks/writer.js";import"../chunks/resourceExtension.js";import"../chunks/persistableUrlUtils.js";import"../geometry/SpatialReference.js";import"../chunks/locale.js";import"../chunks/number.js";import"../intl.js";import"../kernel.js";import"../request.js";import"../chunks/assets.js";import"../geometry/Geometry.js";import"../geometry/Point.js";import"../chunks/Ellipsoid.js";import"../geometry/support/webMercatorUtils.js";import"../geometry/Extent.js";import"../portal/PortalQueryParams.js";import"../portal/PortalQueryResult.js";import"../portal/PortalFolder.js";import"../portal/PortalGroup.js";import"../portal/PortalUser.js";import"../portal/Portal.js";import"../chunks/mathUtils2.js";import"../chunks/colorUtils.js";import"../Color.js";import"./Symbol.js";import"./Symbol3DLayer.js";import"../chunks/screenUtils.js";import"../chunks/opacityUtils.js";import"../chunks/materialUtils.js";import"./edges/Edges3D.js";import"./edges/SketchEdges3D.js";import"./edges/SolidEdges3D.js";import"../chunks/utils.js";import"../chunks/Symbol3DMaterial.js";import"./ExtrudeSymbol3DLayer.js";import"./patterns/StylePattern3D.js";import"./FillSymbol3DLayer.js";import"../chunks/colors.js";import"../chunks/Symbol3DOutline.js";import"./Font.js";import"./IconSymbol3DLayer.js";import m from"./LineSymbol3DLayer.js";import"./ObjectSymbol3DLayer.js";import p from"./PathSymbol3DLayer.js";import"./TextSymbol3DLayer.js";import"./WaterSymbol3DLayer.js";import l from"./Symbol3D.js";import"../chunks/Thumbnail.js";var n;const c=e.ofType({base:null,key:"type",typeMap:{line:m,path:p}}),a=e.ofType({base:null,key:"type",typeMap:{line:m,path:p}});let j=n=class extends l{constructor(r){super(r),this.symbolLayers=new c,this.type="line-3d"}clone(){return new n({styleOrigin:o(this.styleOrigin),symbolLayers:o(this.symbolLayers),thumbnail:o(this.thumbnail)})}static fromSimpleLineSymbol(r){return new n({symbolLayers:[m.fromSimpleLineSymbol(r)]})}};r([s({type:c,json:{type:a}})],j.prototype,"symbolLayers",void 0),r([i({LineSymbol3D:"line-3d"},{readOnly:!0})],j.prototype,"type",void 0),j=n=r([t("esri.symbols.LineSymbol3D")],j);var y=j;export default y;
