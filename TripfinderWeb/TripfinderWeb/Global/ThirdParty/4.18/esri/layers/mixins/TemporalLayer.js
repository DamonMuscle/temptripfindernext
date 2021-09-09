// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/reader ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../support/fieldUtils ../support/timeUtils ../../TimeExtent ../../TimeInterval ../support/TimeInfo".split(" "),function(g,
h,d,u,v,w,e,x,m,n,y,z,A,p,q,r,k,t){g.TemporalLayer=a=>{a=function(l){function f(){var b=l.apply(this,arguments)||this;b.timeExtent=null;b.timeOffset=null;b.useViewTime=!0;return b}h._inheritsLoose(f,l);f.prototype.readOffset=function(b,c){c=c.timeInfo.exportOptions;if(!c)return null;b=c.timeOffset;c=q.timeUnitKebabDictionary.fromJSON(c.timeOffsetUnits);return b&&c?new k({value:b,unit:c}):null};h._createClass(f,[{key:"timeInfo",set:function(b){p.fixTimeInfoFields(b,this.fields);this._set("timeInfo",
b)}}]);return f}(a);d.__decorate([e.property({type:r,json:{write:!1}})],a.prototype,"timeExtent",void 0);d.__decorate([e.property({type:k})],a.prototype,"timeOffset",void 0);d.__decorate([m.reader("service","timeOffset",["timeInfo.exportOptions"])],a.prototype,"readOffset",null);d.__decorate([e.property({value:null,type:t,json:{write:!0,origins:{"web-document":{read:!1,write:!1}}}})],a.prototype,"timeInfo",null);d.__decorate([e.property({type:Boolean,json:{read:{source:"timeAnimation"},write:{target:"timeAnimation"},
origins:{"web-scene":{read:!1,write:!1}}}})],a.prototype,"useViewTime",void 0);return a=d.__decorate([n.subclass("esri.layers.mixins.TemporalLayer")],a)};g.isTemporalLayer=function(a){return void 0!==a.timeInfo};Object.defineProperty(g,"__esModule",{value:!0})});