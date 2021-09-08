// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../core/has ../../core/accessorSupport/ensureType ../../core/accessorSupport/extensions/serializableProperty/type ../../Basemap ../../Ground ../../layers/mixins/operationalLayers ../../WebScene ../../layers/support/source/MapLayerSource ../../chunks/DataLayerSource ../../layers/GroupLayer ../../layers/KMLLayer ../../layers/support/Sublayer ../../layers/mixins/operationalLayerModuleMap ./utils".split(" "),function(z,Y,u,G,A,H,I,J,K,B,C,L,p,M,N){async function q(a,b,c){switch(b.typeName){case "array":await O(a,
b,c);break;case "union":await P(a,b,c);break;case "json":await D(a,b,c);break;case "native":await Q(a,b,c);break;case "enum":await R(a,b,c)}}async function Q(a,b,c){c.addProperty({name:a,type:m(b),default:b.default})}function S(a){a=a.slice();a.sort();return a}async function R(a,b,c){const e=b.values.slice();b.nullable&&e.push(null);c.currentClass&&c.currentClass.typeValue&&"type"===a?c.addProperty({name:a,type:"string",enum:`"${c.currentClass.typeValue}"`}):c.addProperty({name:a,type:m(b),enum:S(e).map(d=>
"string"===typeof d?`"${d}"`:`${d}`).join("|"),default:b.default})}async function O(a,b,c){await q(`${a}[]`,b.elementType,c)}async function P(a,b,c){var e=[];for(const f of b.types)if("native"!==f.type.typeName&&b.key){var d=f.type;var g=f.value;if("json"===d.typeName){var h=(d=(d=d.type.__accessorMetadata__)&&d.properties&&d.properties&&d.properties.type)&&r(d);const k=(h=h&&h.type)||d&&d.type;k&&Array.isArray(k)&&1===k.length&&"string"===typeof k[0]&&(g=h?k[0]:v(d,k[0]))}await q(`${a}<${g}>`,f.type,
c)}else e.push(f.type);e.length&&(e=e.map(m),b.nullable&&e.push("null"),e.sort(),c.addProperty({type:e.join("|"),name:a,default:b.default}))}async function E(a,b){return a.type===J&&"layers"===b?t("web-scene/operational-layers"):a.type!==A||"baseLayers"!==b&&"baseMapLayers"!==b?a.type===A&&"elevationLayers"===b||a.type===H&&"layers"===b?t("web-scene/ground"):a.type===C&&"layers"===b?t("web-scene/operational-layers",c=>c!==C):a.type!==B.JoinTableDataSource||"leftTableSource"!==b&&"rightTableSource"!==
b?null:n({key:"type",base:null,typeMap:{"data-layer":B.DataLayerSource,"map-layer":K.MapLayerSource}}):t("web-scene/basemap")}async function T(a,b,c){if(a=await E(a,b))return a;a=r(c);if(a.types)c=n(a.types);else if(!a.type&&c.types)c=n(c.types);else{{a=r(c);b=w(c);const e=l(a&&a.type||c.type);a&&void 0!==a.default&&"function"!==typeof a.default&&(e.default=v(c,a.default));b.allowNull&&(e.nullable=!0);c=e}c=x(c)}return c}async function D(a,b,c){var e=b.type.__accessorMetadata__,d=b.type.prototype.declaredClass.replace(/\./g,
"/");e=e&&e.properties;if(!e)return a&&c.addProperty({name:a,type:"unknown"}),null;let g=d;var h=null,f=a&&a.match(/<([^>]+)>$/);f&&(g+=`--${f[1]}`,h=f[1]);b.type===p&&(g+=`--${c.currentClass.name}`,h=c.currentClass.name);if((f=c.seen.get(g))&&a)return c.addProperty({name:a,type:f}),f;d={type:b.type,name:d,id:g,properties:[]};a&&(c.addProperty({name:a,type:d}),d.typeValue=h);c.push(a,d);for(const k in e)if(a=e[k],(d=w(a))&&d.enabled){if(b.type===p&&((h="esri/layers/TileLayer"===c.stack[c.stack.length-
2].klass.name)&&p.test.isMapImageLayerOverridePolicy(d.overridePolicy)||!h&&p.test.isTileImageLayerOverridePolicy(d.overridePolicy)))continue;d=d.target;"string"===typeof d||null==d?(a=await T(b,k,a))&&await q("string"===typeof d?d:k,a,c):await U(b,d,c)}return c.pop()}async function U(a,b,c){for(const e in b){let d=await E(a,e);if(!d){const g=b[e];d=g.types?n(g.types):l(g.type);d.default=g.default;d=x(d)}await q(e,d,c)}}async function t(a,b){const c={typeName:"union",key:"layerType",types:[]};for(const e in I.supportedTypes[a]){if("web-scene/operational-layers"===
a&&"ArcGISTiledElevationServiceLayer"===e)continue;const d=await M.typeModuleMap[e]();d&&(!b||b(d))&&d!==L&&c.types.push({type:{typeName:"json",type:d},value:e})}return 0===c.types.length?null:{typeName:"array",elementType:1===c.types.length?c.types[0].type:c}}function m(a){switch(a.typeName){case "array":return`${m(a.elementType)}[]`;case "union":{const b=a.types.map(c=>m(c.type));a.nullable&&b.push("null");b.sort();return`${b.join(" | ")}`}case "native":switch(a.type){case Number:return"number";
case u.Integer:return"integer";case String:return"string";case Boolean:return"boolean";case Object:return"object";default:return"unknown"}case "json":return a.type.prototype.declaredClass;case "enum":return"string"}}function V(a){a=a.prototype.itemType&&a.prototype.itemType.Type;if(!a)return{typeName:"array",elementType:{typeName:"native",type:null}};if("function"===typeof a)return{typeName:"array",elementType:l(a)};if(a.typeMap){const b=[];for(const c in a.typeMap){const e=a.typeMap[c];b.push({type:l(e),
value:y(e)?null:c})}return{typeName:"array",elementType:{typeName:"union",key:"string"===typeof a.key?a.key:"type",types:b}}}}function W(a){if("json"!==a.typeName)return null;const b=(a=a.type.__accessorMetadata__)&&a.properties&&a.properties.type,c=(a=(a=b&&r(b))&&a.type)||b&&b.type;return c&&Array.isArray(c)&&"string"===typeof c[0]?a?a:b.type.map(e=>v(b,e)):null}function x(a){if("array"===a.typeName)return a.elementType=x(a.elementType),a;const b=W(a);return b?{typeName:"union",key:"type",types:b.map(c=>
({value:c,type:a}))}:a}function n(a){if(Array.isArray(a))return{typeName:"array",elementType:n(a[0])};const b=[];for(const c in a.typeMap){const e=a.typeMap[c];b.push({type:l(e),value:y(e)?null:c})}return{typeName:"union",key:"string"===typeof a.key?a.key:"type",types:b}}function v(a,b){a=w(a);var c=a.writer;return null!=c&&c.isJSONMapWriter?(c={value:""},a.writer(b,c,"value"),c.value):b}function l(a){return a?u.isLongFormType(a)?F(a):Array.isArray(a)?"string"===typeof a[0]||"number"===typeof a[0]?
{typeName:"enum",values:a}:1<a.length?{typeName:"union",key:null,types:a.map(b=>({type:l(b),value:null}))}:{typeName:"array",elementType:l(a[0])}:G.isCollection(a)?V(a):y(a)?{typeName:"native",type:a}:X(a)?{typeName:"json",type:a}:{typeName:"native",type:null}:{typeName:"native",type:null}}function F(a){switch(a.type){case "native":return{typeName:"native",type:a.value};case "array":return{typeName:"array",elementType:l(a.value)};case "one-of":return{typeName:"union",key:null,types:a.values.map(b=>
({type:F(b),value:null}))}}}function X(a){for(;a;){if(a.prototype&&("esri.core.JSONSupport"===a.prototype.declaredClass||"esri.core.MultiOriginJSONSupport"===a.prototype.declaredClass))return!0;a=Object.getPrototypeOf(a)}return!1}function y(a){return a===String||a===Boolean||a===Number||a===u.Integer||a===Object}function r(a){if(!a.json)return null;const b=a.json.origins;a=a.json;const c=b&&b["web-document"];return b&&b["web-scene"]||c||a||null}function w(a){if(!a.json)return null;const b=a.json.origins;
a=a.json.write;const c=b&&b["web-document"]&&b["web-document"].write;return b&&b["web-scene"]&&b["web-scene"].write||c||a||null}z.scan=async function(a){const b=new N.ScanContext;return D(null,{typeName:"json",type:a},b)};Object.defineProperty(z,"__esModule",{value:!0})});