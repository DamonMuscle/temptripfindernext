/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import"../chunks/tslib.es6.js";import"../chunks/ArrayPool.js";import"../chunks/object.js";import"../chunks/deprecate.js";import"../core/lang.js";import"../config.js";import"../chunks/Logger.js";import"../chunks/string.js";import"../chunks/metadata.js";import"../core/accessorSupport/decorators/property.js";import"../core/Accessor.js";import"../chunks/PropertyOrigin.js";import"../core/scheduling.js";import"../core/promiseUtils.js";import"../chunks/Message.js";import"../core/Error.js";import"../chunks/ensureType.js";import"../core/accessorSupport/decorators/subclass.js";import"../chunks/JSONSupport.js";import"../core/urlUtils.js";import"../core/accessorSupport/decorators/aliasOf.js";import"../chunks/jsonMap.js";import"../chunks/enumeration.js";import"../chunks/reader.js";import"../chunks/writer.js";import"../chunks/resourceExtension.js";import"../chunks/locale.js";import"../chunks/number.js";import t from"./content/Content.js";export{default as BaseContent}from"./content/Content.js";import o from"./content/AttachmentsContent.js";export{default as AttachmentsContent}from"./content/AttachmentsContent.js";export{default as CustomContent}from"./content/CustomContent.js";import"../chunks/date.js";import"./support/FieldInfoFormat.js";import"./FieldInfo.js";import e from"./content/FieldsContent.js";export{default as FieldsContent}from"./content/FieldsContent.js";import"../chunks/MediaInfo.js";import"./content/support/ChartMediaInfoValueSeries.js";import"./content/support/ChartMediaInfoValue.js";import"../chunks/chartMediaInfoUtils.js";import"./content/BarChartMediaInfo.js";import"./content/ColumnChartMediaInfo.js";import"./content/support/ImageMediaInfoValue.js";import"./content/ImageMediaInfo.js";import"./content/LineChartMediaInfo.js";import"./content/PieChartMediaInfo.js";import n from"./content/MediaContent.js";export{default as MediaContent}from"./content/MediaContent.js";import r from"./content/TextContent.js";export{default as TextContent}from"./content/TextContent.js";function s(o){return o instanceof t}const i={base:null,key:"type",typeMap:{attachment:o,media:n,text:r,field:e}};export{s as isContent,i as persistableTypes};
