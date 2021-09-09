// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../config ../../core/urlUtils ../../core/promiseUtils ../../request ../../views/2d/engine/vectorTiles/style/VectorTileSource".split(" "),function(u,v,g,q,z,A){function m(a){a&&(a=g.getOrigin(a),t&&-1===t.indexOf(a)&&t.push(a))}function n(...a){let c=void 0;for(let b=0;b<a.length;++b)g.isProtocolRelative(a[b])?c&&(c=c.split("://")[0]+":"+a[b].trim()):c=g.isAbsolute(a[b])?a[b]:g.join(c,a[b]);return g.removeTrailingSlash(c)}async function p(a,c,b,d,f){q.throwIfAborted(f);if("string"===
typeof b){d=g.normalize(b);m(d);var e=g.urlToObject(d);e=await z(e.path,{query:{f:"json"},responseType:"json",...f});b=d}else e={data:b},b=b.jsonUrl||null;const h=e.data;e.ssl&&(b&&(b=b.replace(/^http:/i,"https:")),d&&(d=d.replace(/^http:/i,"https:")));return h.sources?(a.styleUrl=b||null,B(a,h,d,f)):h.sources?q.reject("You must specify the URL or the JSON for a service or for a style."):a.sourceUrl?w(a,h,d,!1,c,f):(a.sourceUrl=b||null,w(a,h,d,!0,c,f))}async function B(a,c,b,d){b=b?g.removeFile(b):
g.appBaseUrl;a.styleBase=b;a.style=c;a.styleUrl&&m(a.styleUrl);c["sprite-format"]&&"webp"===c["sprite-format"].toLowerCase()&&(a.spriteFormat="webp");const f=[];if(c.sources&&c.sources.esri){const e=c.sources.esri;e.url?await p(a,"esri",n(b,e.url),void 0,d):f.push(p(a,"esri",e,b,d))}for(const e of Object.keys(c.sources))"esri"!==e&&"vector"===c.sources[e].type&&(c.sources[e].url?f.push(p(a,e,n(b,c.sources[e].url),void 0,d)):f.push(p(a,e,c.sources[e],b,d)));await q.all(f)}async function w(a,c,b,d,
f,e){b=b?g.removeTrailingSlash(b)+"/":g.appBaseUrl;if(c.hasOwnProperty("tileInfo"))var h=c;else{var k={xmin:-2.0037507067161843E7,ymin:-2.0037507067161843E7,xmax:2.0037507067161843E7,ymax:2.0037507067161843E7,spatialReference:{wkid:102100}},l=78271.51696400007,x=2.958287637957775E8,y=[],C=c.hasOwnProperty("minzoom")?parseFloat(c.minzoom):0,D=c.hasOwnProperty("maxzoom")?parseFloat(c.maxzoom):22;for(let r=0;r<=D;r++)r>=C&&y.push({level:r,scale:x,resolution:l}),l/=2,x/=2;for(h of c.tiles)m(n(b,h));h=
{capabilities:"TilesOnly",initialExtent:k,fullExtent:k,minScale:0,maxScale:0,tiles:c.tiles,tileInfo:{rows:512,cols:512,dpi:96,format:"pbf",origin:{x:-2.0037508342787E7,y:2.0037508342787E7},lods:y,spatialReference:{wkid:102100}}}}k=new A(f,b,h);if(!d&&a.primarySourceName in a.sourceNameToSource){l=a.sourceNameToSource[a.primarySourceName];if(!l.isCompatibleWith(k))return q.resolve();null!=k.fullExtent&&(null!=l.fullExtent?l.fullExtent.union(k.fullExtent):l.fullExtent=k.fullExtent.clone());l.tileInfo.lods.length<
k.tileInfo.lods.length&&(l.tileInfo=k.tileInfo)}d?(a.sourceBase=b,a.source=c,a.validatedSource=h,a.primarySourceName=f,a.sourceUrl&&m(a.sourceUrl)):m(b);a.sourceNameToSource[f]=k;if(!a.style)return null==c.defaultStyles?q.reject():"string"===typeof c.defaultStyles?p(a,"",n(b,c.defaultStyles,"root.json"),void 0,e):p(a,"",c.defaultStyles,n(b,"root.json"),e)}const t=v.defaults&&v.defaults.io.corsEnabledServers;u.loadMetadata=async function(a,c){const b={source:null,sourceBase:null,sourceUrl:null,validatedSource:null,
style:null,styleBase:null,styleUrl:null,sourceNameToSource:{},primarySourceName:"",spriteFormat:"png"},[d,f]="string"===typeof a?[a,null]:[null,a.jsonUrl],e=d?g.urlToObject(d):null;await p(b,"esri",a,f,c);a={layerDefinition:b.validatedSource,url:d,parsedUrl:e,serviceUrl:b.sourceUrl,style:b.style,styleUrl:b.styleUrl,spriteUrl:b.style.sprite&&n(b.styleBase,b.style.sprite),spriteFormat:b.spriteFormat,glyphsUrl:b.style.glyphs&&n(b.styleBase,b.style.glyphs),sourceNameToSource:b.sourceNameToSource,primarySourceName:b.primarySourceName};
m(a.spriteUrl);m(a.glyphsUrl);return a};Object.defineProperty(u,"__esModule",{value:!0})});