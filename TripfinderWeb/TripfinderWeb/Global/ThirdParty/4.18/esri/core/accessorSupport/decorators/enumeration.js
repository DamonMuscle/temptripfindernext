// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","./property","../../jsonMap"],function(c,e,d){c.enumeration=function(a,b={ignoreUnknown:!0}){a=a instanceof d.JSONMap?a:new d.JSONMap(a,b);a={type:null!=b&&b.ignoreUnknown?a.apiValues:String,readOnly:null==b?void 0:b.readOnly,json:{type:a.jsonValues,read:null!=b&&b.readOnly?!1:{reader:a.read},write:{writer:a.write}}};void 0!==(null==b?void 0:b.default)&&(a.json.default=b.default);return e.property(a)};Object.defineProperty(c,"__esModule",{value:!0})});