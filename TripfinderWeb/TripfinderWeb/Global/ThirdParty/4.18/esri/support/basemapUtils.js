// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../core/Logger ../core/accessorSupport/ensureType ../core/urlUtils ../core/Collection ./basemapDefinitions ../Basemap".split(" "),function(e,D,E,h,p,g,k){function q(a,b){var c;let d;if("string"===typeof a){if(!(a in g.esriBasemapDefinitions))return b=Object.keys(g.esriBasemapDefinitions).map(f=>`"${f}"`).join(", "),r.warn(`Unable to find basemap definition for: ${a}. Try one of these: ${b}`),null;b&&(d=b[a]);d||(d=k.fromId(a),b&&(b[a]=d))}else d=E.ensureType(k,a);null!=(c=d)&&c.destroyed&&
(r.warn("The provided basemap is already destroyed",{basemap:d}),d=null);return d}function t(a,b){const c=new p;a.forEach(d=>{const f=b.find(l=>u(m(d),m(l)))||d;c.some(l=>l===f)?c.push(d):c.push(f)});return c}function v(a){if(w(a.url))return!0;if("vector-tile"===a.type)for(const b in a.sourceNameToSource){const c=a.sourceNameToSource[b];if(w(null==c?void 0:c.sourceUrl))return!0}return!1}function w(a){if(!a)return!1;a=new h.Url(h.makeAbsolute(a));return F.test(a.authority)}function n(a){return a?!a.loaded&&
a.resourceInfo?x(a.resourceInfo.data):{baseLayers:y(a.baseLayers),referenceLayers:y(a.referenceLayers)}:null}function y(a){return(p.isCollection(a)?a.toArray():a).map(m)}function m(a){return{type:a.type,url:z("urlTemplate"in a&&a.urlTemplate||a.url||"styleUrl"in a&&a.styleUrl),minScale:"minScale"in a&&null!=a.minScale?a.minScale:0,maxScale:"maxScale"in a&&null!=a.maxScale?a.maxScale:0,opacity:null!=a.opacity?a.opacity:1,visible:null!=a.visible?!!a.visible:!0}}function x(a){return a?{baseLayers:A(a.baseMapLayers.filter(b=>
!b.isReference)),referenceLayers:A(a.baseMapLayers.filter(b=>b.isReference))}:null}function A(a){return a.map(b=>{{let c;switch(b.layerType){case "VectorTileLayer":c="vector-tile";break;case "ArcGISTiledMapServiceLayer":c="tile";break;default:c="unknown"}b={type:c,url:z(b.templateUrl||b.urlTemplate||b.styleUrl||b.url),minScale:null!=b.minScale?b.minScale:0,maxScale:null!=b.maxScale?b.maxScale:0,opacity:null!=b.opacity?b.opacity:1,visible:null!=b.visibility?!!b.visibility:!0}}return b})}function B(a,
b,c){return null!=a!==(null!=b)?"not-equal":a?C(a.baseLayers,b.baseLayers)?C(a.referenceLayers,b.referenceLayers)?"equal":c.mustMatchReferences?"not-equal":"base-layers-equal":"not-equal":"equal"}function C(a,b){if(a.length!==b.length)return!1;for(let c=0;c<a.length;c++)if(!u(a[c],b[c]))return!1;return!0}function u(a,b){return a.type===b.type&&a.url===b.url&&a.minScale===b.minScale&&a.maxScale===b.maxScale&&a.visible===b.visible&&a.opacity===b.opacity}function z(a){return a?h.normalize(a).replace(/^\s*https?:/i,
"").toLowerCase():""}const r=D.getLogger("esri.support.basemapUtils"),F=/^(basemaps|ibasemaps).*-api\.arcgis\.com$/i;e.clonePreservingTiledLayers=function(a,b=null){a=q(a);if(!a)return null;const c=new k({id:a.id,title:a.title,baseLayers:a.baseLayers.slice(),referenceLayers:a.referenceLayers.slice()});b&&(c.baseLayers=t(c.baseLayers,b.baseLayers),c.referenceLayers=t(c.referenceLayers,b.referenceLayers));c.load().catch(()=>{});c.portalItem=a.portalItem;return c};e.contentEquals=function(a,b){if(a===
b)return!0;a=n(a);b=n(b);return"equal"===B(a,b,{mustMatchReferences:!0})};e.createCache=function(){return{}};e.destroyCache=function(a){for(const b in a){const c=a[b];!1===(null==c?void 0:c.destroyed)&&c.destroy();delete a[b]}};e.ensureType=q;e.getWellKnownBasemapId=function(a){let b=null;a=n(a);const c=!a.baseLayers.length;for(const f in g.esriBasemapDefinitions){var d=x(g.esriBasemapDefinitions[f]);d=B(a,d,{mustMatchReferences:c});if("equal"===d){b=f;break}"base-layers-equal"===d&&(b=f)}return b};
e.hasDeveloperBasemapLayer=function(a){return!(null==a||!a.baseLayers.concat(a.referenceLayers).some(v))};e.isDeveloperBasemapLayer=v;Object.defineProperty(e,"__esModule",{value:!0})});