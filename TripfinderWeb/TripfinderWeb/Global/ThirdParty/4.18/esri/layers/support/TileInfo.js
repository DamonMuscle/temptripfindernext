// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/reader ../../core/accessorSupport/decorators/subclass ../../core/accessorSupport/decorators/writer ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../../core/JSONSupport ../../geometry/support/spatialReferenceUtils ../../geometry/SpatialReference ../../geometry/support/webMercatorUtils ../../geometry/Point ../../geometry ../../core/unitUtils ../../geometry/support/aaBoundingRect ./LOD".split(" "),
function(y,h,w,I,z,l,C,A,D,E,J,K,L,g,q,x,F,n,M,G,B,H){var r;w=new C.JSONMap({PNG:"png",PNG8:"png8",PNG24:"png24",PNG32:"png32",JPEG:"jpg",JPG:"jpg",DIB:"dib",TIFF:"tiff",EMF:"emf",PS:"ps",PDF:"pdf",GIF:"gif",SVG:"svg",SVGZ:"svgz",Mixed:"mixed",MIXED:"mixed",LERC:"lerc",LERC2D:"lerc2d",RAW:"raw",pbf:"pbf"});g=r=function(m){function t(a){a=m.call(this,a)||this;a.dpi=96;a.format=null;a.origin=null;a.minScale=0;a.maxScale=0;a.size=null;a.spatialReference=null;return a}y._inheritsLoose(t,m);t.create=function(a=
{size:256,spatialReference:x.WebMercator}){var b=a.resolutionFactor||1,c=a.scales;const d=a.size||256,e=a.spatialReference||x.WebMercator;if(!q.isValid(e)){b=[];if(c)for(a=0;a<c.length;a++){var f=c[a];b.push({level:a,scale:f,resolution:f})}else for(c=5E-4,a=23;0<=a;a--)b.unshift({level:a,scale:c,resolution:c}),c*=2;return new r({dpi:96,lods:b,origin:new n(0,0,e),size:[d,d],spatialReference:e})}f=q.getInfo(e);a=a.origin?new n({x:a.origin.x,y:a.origin.y,spatialReference:e}):f?new n({x:f.origin[0],y:f.origin[1],
spatialReference:e}):new n({x:0,y:0,spatialReference:e});f=1/(39.37*G.getMetersPerUnitForSR(e)*96);const v=[];if(c)for(b=0;b<c.length;b++){var p=c[b];v.push({level:b,scale:p,resolution:p*f})}else{var u=q.isGeographic(e)?512/d*5.916575275917094E8:256/d*5.91657527591555E8;c=Math.ceil(24/b);v.push({level:0,scale:u,resolution:u*f});for(p=1;p<c;p++)u/=Math.pow(2,b),v.push({level:p,scale:u,resolution:u*f})}return new r({dpi:96,lods:v,origin:a,size:[d,d],spatialReference:e})};var k=t.prototype;k.readOrigin=
function(a,b){return n.fromJSON({spatialReference:b.spatialReference,...a})};k.readSize=function(a,b){return[b.cols,b.rows]};k.writeSize=function(a,b){b.cols=a[0];b.rows=a[0]};k.zoomToScale=function(a){const b=this.scales;if(0>=a)return b[0];if(a>=b.length)return b[b.length-1];{const c=Math.round(a);return b[c]+(c-a)*(b[Math.round(a-.5)]-b[c])}};k.scaleToZoom=function(a){const b=this.scales,c=b.length-1;let d=0;for(;d<c;d++){const e=b[d],f=b[d+1];if(e<=a)break;if(f===a)return d+1;if(e>a&&f<a)return d+
1-(a-f)/(e-f)}return d};k.snapScale=function(a,b=.95){a=this.scaleToZoom(a);return a%Math.floor(a)>=b?this.zoomToScale(Math.ceil(a)):this.zoomToScale(Math.floor(a))};k.tileAt=function(a,b,c,d){var e=this.lodAt(a);if(!e)return null;let f;if("number"===typeof b)f=b,b=c;else{if(q.equals(b.spatialReference,this.spatialReference))f=b.x,b=b.y;else{d=F.project(b,this.spatialReference);if(!d)return null;f=d.x;b=d.y}d=c}c=e.resolution*this.size[0];e=e.resolution*this.size[1];d||(d={id:null,level:0,row:0,col:0,
extent:B.create()});d.level=a;d.row=Math.floor((this.origin.y-b)/e+.001);d.col=Math.floor((f-this.origin.x)/c+.001);this.updateTileInfo(d);return d};k.updateTileInfo=function(a){var b=this.lodAt(a.level);if(b){var c=b.resolution*this.size[0];b=b.resolution*this.size[1];a.id=`${a.level}/${a.row}/${a.col}`;a.extent||(a.extent=B.create());a.extent[0]=this.origin.x+a.col*c;a.extent[1]=this.origin.y-(a.row+1)*b;a.extent[2]=a.extent[0]+c;a.extent[3]=a.extent[1]+b}};k.upsampleTile=function(a){const b=this._upsampleLevels[a.level];
if(!b||-1===b.parentLevel)return!1;a.level=b.parentLevel;a.row=Math.floor(a.row/b.factor+.001);a.col=Math.floor(a.col/b.factor+.001);this.updateTileInfo(a);return!0};k.getTileBounds=function(a,b){var {resolution:c}=this.lodAt(b.level);const d=c*this.size[0];c*=this.size[1];a[0]=this.origin.x+b.col*d;a[1]=this.origin.y-(b.row+1)*c;a[2]=a[0]+d;a[3]=a[1]+c;return a};k.lodAt=function(a){return this._levelToLOD&&this._levelToLOD[a]||null};k.clone=function(){return r.fromJSON(this.write({}))};k._initializeUpsampleLevels=
function(){const a=this.lods;this._upsampleLevels=[];let b=null;for(let c=0;c<a.length;c++){const d=a[c];this._upsampleLevels[d.level]={parentLevel:b?b.level:-1,factor:b?b.resolution/d.resolution:0};b=d}};y._createClass(t,[{key:"isWrappable",get:function(){const {spatialReference:a,origin:b}=this;if(a&&b){const c=q.getInfo(a);return a.isWrappable&&Math.abs(c.origin[0]-b.x)<=c.dx}return!1}},{key:"lods",set:function(a){let b=0,c=0;const d=[];this._levelToLOD={};a&&(b=-Infinity,c=Infinity,a.forEach(e=>
{d.push(e.scale);b=e.scale>b?e.scale:b;c=e.scale<c?e.scale:c;this._levelToLOD[e.level]=e}));this._set("scales",d);this._set("minScale",b);this._set("maxScale",c);this._set("lods",a);this._initializeUpsampleLevels()}}]);return t}(g.JSONSupport);h.__decorate([l.property({type:Number,json:{write:!0}})],g.prototype,"compressionQuality",void 0);h.__decorate([l.property({type:Number,json:{write:!0}})],g.prototype,"dpi",void 0);h.__decorate([l.property({type:String,json:{read:w.read,write:w.write,origins:{"web-scene":{read:!1,
write:!1}}}})],g.prototype,"format",void 0);h.__decorate([l.property({readOnly:!0,dependsOn:["spatialReference","origin"]})],g.prototype,"isWrappable",null);h.__decorate([l.property({type:n,json:{write:!0}})],g.prototype,"origin",void 0);h.__decorate([A.reader("origin")],g.prototype,"readOrigin",null);h.__decorate([l.property({type:[H],value:null,json:{write:!0}})],g.prototype,"lods",null);h.__decorate([l.property({readOnly:!0})],g.prototype,"minScale",void 0);h.__decorate([l.property({readOnly:!0})],
g.prototype,"maxScale",void 0);h.__decorate([l.property({readOnly:!0})],g.prototype,"scales",void 0);h.__decorate([l.property({cast:m=>Array.isArray(m)?m:"number"===typeof m?[m,m]:[256,256]})],g.prototype,"size",void 0);h.__decorate([A.reader("size",["rows","cols"])],g.prototype,"readSize",null);h.__decorate([E.writer("size",{cols:{type:z.Integer},rows:{type:z.Integer}})],g.prototype,"writeSize",null);h.__decorate([l.property({type:x,json:{write:!0}})],g.prototype,"spatialReference",void 0);return g=
r=h.__decorate([D.subclass("esri.layers.support.TileInfo")],g)});