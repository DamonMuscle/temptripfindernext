/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{_ as e}from"../../chunks/tslib.es6.js";import"../../chunks/ArrayPool.js";import"../../chunks/object.js";import"../../chunks/deprecate.js";import"../../core/lang.js";import"../../config.js";import"../../chunks/Logger.js";import"../../chunks/string.js";import"../../chunks/metadata.js";import{property as t}from"../../core/accessorSupport/decorators/property.js";import"../../core/Accessor.js";import"../../chunks/PropertyOrigin.js";import"../../core/scheduling.js";import"../../core/promiseUtils.js";import"../../chunks/Message.js";import"../../core/Error.js";import"../../chunks/ensureType.js";import{subclass as r}from"../../core/accessorSupport/decorators/subclass.js";import{a as o}from"../../chunks/JSONSupport.js";import"../../core/urlUtils.js";import"../../core/accessorSupport/decorators/cast.js";import{J as i}from"../../chunks/jsonMap.js";import{r as s}from"../../chunks/reader.js";import{w as n}from"../../chunks/writer.js";import"../../chunks/resourceExtension.js";import p from"../../geometry/SpatialReference.js";import"../../geometry/Geometry.js";import"../../geometry/Point.js";import"../../chunks/Ellipsoid.js";import"../../geometry/support/webMercatorUtils.js";import"../../geometry/Extent.js";import"../../chunks/zmUtils.js";import"../../geometry/Multipoint.js";import"../../geometry/Polygon.js";import"../../chunks/extentUtils.js";import"../../geometry/Polyline.js";import"../../chunks/typeUtils.js";import"../../geometry/support/jsonUtils.js";import"../../geometry.js";const a=new i({esriNAOutputLineNone:"none",esriNAOutputLineStraight:"straight",esriNAOutputLineTrueShape:"true-shape",esriNAOutputLineTrueShapeWithMeasure:"true-shape-with-measure"}),l=new i({esriNAOutputPolygonNone:"none",esriNAOutputPolygonSimplified:"simplified",esriNAOutputPolygonDetailed:"detailed"}),u=new i({esriNFSBAllowBacktrack:"allow-backtrack",esriNFSBAtDeadEndsOnly:"at-dead-ends-only",esriNFSBNoBacktrack:"no-backtrack",esriNFSBAtDeadEndsAndIntersections:"at-dead-ends-and-intersections"}),y=new i({esriNATravelDirectionFromFacility:"from-facility",esriNATravelDirectionToFacility:"to-facility"}),m=new i({esriCentimeters:"centimeters",esriDecimalDegrees:"decimal-degrees",esriDecimeters:"decimeters",esriFeet:"feet",esriInches:"inches",esriKilometers:"kilometers",esriMeters:"meters",esriMiles:"miles",esriMillimeters:"millimeters",esriNauticalMiles:"nautical-miles",esriPoints:"points",esriYards:"yards"});let c=class extends o{constructor(e){super(e),this.accumulateAttributes=null,this.attributeParameterValues=null,this.defaultBreaks=null,this.doNotLocateOnRestrictedElements=!0,this.excludeSourcesFromPolygons=null,this.facilities=null,this.impedanceAttribute=null,this.mergeSimilarPolygonRanges=!1,this.outputGeometryPrecision=null,this.outputGeometryPrecisionUnits=null,this.outputLines=null,this.outputPolygons=null,this.outSpatialReference=null,this.overlapLines=!1,this.overlapPolygons=!1,this.pointBarriers=null,this.polygonBarriers=null,this.polylineBarriers=null,this.restrictionAttributes=null,this.restrictUTurns=null,this.returnFacilities=!1,this.returnPointBarriers=!1,this.returnPolygonBarriers=!1,this.returnPolylineBarriers=!1,this.splitLinesAtBreaks=!1,this.splitPolygonsAtBreaks=!1,this.timeOfDay=null,this.travelDirection=null,this.travelMode=null,this.trimOuterPolygon=!1,this.trimPolygonDistance=null,this.trimPolygonDistanceUnits=null,this.useHierarchy=null}readTimeOfDay(e,t){return null!=t.timeOfDay?new Date(t.timeOfDay):null}writeTimeOfDay(e,t){t.timeOfDay=e?e.getTime():null}};e([t({type:[String],json:{write:!0}})],c.prototype,"accumulateAttributes",void 0),e([t({json:{write:!0}})],c.prototype,"attributeParameterValues",void 0),e([t({type:[Number],json:{write:!0}})],c.prototype,"defaultBreaks",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"doNotLocateOnRestrictedElements",void 0),e([t({type:[String],json:{write:!0}})],c.prototype,"excludeSourcesFromPolygons",void 0),e([t({json:{write:!0}})],c.prototype,"facilities",void 0),e([t({type:String,json:{read:{source:"impedanceAttributeName"},write:{target:"impedanceAttributeName"}}})],c.prototype,"impedanceAttribute",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"mergeSimilarPolygonRanges",void 0),e([t({type:Number,json:{write:!0}})],c.prototype,"outputGeometryPrecision",void 0),e([t({type:m.apiValues,json:{read:{reader:m.read},write:{writer:m.write}}})],c.prototype,"outputGeometryPrecisionUnits",void 0),e([t({type:a.apiValues,json:{read:{reader:a.read},write:{writer:a.write}}})],c.prototype,"outputLines",void 0),e([t({type:l.apiValues,json:{read:{reader:l.read},write:{writer:l.write}}})],c.prototype,"outputPolygons",void 0),e([t({type:p,json:{write:!0}})],c.prototype,"outSpatialReference",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"overlapLines",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"overlapPolygons",void 0),e([t({json:{write:!0}})],c.prototype,"pointBarriers",void 0),e([t({json:{write:!0}})],c.prototype,"polygonBarriers",void 0),e([t({json:{write:!0}})],c.prototype,"polylineBarriers",void 0),e([t({type:[String],json:{write:!0}})],c.prototype,"restrictionAttributes",void 0),e([t({type:u.apiValues,json:{read:{reader:u.read},write:{writer:u.write}}})],c.prototype,"restrictUTurns",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"returnFacilities",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"returnPointBarriers",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"returnPolygonBarriers",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"returnPolylineBarriers",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"splitLinesAtBreaks",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"splitPolygonsAtBreaks",void 0),e([t({type:Date,json:{type:Number,write:!0}})],c.prototype,"timeOfDay",void 0),e([s("timeOfDay")],c.prototype,"readTimeOfDay",null),e([n("timeOfDay")],c.prototype,"writeTimeOfDay",null),e([t({type:y.apiValues,json:{read:{reader:y.read},write:{writer:y.write}}})],c.prototype,"travelDirection",void 0),e([t({json:{write:!0}})],c.prototype,"travelMode",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"trimOuterPolygon",void 0),e([t({type:Number,json:{write:!0}})],c.prototype,"trimPolygonDistance",void 0),e([t({type:m.apiValues,json:{read:{reader:m.read},write:{writer:m.write}}})],c.prototype,"trimPolygonDistanceUnits",void 0),e([t({type:Boolean,json:{write:!0}})],c.prototype,"useHierarchy",void 0),c=e([r("esri.tasks.support.ServiceAreaParameters")],c);var d=c;export default d;
