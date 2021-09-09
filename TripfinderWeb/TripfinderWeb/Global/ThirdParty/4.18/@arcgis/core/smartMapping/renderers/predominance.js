/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import"../../chunks/tslib.es6.js";import"../../chunks/ArrayPool.js";import"../../chunks/object.js";import"../../chunks/deprecate.js";import"../../core/lang.js";import"../../config.js";import{i as e}from"../../chunks/Logger.js";import"../../chunks/string.js";import"../../chunks/metadata.js";import"../../core/accessorSupport/decorators/property.js";import"../../core/Accessor.js";import"../../chunks/PropertyOrigin.js";import"../../core/scheduling.js";import{all as s}from"../../core/promiseUtils.js";import"../../chunks/Message.js";import r from"../../core/Error.js";import"../../chunks/compilerUtils.js";import"../../chunks/ensureType.js";import"../../core/accessorSupport/decorators/subclass.js";import"../../chunks/Evented.js";import"../../core/Collection.js";import"../../chunks/collectionUtils.js";import"../../chunks/JSONSupport.js";import"../../chunks/Promise.js";import"../../chunks/Loadable.js";import"../../chunks/asyncUtils.js";import"../../chunks/loadAll.js";import"../../core/urlUtils.js";import"../../core/accessorSupport/decorators/aliasOf.js";import"../../core/accessorSupport/decorators/cast.js";import"../../chunks/jsonMap.js";import"../../chunks/enumeration.js";import"../../chunks/reader.js";import"../../chunks/writer.js";import"../../chunks/resourceExtension.js";import"../../chunks/persistableUrlUtils.js";import"../../geometry/SpatialReference.js";import"../../chunks/locale.js";import"../../chunks/number.js";import{fetchMessageBundle as o}from"../../intl.js";import"../../kernel.js";import"../../request.js";import"../../chunks/assets.js";import"../../geometry/Geometry.js";import"../../geometry/Point.js";import"../../chunks/Ellipsoid.js";import"../../geometry/support/webMercatorUtils.js";import"../../geometry/Extent.js";import"../../portal/PortalQueryParams.js";import"../../portal/PortalQueryResult.js";import"../../portal/PortalFolder.js";import"../../portal/PortalGroup.js";import"../../portal/PortalUser.js";import"../../portal/Portal.js";import"../../portal/PortalItemResource.js";import"../../portal/PortalRating.js";import"../../portal/PortalItem.js";import"../../Basemap.js";import"../../chunks/writeUtils.js";import"../../chunks/mathUtils2.js";import"../../chunks/colorUtils.js";import"../../Color.js";import"../../chunks/zmUtils.js";import"../../geometry/Multipoint.js";import"../../geometry/Polygon.js";import"../../chunks/extentUtils.js";import"../../geometry/Polyline.js";import"../../chunks/typeUtils.js";import"../../geometry/support/jsonUtils.js";import"../../geometry.js";import"../../layers/support/CodedValueDomain.js";import"../../layers/support/Domain.js";import"../../layers/support/InheritedDomain.js";import"../../layers/support/RangeDomain.js";import"../../chunks/domains.js";import"../../chunks/arcadeOnDemand.js";import"../../layers/support/fieldUtils.js";import"../../popup/content/Content.js";import"../../popup/content/AttachmentsContent.js";import"../../popup/content/CustomContent.js";import"../../chunks/date.js";import"../../popup/support/FieldInfoFormat.js";import"../../popup/FieldInfo.js";import"../../popup/content/FieldsContent.js";import"../../chunks/MediaInfo.js";import"../../popup/content/support/ChartMediaInfoValueSeries.js";import"../../popup/content/support/ChartMediaInfoValue.js";import"../../chunks/chartMediaInfoUtils.js";import"../../popup/content/BarChartMediaInfo.js";import"../../popup/content/ColumnChartMediaInfo.js";import"../../popup/content/support/ImageMediaInfoValue.js";import"../../popup/content/ImageMediaInfo.js";import"../../popup/content/LineChartMediaInfo.js";import"../../popup/content/PieChartMediaInfo.js";import"../../popup/content/MediaContent.js";import"../../popup/content/TextContent.js";import"../../popup/content.js";import"../../popup/ExpressionInfo.js";import"../../popup/LayerOptions.js";import"../../popup/support/RelatedRecordsInfoFieldOrder.js";import"../../popup/RelatedRecordsInfo.js";import"../../chunks/Identifiable.js";import"../../support/actions/ActionBase.js";import"../../support/actions/ActionButton.js";import"../../support/actions/ActionToggle.js";import"../../PopupTemplate.js";import"../../symbols/Symbol.js";import"../../symbols/CIMSymbol.js";import"../../symbols/Symbol3DLayer.js";import"../../chunks/screenUtils.js";import"../../chunks/opacityUtils.js";import"../../chunks/materialUtils.js";import"../../symbols/edges/Edges3D.js";import"../../symbols/edges/SketchEdges3D.js";import"../../symbols/edges/SolidEdges3D.js";import"../../chunks/utils.js";import"../../chunks/Symbol3DMaterial.js";import"../../symbols/ExtrudeSymbol3DLayer.js";import"../../symbols/LineSymbol.js";import"../../symbols/LineSymbolMarker.js";import"../../symbols/SimpleLineSymbol.js";import"../../symbols/FillSymbol.js";import"../../symbols/patterns/StylePattern3D.js";import"../../symbols/FillSymbol3DLayer.js";import"../../chunks/colors.js";import"../../chunks/Symbol3DOutline.js";import"../../symbols/Font.js";import"../../symbols/IconSymbol3DLayer.js";import"../../symbols/LineSymbol3DLayer.js";import"../../symbols/ObjectSymbol3DLayer.js";import"../../symbols/PathSymbol3DLayer.js";import"../../symbols/TextSymbol3DLayer.js";import"../../symbols/WaterSymbol3DLayer.js";import"../../symbols/Symbol3D.js";import"../../chunks/Thumbnail.js";import"../../symbols/callouts/Callout3D.js";import"../../symbols/callouts/LineCallout3D.js";import"../../chunks/Symbol3DVerticalOffset.js";import"../../symbols/LabelSymbol3D.js";import"../../symbols/LineSymbol3D.js";import"../../symbols/MarkerSymbol.js";import"../../symbols/MeshSymbol3D.js";import"../../chunks/urlUtils.js";import"../../symbols/PictureFillSymbol.js";import"../../symbols/PictureMarkerSymbol.js";import"../../symbols/PointSymbol3D.js";import"../../symbols/PolygonSymbol3D.js";import"../../symbols/SimpleFillSymbol.js";import"../../symbols/SimpleMarkerSymbol.js";import"../../symbols/TextSymbol.js";import"../../symbols/WebStyleSymbol.js";import"../../symbols/support/jsonUtils.js";import"../../chunks/uid.js";import"../../Graphic.js";import"../../chunks/basemapUtils.js";import"../../renderers/PointCloudRenderer.js";import"../../chunks/PointSizeSplatAlgorithm.js";import"../../chunks/LegendOptions.js";import"../../renderers/PointCloudClassBreaksRenderer.js";import"../../renderers/PointCloudRGBRenderer.js";import"../../renderers/PointCloudStretchRenderer.js";import"../../renderers/PointCloudUniqueValueRenderer.js";import t from"../../renderers/support/AuthoringInfo.js";import i from"../../renderers/support/AuthoringInfoVisualVariable.js";import"../../tasks/support/ColorRamp.js";import"../../tasks/support/AlgorithmicColorRamp.js";import"../../tasks/support/MultipartColorRamp.js";import"../../chunks/colorRamps.js";import"../../renderers/Renderer.js";import"../../renderers/visualVariables/VisualVariable.js";import"../../renderers/visualVariables/support/ColorStop.js";import"../../renderers/visualVariables/ColorVariable.js";import"../../renderers/visualVariables/support/OpacityStop.js";import p from"../../renderers/visualVariables/OpacityVariable.js";import"../../renderers/visualVariables/RotationVariable.js";import"../../renderers/visualVariables/support/SizeStop.js";import"../../renderers/visualVariables/SizeVariable.js";import"../../chunks/sizeVariableUtils.js";import"../../chunks/unitUtils.js";import"../../chunks/lengthUtils.js";import"../../chunks/visualVariableUtils.js";import"../../chunks/VisualVariablesMixin.js";import"../../renderers/support/ClassBreakInfo.js";import"../../chunks/commonProperties.js";import"../../renderers/ClassBreaksRenderer.js";import"../../chunks/diffUtils.js";import"../../renderers/support/UniqueValueInfo.js";import"../../chunks/devEnvironmentUtils.js";import"../../chunks/styleUtils.js";import"../../renderers/UniqueValueRenderer.js";import"../../geometry/support/normalizeUtils.js";import"../../chunks/MemCache.js";import"../../chunks/LRUCache.js";import"../../renderers/DictionaryRenderer.js";import"../../renderers/support/AttributeColorInfo.js";import"../../renderers/DotDensityRenderer.js";import"../../renderers/support/HeatmapColorStop.js";import"../../renderers/HeatmapRenderer.js";import"../../renderers/SimpleRenderer.js";import"../../renderers/support/jsonUtils.js";import"../../chunks/timeUtils.js";import"../../TimeExtent.js";import"../../core/watchUtils.js";import"../../chunks/arcgisLayerUrl.js";import"../../chunks/fieldType.js";import"../../chunks/zscale.js";import"../../chunks/queryZScale.js";import"../../layers/support/Field.js";import"../../tasks/support/FeatureSet.js";import"../../chunks/DataLayerSource.js";import"../../tasks/support/AttachmentQuery.js";import"../../tasks/support/Query.js";import"../../tasks/support/StatisticDefinition.js";import"../../tasks/support/RelationshipQuery.js";import"../../chunks/ClassBreaksDefinition.js";import{c as a,g as n}from"../../chunks/layerUtils2.js";import"../../tasks/Task.js";import"../../chunks/OptimizedGeometry.js";import"../../chunks/featureConversionUtils.js";import"../../tasks/QueryTask.js";import"../../chunks/pbf.js";import"../../chunks/pbfQueryUtils.js";import"../../chunks/query.js";import"../../layers/support/AttachmentInfo.js";import"../../chunks/scaleUtils.js";import"../../chunks/spatialStatistics.js";import"../../chunks/utils5.js";import"../../chunks/quantizationUtils.js";import{i as l}from"../../chunks/predominanceUtils.js";import"../../chunks/heatmapUtils.js";import"../heuristics/scaleRange.js";import"../heuristics/sizeRange.js";import{r as m}from"../../chunks/numberUtils.js";import"../../chunks/utils7.js";import u from"../statistics/summaryStatistics.js";import"../statistics/support/ageUtils.js";import"../statistics/summaryStatisticsForAge.js";import"../../chunks/ageUnit.js";import{v as c,p as y,o as j,l as d,n as b,d as h}from"../../chunks/utils8.js";import"../statistics/classBreaks.js";import"../../views/support/colorUtils.js";import"../../chunks/colors2.js";import"../../chunks/symbologyUtils.js";import"../../chunks/utils9.js";import"../symbology/size.js";import{createVisualVariables as f}from"./size.js";import"../statistics/uniqueValues.js";import"../symbology/type.js";import{createRenderer as g}from"./type.js";import k from"../statistics/predominantCategories.js";import{cloneScheme as S,getSchemes as v}from"../symbology/predominance.js";async function w(w){const V=await async function(s){if(!(s&&s.layer&&s.view&&s.fields&&s.fields.length))throw new r("predominance-renderer:missing-parameters","'layer', 'view' and 'fields' parameters are required");if(s.fields.length<2)throw new r("predominance-renderer:invalid-parameters","Minimum 2 fields are required");if(s.fields.length>10)throw new r("predominance-renderer:invalid-parameters","Maximum 10 fields are supported");const o={...s};o.symbolType=o.symbolType||"2d",o.defaultSymbolEnabled=null==o.defaultSymbolEnabled||o.defaultSymbolEnabled,o.includeOpacityVariable=s.includeOpacityVariable||!1,o.includeSizeVariable=s.includeSizeVariable||!1,o.sortBy=null==o.sortBy?"count":o.sortBy;const t=[0,2,1,3],i=a(o.layer,t);if(o.layer=i,!i)throw new r("predominance-renderer:invalid-parameters","'layer' must be one of these types: "+n(t).join(", "));const p=e(o.signal)?{signal:o.signal}:null;await i.load(p);const l=i.geometryType,m=o.symbolType.indexOf("3d")>-1;if(o.outlineOptimizationEnabled="polygon"===l&&o.outlineOptimizationEnabled,o.includeSizeVariable||(o.sizeOptimizationEnabled=("point"===l||"multipoint"===l||"polyline"===l)&&o.sizeOptimizationEnabled),"mesh"===l)o.symbolType="3d-volumetric",o.colorMixMode=o.colorMixMode||"replace",o.edgesType=o.edgesType||"none",o.sizeOptimizationEnabled=!1;else{if(m&&("polyline"===l||"polygon"===l))throw new r("predominance-renderer:not-supported","3d symbols are not supported for polyline and polygon layers");if(o.symbolType.indexOf("3d-volumetric")>-1&&(!o.view||"3d"!==o.view.type))throw new r("predominance-renderer:invalid-parameters","'view' parameter should be an instance of SceneView when 'symbolType' parameter is '3d-volumetric' or '3d-volumetric-uniform'")}const u=o.fields.map((e=>e.name)),y=c(i,u,"predominance-renderer:invalid-parameters");if(y)throw y;return o}(w),U=V.layer,C=(await async function(s){let r=s.predominanceScheme,o=null,t=null;const i=await y(s.basemap,s.view);if(o=e(i.basemapId)?i.basemapId:null,t=e(i.basemapTheme)?i.basemapTheme:null,r)return{scheme:S(r),basemapId:o,basemapTheme:t};const p=v({basemap:o,basemapTheme:t,geometryType:s.geometryType,numColors:s.numColors,theme:s.theme,worldScale:s.worldScale,view:s.view});return p&&(r=p.primaryScheme,o=p.basemapId,t=p.basemapTheme),{scheme:r,basemapId:o,basemapTheme:t}}({basemap:V.basemap,geometryType:U.geometryType,numColors:V.fields.length,predominanceScheme:V.predominanceScheme,worldScale:V.symbolType.indexOf("3d-volumetric")>-1,view:V.view})).scheme,I=V.fields.map((e=>e.name)),z=l(U,I),M=async function(e,r,i,p){const a=await o("esri/smartMapping/t9n/smartMapping"),n=e.layer,l={layer:e.layer,view:e.view,signal:e.signal},[m,u]=await s([k({layer:n,fields:p,view:e.view,signal:e.signal}),e.outlineOptimizationEnabled?j(l):null]);let c=m;m&&m.predominantCategoryInfos||(c={predominantCategoryInfos:p.map((e=>({value:e,count:0})))});const y=u&&u.opacity,f=await g({layer:n,basemap:e.basemap,valueExpression:r.valueExpression,valueExpressionTitle:a.predominantCategory,numTypes:-1,defaultSymbolEnabled:e.defaultSymbolEnabled,sortBy:e.sortBy,typeScheme:i,statistics:{uniqueValueInfos:c.predominantCategoryInfos},legendOptions:e.legendOptions,outlineOptimizationEnabled:!1,sizeOptimizationEnabled:(!e.includeSizeVariable||!e.sizeOptimizationEnabled)&&e.sizeOptimizationEnabled,symbolType:e.symbolType,colorMixMode:e.colorMixMode,edgesType:e.edgesType,view:e.view,signal:e.signal}),{renderer:S,basemapId:v,basemapTheme:w,uniqueValueInfos:V,excludedUniqueValueInfos:U}=f,C=S.uniqueValueInfos,I={};for(const s of e.fields){const e=n.getField(s.name);I[e.name]=s.label||e&&e.alias||s.name}if(C.forEach(((e,s)=>{const r=I[e.value];e.label=r,V[s].label=r})),e.includeSizeVariable){let s=n.geometryType,r=null;if("polygon"===s){const o=i.sizeScheme,t=o.background;S.backgroundFillSymbol=d(s,{type:e.symbolType,color:t.color,outline:b(t,s,y)}),r=o.marker.size,s="point"}else r="polyline"===s?i.width:i.size;const o=h(i.colors,C.length);C.forEach(((t,p)=>{const a=d(s,{type:e.symbolType,color:o[p],size:r,outline:b(i,s,y),meshInfo:{colorMixMode:e.colorMixMode,edgesType:e.edgesType}});t.symbol=a,V[p].symbol=a.clone()}))}return u&&u.visualVariables&&u.visualVariables.length&&(S.visualVariables=u.visualVariables.map((e=>e.clone()))),S.authoringInfo=new t({type:"predominance",fields:[...p]}),{renderer:S,predominantCategoryInfos:V,excludedCategoryInfos:U,predominanceScheme:i,basemapId:v,basemapTheme:w}}(V,z.predominantCategory,C,I),T=V.includeSizeVariable?async function(e,s,r){const t=await o("esri/smartMapping/t9n/smartMapping");return f({layer:e.layer,basemap:e.basemap,valueExpression:s.valueExpression,sqlExpression:s.statisticsQuery.sqlExpression,sqlWhere:s.statisticsQuery.sqlWhere,sizeScheme:r,sizeOptimizationEnabled:e.sizeOptimizationEnabled,worldScale:e.symbolType.indexOf("3d-volumetric")>-1,legendOptions:{title:t.sumOfCategories},view:e.view,signal:e.signal})}(V,z.size,C.sizeScheme):null,E=V.includeOpacityVariable?async function(e,s){const r=await o("esri/smartMapping/t9n/smartMapping"),a=await u({layer:e.layer,valueExpression:s.valueExpression,sqlExpression:s.statisticsQuery.sqlExpression,sqlWhere:s.statisticsQuery.sqlWhere,view:e.view,signal:e.signal}),n=null==a.avg||null==a.stddev,l=1/e.fields.length*100;let c=n?100:a.avg+1.285*a.stddev;c>100&&(c=100);const y=m([l,c],{strictBounds:!0}),j=new p({valueExpression:s.valueExpression,stops:[{value:y[0],opacity:.15},{value:y[1],opacity:1}],legendOptions:{title:r.strengthOfPredominance}}),d=new i({type:"opacity",minSliderValue:a.min,maxSliderValue:a.max});return{visualVariable:j,statistics:a,defaultValuesUsed:n,authoringInfo:new t({visualVariables:[d]})}}(V,z.opacity):null,[x,O,D]=await s([M,T,E]),P=[],R=[];if(O&&(Array.prototype.push.apply(P,O.visualVariables.map((e=>e.clone()))),delete O.sizeScheme,x.size=O,Array.prototype.push.apply(R,O.authoringInfo.visualVariables.map((e=>e.clone())))),D&&(P.push(D.visualVariable.clone()),x.opacity=D,Array.prototype.push.apply(R,D.authoringInfo.visualVariables.map((e=>e.clone())))),P.length){const e=x.renderer.visualVariables||[];Array.prototype.push.apply(e,P),x.renderer.visualVariables=e,x.renderer.authoringInfo.visualVariables=R}return x}export{w as createRenderer};
