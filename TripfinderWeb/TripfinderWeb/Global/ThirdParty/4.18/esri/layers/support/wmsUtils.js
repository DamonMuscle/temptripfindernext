// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../core/Error","../../core/urlUtils","../../geometry/SpatialReference","../../geometry/Extent"],function(w,Z,aa,L,E){function M(a){return ba.some(c=>{const b=c[1];return a>=c[0]&&a<=b})}function N(a){let c=[];a.forEach(b=>{c.push(b);b.sublayers&&b.sublayers.length&&(c=c.concat(N(b.sublayers)),delete b.sublayers)});return c}function F(a,c,b){var d;return null!=(d=c.getAttribute(a))?d:b}function p(a,c){for(let b=0;b<c.childNodes.length;b++){const d=c.childNodes[b];if(d.nodeType===
Node.ELEMENT_NODE&&d.nodeName===a)return d}return null}function G(a,c){const b=[];for(let d=0;d<c.childNodes.length;d++){const e=c.childNodes[d];e.nodeType===Node.ELEMENT_NODE&&e.nodeName===a&&b.push(e)}return b}function x(a,c,b){return(a=p(a,c))?a.textContent:b}function C(a,c,b){if(!a)return null;var d=parseFloat(a.getAttribute("minx")),e=parseFloat(a.getAttribute("miny")),g=parseFloat(a.getAttribute("maxx"));a=parseFloat(a.getAttribute("maxy"));b?(b=isNaN(e)?-Number.MAX_VALUE:e,d=isNaN(d)?-Number.MAX_VALUE:
d,e=isNaN(a)?Number.MAX_VALUE:a,g=isNaN(g)?Number.MAX_VALUE:g):(b=isNaN(d)?-Number.MAX_VALUE:d,d=isNaN(e)?-Number.MAX_VALUE:e,e=isNaN(g)?Number.MAX_VALUE:g,g=isNaN(a)?Number.MAX_VALUE:a);c=new L({wkid:c});return new E({xmin:b,ymin:d,xmax:e,ymax:g,spatialReference:c})}function O(a,c){if(a=p(c,a))if(a=p("DCPType",a))if(a=p("HTTP",a))if(a=p("Get",a)){var b=a=(a=p("OnlineResource",a))?F("xlink:href",a,null):null;if(b){b.indexOf("\x26")===b.length-1&&(b=b.substring(0,b.length-1));var d;a=["service","request"];
c=[];b=aa.urlToObject(b);for(d in b.query)b.query.hasOwnProperty(d)&&-1===a.indexOf(d.toLowerCase())&&c.push(d+"\x3d"+b.query[d]);return d=b.path+(c.length?"?"+c.join("\x26"):"")}}return null}function P(a,c){const b=G("Operation",a);if(0===b.length)return a=p(c,a),G("Format",a).map(e=>e.textContent);const d=[];b.forEach(e=>{e.getAttribute("name")===c&&G("Format",e).forEach(g=>{d.push(g.textContent)})});return d}function Q(a,c,b){a=p(c,a);if(!a)return b;({textContent:a}=a);if(null==a||""===a)return b;
a=Number(a);return isNaN(a)?b:a}function H(a,c,b){var d;if(!a)return null;const e={id:b.idCounter++,fullExtents:[],parentLayerId:null,queryable:"1"===a.getAttribute("queryable"),spatialReferences:[],sublayers:null},g=p("LatLonBoundingBox",a),q=p("EX_GeographicBoundingBox",a);let r=null;g&&(r=C(g,4326));q&&(r=new E(0,0,0,0,new L({wkid:4326})),r.xmin=parseFloat(x("westBoundLongitude",q,"0")),r.ymin=parseFloat(x("southBoundLatitude",q,"0")),r.xmax=parseFloat(x("eastBoundLongitude",q,"0")),r.ymax=parseFloat(x("northBoundLatitude",
q,"0")));g||q||(r=new E(-180,-90,180,90,new L({wkid:4326})));e.minScale=Q(a,"MaxScaleDenominator",0);e.maxScale=Q(a,"MinScaleDenominator",0);const I=-1<["1.0.0","1.1.0","1.1.1"].indexOf(c)?"SRS":"CRS";Array.prototype.slice.call(a.childNodes).forEach(f=>{if("Name"===f.nodeName)e.name=f.textContent||"";else if("Title"===f.nodeName)e.title=f.textContent||"";else if("Abstract"===f.nodeName)e.description=f.textContent||"";else if("BoundingBox"===f.nodeName){var h=f.getAttribute(I);if(h&&0===h.indexOf("EPSG:")){var t=
parseInt(h.substring(5),10);0===t||isNaN(t)||r||(r="1.3.0"===c?C(f,t,M(t)):C(f,t))}(t=h&&h.indexOf(":"))&&-1<t&&(h=parseInt(h.substring(t+1,h.length),10),0===h||isNaN(h)||(h=J[h]?J[h]:h),f="1.3.0"===c?C(f,h,M(h)):C(f,h),e.fullExtents.push(f))}else if(f.nodeName===I)f.textContent.split(" ").forEach(m=>{m=-1<m.indexOf(":")?parseInt(m.split(":")[1],10):parseInt(m,10);0===m||isNaN(m)||(J[m]&&(m=J[m]),-1===e.spatialReferences.indexOf(m)&&e.spatialReferences.push(m))});else if("Style"!==f.nodeName||e.legendURL)"Layer"===
f.nodeName&&(f=H(f,c,b))&&(f.parentLayerId=e.id,e.sublayers||(e.sublayers=[]),e.sublayers.push(f));else if(f=p("LegendURL",f))if(f=p("OnlineResource",f))e.legendURL=f.getAttribute("xlink:href")});e.extent=null==(d=r)?void 0:d.toJSON();e.dimensions=G("Dimension",a).filter(f=>f.getAttribute("name")&&f.getAttribute("units")&&f.textContent).map(f=>{const h=f.getAttribute("name"),t=f.getAttribute("units"),m=f.textContent,k=f.getAttribute("unitSymbol"),z=f.getAttribute("default"),A="0"!==F("default",f,
"0"),u="0"!==F("nearestValue",f,"0");f="0"!==F("current",f,"0");return/^time$/i.test(h)&&/^ISO8601$/i.test(t)?{name:"time",units:"ISO8601",extent:R(m),default:R(z),multipleValues:A,nearestValue:u,current:f}:/^elevation$/i.test(h)?{name:"elevation",units:t,extent:S(m),unitSymbol:k,default:S(z),multipleValues:A,nearestValue:u}:{name:h,units:t,extent:T(m),unitSymbol:k,default:T(z),multipleValues:A,nearestValue:u}});return e}function ca(a){return Array.isArray(a)&&0<a.length&&a[0]instanceof Date}function U(a){return"time"===
a.name}function S(a){if(!a)return null;const c=-1!==a.indexOf("/");a=a.split(",");return c?a.map(b=>{var d=b.split("/");if(2>d.length)return null;b=parseFloat(d[0]);const e=parseFloat(d[1]);d=3<=d.length&&"0"!==d[2]?parseFloat(d[2]):void 0;return{min:b,max:e,resolution:d}}).filter(b=>b):a.map(b=>parseFloat(b))}function T(a){if(!a)return null;const c=-1!==a.indexOf("/");a=a.split(",");return c?a.map(b=>{b=b.split("/");return 2>b.length?null:{min:b[0],max:b[1],resolution:3<=b.length&&"0"!==b[2]?b[2]:
void 0}}).filter(b=>b):a}function R(a){if(!a)return null;const c=-1!==a.indexOf("/");a=a.split(",");return c?a.map(b=>{var d=b.split("/");if(2>d.length)return null;b=new Date(d[0]);const e=new Date(d[1]);d=3<=d.length&&"0"!==d[2]?V(d[2]):void 0;return{min:b,max:e,resolution:d}}).filter(b=>b):a.map(b=>new Date(b))}function V(a){var c=a.match(/(?:p(\d+y|\d+(?:.|,)\d+y)?(\d+m|\d+(?:.|,)\d+m)?(\d+d|\d+(?:.|,)\d+d)?)?(?:t(\d+h|\d+(?:.|,)\d+h)?(\d+m|\d+(?:.|,)\d+m)?(\d+s|\d+(?:.|,)\d+s)?)?/i);if(!c)return null;
a=B(c[1]);const b=B(c[2]),d=B(c[3]),e=B(c[4]),g=B(c[5]);c=B(c[6]);return{years:a,months:b,days:d,hours:e,minutes:g,seconds:c}}function B(a){if(!a)return 0;a=a.match(/(?:\d+(?:.|,)\d+|\d+)/);if(!a)return 0;a=a[0].replace(",",".");return Number(a)}const ba=[[4001,4999],[2044,2045],[2081,2083],[2085,2086],[2093,2093],[2096,2098],[2105,2132],[2169,2170],[2176,2180],[2193,2193],[2200,2200],[2206,2212],[2319,2319],[2320,2462],[2523,2549],[2551,2735],[2738,2758],[2935,2941],[2953,2953],[3006,3030],[3034,
3035],[3058,3059],[3068,3068],[3114,3118],[3126,3138],[3300,3301],[3328,3335],[3346,3346],[3350,3352],[3366,3366],[3416,3416],[20004,20032],[20064,20092],[21413,21423],[21473,21483],[21896,21899],[22171,22177],[22181,22187],[22191,22197],[25884,25884],[27205,27232],[27391,27398],[27492,27492],[28402,28432],[28462,28492],[30161,30179],[30800,30800],[31251,31259],[31275,31279],[31281,31290],[31466,31700]],J={84:4326,83:4269,27:4267};w.coordsReversed=M;w.fromISODuration=V;w.getPopupLayers=function(a){return a.length?
a.filter(c=>c.popupEnabled&&c.name&&c.queryable).map(c=>c.name).join(","):""};w.isDimensionInterval=function(a){return void 0!==a.min&&void 0!==a.max};w.isElevationDimension=function(a){return"elevation"===a.name};w.isGenericDimension=function(a){return"time"!==a.name&&"elevation"!==a.name};w.isTimeDimension=U;w.parseCapabilities=function(a){if(!a)return null;const c={idCounter:-1};"string"===typeof a&&(a=(new DOMParser).parseFromString(a,"text/xml"));a=a.documentElement;if("ServiceExceptionReport"===
a.nodeName){var b=Array.prototype.slice.call(a.childNodes).map(l=>l.textContent).join("\r\n");throw new Z("wmslayer:wms-capabilities-xml-is-not-valid","The server returned errors when the WMS capabilities were requested.",b);}var d=p("Capability",a),e=p("Service",a),g=p("Request",d);if(!d||!e||!g)return null;var q=p("Layer",d);if(!q)return null;const r="WMS_Capabilities"===a.nodeName||"WMT_MS_Capabilities"===a.nodeName?a.getAttribute("version"):"1.3.0";a=x("Title",e,"")||x("Name",e,"");const I=x("AccessConstraints",
e,""),f=x("Abstract",e,""),h=parseInt(x("MaxWidth",e,"5000"),10);e=parseInt(x("MaxHeight",e,"5000"),10);const t=P(g,"GetMap"),m=O(g,"GetMap"),k=H(q,r,c);let z=0,A;Array.prototype.slice.call(d.childNodes).forEach(l=>{"Layer"===l.nodeName&&(0===z?A=l:(1===z&&k.name&&(k.name="",k.sublayers.push(H(A,r,c))),k.sublayers.push(H(l,r,c))),z++)});if(!k)return null;var u;let D;d=k.fullExtents;(u=k.sublayers)||(u=[]);0===u.length&&u.push(k);q=k.extent;q||(q=new E(u[0].extent),k.extent=q.toJSON(),q=k.extent);
D=k.spatialReferences;if(!D.length&&0<u.length){const l=n=>{let v=[];n.sublayers.forEach(y=>{!v.length&&y.spatialReferences.length&&(v=y.spatialReferences||l(y))});return v};u.forEach(n=>{D.length||(D=n.spatialReferences||l(n))})}const W=O(g,"GetFeatureInfo");W&&(g=P(g,"GetFeatureInfo"),-1<g.indexOf("text/html")?b="text/html":-1<g.indexOf("text/plain")&&(b="text/plain"));if(!b){const l=function(n){n&&(n.queryable=!1,n.sublayers&&n.sublayers.forEach(v=>{l(v)}))};l(k)}g=N(u);u=k.minScale||0;const da=
k.maxScale||0,X=k.dimensions;var K=g.reduce((l,n)=>l.concat(n.dimensions),[]);K=X.concat(K).filter(U);let Y=null;if(0<K.length){let l=Number.POSITIVE_INFINITY,n=Number.NEGATIVE_INFINITY;K.forEach(v=>{({extent:v}=v);ca(v)?v.forEach(y=>{l=Math.min(l,y.getTime());n=Math.max(n,y.getTime())}):v.forEach(y=>{l=Math.min(l,y.min.getTime());n=Math.max(n,y.max.getTime())})});Y={startTimeField:null,endTimeField:null,trackIdField:null,timeExtent:[l,n]}}return{copyright:I,description:f,dimensions:X,extent:q,fullExtents:d,
featureInfoFormat:b,featureInfoUrl:W,mapUrl:m,maxWidth:h,maxHeight:e,maxScale:da,minScale:u,layers:g,spatialReferences:D,supportedImageFormatTypes:t,timeInfo:Y,title:a,version:r}};w.toISOString=function(a){return a.toISOString().replace(/\.[0-9]{3}/,"")};Object.defineProperty(w,"__esModule",{value:!0})});