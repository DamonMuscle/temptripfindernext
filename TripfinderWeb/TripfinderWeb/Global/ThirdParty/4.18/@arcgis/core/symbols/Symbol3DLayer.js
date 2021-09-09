/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{_ as r}from"../chunks/tslib.es6.js";import"../chunks/ArrayPool.js";import"../chunks/object.js";import"../chunks/deprecate.js";import"../core/lang.js";import"../config.js";import"../chunks/Logger.js";import"../chunks/string.js";import"../chunks/metadata.js";import{property as o}from"../core/accessorSupport/decorators/property.js";import"../core/Accessor.js";import"../chunks/PropertyOrigin.js";import"../core/scheduling.js";import"../core/promiseUtils.js";import"../chunks/Message.js";import"../core/Error.js";import"../chunks/ensureType.js";import{subclass as e}from"../core/accessorSupport/decorators/subclass.js";import{a as s}from"../chunks/JSONSupport.js";import"../core/urlUtils.js";import{w as t}from"../chunks/writer.js";import"../chunks/resourceExtension.js";let p=class extends s{constructor(r){super(r),this.enabled=!0,this.type=null}writeEnabled(r,o,e){r||(o[e]=r)}};r([o({type:Boolean,json:{read:{source:"enable"},write:{target:"enable"}}})],p.prototype,"enabled",void 0),r([t("enabled")],p.prototype,"writeEnabled",null),r([o({type:["icon","object","line","path","fill","water","extrude","text"],readOnly:!0})],p.prototype,"type",void 0),p=r([e("esri.symbols.Symbol3DLayer")],p);var i=p;export default i;