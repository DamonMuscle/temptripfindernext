/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import"./chunks/tslib.es6.js";import"./chunks/ArrayPool.js";import"./chunks/object.js";import"./chunks/deprecate.js";import"./core/lang.js";import"./config.js";import"./chunks/Logger.js";import"./chunks/string.js";import"./chunks/metadata.js";import"./core/accessorSupport/decorators/property.js";import"./core/Accessor.js";import"./chunks/PropertyOrigin.js";import"./core/scheduling.js";import"./core/promiseUtils.js";import"./chunks/Message.js";import"./core/Error.js";import{a as o}from"./chunks/ensureType.js";import"./core/accessorSupport/decorators/subclass.js";import"./chunks/JSONSupport.js";import"./core/urlUtils.js";import"./core/accessorSupport/decorators/cast.js";import"./chunks/jsonMap.js";import"./chunks/reader.js";import"./chunks/writer.js";import"./chunks/resourceExtension.js";export{default as SpatialReference}from"./geometry/SpatialReference.js";import r from"./geometry/Geometry.js";export{default as BaseGeometry}from"./geometry/Geometry.js";import e from"./geometry/Point.js";export{default as Point}from"./geometry/Point.js";import"./chunks/Ellipsoid.js";import"./geometry/support/webMercatorUtils.js";import s from"./geometry/Extent.js";export{default as Extent}from"./geometry/Extent.js";import"./chunks/zmUtils.js";import p from"./geometry/Multipoint.js";export{default as Multipoint}from"./geometry/Multipoint.js";import m from"./geometry/Polygon.js";export{default as Polygon}from"./geometry/Polygon.js";import"./chunks/extentUtils.js";import n from"./geometry/Polyline.js";export{default as Polyline}from"./geometry/Polyline.js";export{f as featureGeometryTypeKebabDictionary,i as isFeatureGeometryType,t as typeKebabDictionary}from"./chunks/typeUtils.js";export{fromJSON}from"./geometry/support/jsonUtils.js";function c(o){return o instanceof r}const a={base:r,key:"type",typeMap:{extent:s,multipoint:p,point:e,polyline:n,polygon:m}},j=o(a);export{j as ensureType,a as geometryTypes,c as isGeometry};
