/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{_ as s}from"../chunks/tslib.es6.js";import"../chunks/ArrayPool.js";import"../chunks/object.js";import"../chunks/deprecate.js";import"../core/lang.js";import"../config.js";import{i as r}from"../chunks/Logger.js";import"../chunks/string.js";import"../chunks/metadata.js";import{property as o}from"../core/accessorSupport/decorators/property.js";import"../core/Accessor.js";import"../chunks/PropertyOrigin.js";import"../core/scheduling.js";import{resolve as t}from"../core/promiseUtils.js";import"../chunks/Message.js";import"../core/Error.js";import"../chunks/compilerUtils.js";import"../chunks/ensureType.js";import{subclass as e}from"../core/accessorSupport/decorators/subclass.js";import"../chunks/Evented.js";import i from"../core/Collection.js";import"../chunks/collectionUtils.js";import"../chunks/JSONSupport.js";import"../chunks/Promise.js";import"../chunks/Loadable.js";import{getFilename as p}from"../core/urlUtils.js";import"../core/accessorSupport/decorators/aliasOf.js";import"../core/accessorSupport/decorators/cast.js";import"../chunks/jsonMap.js";import"../chunks/enumeration.js";import{r as l}from"../chunks/reader.js";import{w as n}from"../chunks/writer.js";import"../chunks/resourceExtension.js";import"../chunks/persistableUrlUtils.js";import m from"../geometry/SpatialReference.js";import"../chunks/locale.js";import"../chunks/number.js";import"../intl.js";import"../kernel.js";import"../request.js";import"../chunks/assets.js";import"../geometry/Geometry.js";import"../geometry/Point.js";import"../chunks/Ellipsoid.js";import"../geometry/support/webMercatorUtils.js";import a from"../geometry/Extent.js";import"../portal/PortalQueryParams.js";import"../portal/PortalQueryResult.js";import"../portal/PortalFolder.js";import"../portal/PortalGroup.js";import"../portal/PortalUser.js";import"../portal/Portal.js";import"../portal/PortalItemResource.js";import"../portal/PortalRating.js";import"../portal/PortalItem.js";import"../chunks/mathUtils2.js";import"../chunks/colorUtils.js";import"../Color.js";import"../chunks/zmUtils.js";import"../geometry/Multipoint.js";import"../geometry/Polygon.js";import"../chunks/extentUtils.js";import"../geometry/Polyline.js";import"../chunks/typeUtils.js";import"../geometry/support/jsonUtils.js";import"../geometry.js";import"./support/CodedValueDomain.js";import"./support/Domain.js";import"./support/InheritedDomain.js";import"./support/RangeDomain.js";import"../chunks/domains.js";import"../chunks/arcadeOnDemand.js";import"./support/fieldUtils.js";import"../popup/content/Content.js";import"../popup/content/AttachmentsContent.js";import"../popup/content/CustomContent.js";import"../chunks/date.js";import"../popup/support/FieldInfoFormat.js";import"../popup/FieldInfo.js";import"../popup/content/FieldsContent.js";import"../chunks/MediaInfo.js";import"../popup/content/support/ChartMediaInfoValueSeries.js";import"../popup/content/support/ChartMediaInfoValue.js";import"../chunks/chartMediaInfoUtils.js";import"../popup/content/BarChartMediaInfo.js";import"../popup/content/ColumnChartMediaInfo.js";import"../popup/content/support/ImageMediaInfoValue.js";import"../popup/content/ImageMediaInfo.js";import"../popup/content/LineChartMediaInfo.js";import"../popup/content/PieChartMediaInfo.js";import"../popup/content/MediaContent.js";import"../popup/content/TextContent.js";import"../popup/content.js";import"../popup/ExpressionInfo.js";import"../popup/LayerOptions.js";import"../popup/support/RelatedRecordsInfoFieldOrder.js";import"../popup/RelatedRecordsInfo.js";import"../chunks/Identifiable.js";import"../support/actions/ActionBase.js";import"../support/actions/ActionButton.js";import"../support/actions/ActionToggle.js";import"../PopupTemplate.js";import"../symbols/Symbol.js";import"../symbols/CIMSymbol.js";import"../symbols/Symbol3DLayer.js";import"../chunks/screenUtils.js";import"../chunks/opacityUtils.js";import"../chunks/materialUtils.js";import"../symbols/edges/Edges3D.js";import"../symbols/edges/SketchEdges3D.js";import"../symbols/edges/SolidEdges3D.js";import"../chunks/utils.js";import"../chunks/Symbol3DMaterial.js";import"../symbols/ExtrudeSymbol3DLayer.js";import"../symbols/LineSymbol.js";import"../symbols/LineSymbolMarker.js";import"../symbols/SimpleLineSymbol.js";import"../symbols/FillSymbol.js";import"../symbols/patterns/StylePattern3D.js";import"../symbols/FillSymbol3DLayer.js";import"../chunks/colors.js";import"../chunks/Symbol3DOutline.js";import"../symbols/Font.js";import"../symbols/IconSymbol3DLayer.js";import"../symbols/LineSymbol3DLayer.js";import"../symbols/ObjectSymbol3DLayer.js";import"../symbols/PathSymbol3DLayer.js";import"../symbols/TextSymbol3DLayer.js";import"../symbols/WaterSymbol3DLayer.js";import"../symbols/Symbol3D.js";import"../chunks/Thumbnail.js";import"../symbols/callouts/Callout3D.js";import"../symbols/callouts/LineCallout3D.js";import"../chunks/Symbol3DVerticalOffset.js";import"../symbols/LabelSymbol3D.js";import"../symbols/LineSymbol3D.js";import"../symbols/MarkerSymbol.js";import"../symbols/MeshSymbol3D.js";import"../chunks/urlUtils.js";import"../symbols/PictureFillSymbol.js";import"../symbols/PictureMarkerSymbol.js";import"../symbols/PointSymbol3D.js";import"../symbols/PolygonSymbol3D.js";import"../symbols/SimpleFillSymbol.js";import"../symbols/SimpleMarkerSymbol.js";import"../symbols/TextSymbol.js";import"../symbols/WebStyleSymbol.js";import"../symbols/support/jsonUtils.js";import"../chunks/uid.js";import"../Graphic.js";import"../core/Handles.js";import{C as u}from"../chunks/CollectionFlattener.js";import j from"./Layer.js";import"../chunks/LegendOptions.js";import"../renderers/support/AuthoringInfo.js";import"../renderers/support/AuthoringInfoVisualVariable.js";import"../tasks/support/ColorRamp.js";import"../tasks/support/AlgorithmicColorRamp.js";import"../tasks/support/MultipartColorRamp.js";import"../chunks/colorRamps.js";import"../renderers/Renderer.js";import"../renderers/visualVariables/VisualVariable.js";import"../renderers/visualVariables/support/ColorStop.js";import"../renderers/visualVariables/ColorVariable.js";import"../renderers/visualVariables/support/OpacityStop.js";import"../renderers/visualVariables/OpacityVariable.js";import"../renderers/visualVariables/RotationVariable.js";import"../renderers/visualVariables/support/SizeStop.js";import"../renderers/visualVariables/SizeVariable.js";import"../chunks/sizeVariableUtils.js";import"../chunks/unitUtils.js";import"../chunks/lengthUtils.js";import"../chunks/visualVariableUtils.js";import"../chunks/VisualVariablesMixin.js";import"../renderers/support/ClassBreakInfo.js";import"../chunks/commonProperties.js";import"../renderers/ClassBreaksRenderer.js";import"../chunks/diffUtils.js";import"../renderers/support/UniqueValueInfo.js";import"../chunks/devEnvironmentUtils.js";import"../chunks/styleUtils.js";import"../renderers/UniqueValueRenderer.js";import"../chunks/MemCache.js";import"../chunks/LRUCache.js";import"../renderers/DictionaryRenderer.js";import"../renderers/support/AttributeColorInfo.js";import"../renderers/DotDensityRenderer.js";import"../renderers/support/HeatmapColorStop.js";import"../renderers/HeatmapRenderer.js";import"../renderers/SimpleRenderer.js";import"../renderers/support/jsonUtils.js";import"../chunks/timeUtils.js";import"../TimeExtent.js";import"../chunks/ReadOnlyMultiOriginJSONSupport.js";import{M as c}from"../chunks/MultiOriginJSONSupport.js";import"../core/watchUtils.js";import"../chunks/fieldType.js";import"../chunks/aaBoundingRect.js";import{O as y}from"../chunks/OperationalLayer.js";import"../chunks/ElevationInfo.js";import"../chunks/unitConversionUtils.js";import{u as h}from"../chunks/commonProperties2.js";import"./support/Field.js";import"../tasks/support/FeatureSet.js";import{B as d}from"../chunks/BlendLayer.js";import{P as b}from"../chunks/PortalLayer.js";import{R as k}from"../chunks/RefreshableLayer.js";import{S as f}from"../chunks/ScaleRangeLayer.js";import"../chunks/aaBoundingBox.js";import{s as S,f as g,p as v}from"../chunks/kmlUtils.js";import C from"./support/KMLSublayer.js";const L=["kml","xml"];let M=class extends(d(k(f(y(b(c(j))))))){constructor(...s){super(...s),this._visibleFolders=[],this.allSublayers=new u({root:this,rootCollectionNames:["sublayers"],getChildrenFunction:s=>s.sublayers}),this.outSpatialReference=m.WGS84,this.path=null,this.legendEnabled=!1,this.operationalLayerType="KML",this.sublayers=null,this.type="kml",this.url=null}initialize(){this.watch("sublayers",((s,r)=>{r&&r.forEach((s=>{s.parent=null,s.layer=null})),s&&s.forEach((s=>{s.parent=this,s.layer=this}))}),!0),this.on("sublayer-update",(()=>this.notifyChange("fullExtent")))}normalizeCtorArgs(s,r){return"string"==typeof s?{url:s,...r}:s}readSublayersFromItemOrWebMap(s,r){this._visibleFolders=r.visibleFolders}readSublayers(s,r,o){return S(C,r,o,this._visibleFolders)}writeSublayers(s,r){const o=[],t=s.toArray();for(;t.length;){const s=t[0];s.networkLink||(s.visible&&o.push(s.id),s.sublayers&&t.push(...s.sublayers.toArray())),t.shift()}r.visibleFolders=o}get title(){const s=this._get("title");return s&&"defaults"!==this.originOf("title")?s:this.url?p(this.url,L)||"KML":s||""}set title(s){this._set("title",s)}get visibleSublayers(){const s=this.sublayers,r=[],o=s=>{s.visible&&(r.push(s),s.sublayers&&s.sublayers.forEach(o))};return s&&s.forEach(o),r}get fullExtent(){return this._recomputeFullExtent()}load(s){const o=r(s)?s.signal:null;return this.addResolvingPromise(this.loadFromPortal({supportedTypes:["KML"]},s).then((()=>this._fetchService(o)))),t(this)}async _fetchService(s){const r=await t().then((()=>this.resourceInfo?{ssl:!1,data:this.resourceInfo}:g(this.url,this.outSpatialReference,this.refreshInterval,s))),o=v(r.data);o&&this.read(o,{origin:"service"})}_recomputeFullExtent(){let s=null;this.extent&&(s=this.extent.clone());const r=o=>{if(o.sublayers)for(const t of o.sublayers.items)r(t),t.visible&&t.fullExtent&&(s?s.union(t.fullExtent):s=t.fullExtent.clone())};return r(this),s}};s([o({readOnly:!0})],M.prototype,"allSublayers",void 0),s([o({type:m})],M.prototype,"outSpatialReference",void 0),s([o({type:String,json:{origins:{"web-scene":{read:!0,write:!0}},read:!1}})],M.prototype,"path",void 0),s([o({readOnly:!0,json:{read:!1,write:!1}})],M.prototype,"legendEnabled",void 0),s([o({type:["show","hide","hide-children"]})],M.prototype,"listMode",void 0),s([o({type:["KML"]})],M.prototype,"operationalLayerType",void 0),s([o({type:i.ofType(C),json:{write:{ignoreOrigin:!0}}})],M.prototype,"sublayers",void 0),s([l(["web-map","portal-item"],"sublayers",["visibleFolders"])],M.prototype,"readSublayersFromItemOrWebMap",null),s([l("service","sublayers",["sublayers"])],M.prototype,"readSublayers",null),s([n("sublayers")],M.prototype,"writeSublayers",null),s([o({readOnly:!0,json:{read:!1}})],M.prototype,"type",void 0),s([o({json:{origins:{"web-map":{read:{source:"title"}}},write:{ignoreOrigin:!0}},dependsOn:["url","parsedUrl"]})],M.prototype,"title",null),s([o(h)],M.prototype,"url",void 0),s([o({readOnly:!0,dependsOn:["sublayers"]})],M.prototype,"visibleSublayers",null),s([o({type:a})],M.prototype,"extent",void 0),s([o({dependsOn:["extent"]})],M.prototype,"fullExtent",null),M=s([e("esri.layers.KMLLayer")],M);var U=M;export default U;
