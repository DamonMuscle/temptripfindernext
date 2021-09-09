// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../chunks/_rollupPluginBabelHelpers ../chunks/tslib.es6 ../core/has ../core/maybe ../core/Logger ../core/accessorSupport/ensureType ../core/accessorSupport/decorators/property ../core/jsonMap ../core/accessorSupport/decorators/subclass ../core/urlUtils ../core/uuid ../portal/support/resourceExtension ../geometry/Extent ../geometry ./support/FeatureSet ../chunks/DataLayerSource ./support/AttachmentQuery ./support/Query ./support/RelationshipQuery ./Task ./operations/pbfJSONFeatureSet ./operations/query ./operations/queryAttachments ./operations/queryRelatedRecords".split(" "),
function(x,g,y,p,e,F,k,G,z,H,I,J,A,K,q,r,B,C,t,D,E,l,u,v){e=function(w){function n(a){a=w.call(this,a)||this;a.dynamicDataSource=null;a.format="json";a.gdbVersion=null;a.sourceSpatialReference=null;return a}x._inheritsLoose(n,w);var d=n.prototype;d.execute=function(a,b){return this.executeJSON(a,b).then(c=>q.fromJSON(c))};d.executeJSON=async function(a,b){var c;b={...this.requestOptions,...b};const h=this._normalizeQuery(a);a=null!=(null==(c=a.outStatistics)?void 0:c[0]);c=y("featurelayer-pbf-statistics");
c=!a||c;let f;if("pbf"===this.format&&c){a=!h.quantizationParameters;try{f=(await l.executeQueryPBF(this.parsedUrl,h,new E.JSONFeatureSetParserContext({sourceSpatialReference:this.sourceSpatialReference,applyTransform:a}),b)).data}catch(m){if("query:parsing-pbf"===m.name)this.format="json";else throw m;}}"json"!==this.format&&c||(f=(await l.executeQuery(this.parsedUrl,h,this.sourceSpatialReference,b)).data);this._normalizeFields(f.fields);return f};d.executeForCount=function(a,b){return l.executeQueryForCount(this.parsedUrl,
this._normalizeQuery(a),{...this.requestOptions,...b}).then(c=>c.data.count)};d.executeForExtent=function(a,b){return l.executeQueryForExtent(this.parsedUrl,this._normalizeQuery(a),{...this.requestOptions,...b}).then(c=>({count:c.data.count,extent:A.fromJSON(c.data.extent)}))};d.executeForIds=function(a,b){return l.executeQueryForIds(this.parsedUrl,this._normalizeQuery(a),{...this.requestOptions,...b}).then(c=>c.data.objectIds)};d.executeRelationshipQuery=function(a,b){a=t.from(a);if(this.gdbVersion||
this.dynamicDataSource)a=a.clone(),a.gdbVersion=a.gdbVersion||this.gdbVersion,a.dynamicDataSource=a.dynamicDataSource||this.dynamicDataSource;return v.executeRelationshipQuery(this.parsedUrl,a,{...this.requestOptions,...b}).then(c=>{const h=c.data,f={};Object.keys(h).forEach(m=>f[m]=q.fromJSON(h[m]));return f})};d.executeRelationshipQueryForCount=function(a,b){a=t.from(a);if(this.gdbVersion||this.dynamicDataSource)a=a.clone(),a.gdbVersion=a.gdbVersion||this.gdbVersion,a.dynamicDataSource=a.dynamicDataSource||
this.dynamicDataSource;return v.executeRelationshipQueryForCount(this.parsedUrl,a,{...this.requestOptions,...b}).then(c=>c.data)};d.executeAttachmentQuery=function(a,b){return u.executeAttachmentQuery(this.parsedUrl,B.from(a),{...this.requestOptions,...b}).then(c=>u.processAttachmentQueryResult(c.data.attachmentGroups,this.parsedUrl.path))};d._normalizeQuery=function(a){var b=C.from(a);if(!this.gdbVersion&&!this.dynamicDataSource)return b;b=b===a?b.clone():b;b.gdbVersion=a.gdbVersion||this.gdbVersion;
b.dynamicDataSource=a.dynamicDataSource?r.DataLayerSource.from(a.dynamicDataSource):this.dynamicDataSource;return b};d._normalizeFields=function(a){if(p.isSome(this.fieldsIndex)&&p.isSome(a))for(const b of a)(a=this.fieldsIndex.get(b.name))&&Object.assign(b,a.toJSON())};return n}(D);g.__decorate([k.property({type:r.DataLayerSource})],e.prototype,"dynamicDataSource",void 0);g.__decorate([k.property()],e.prototype,"fieldsIndex",void 0);g.__decorate([k.property()],e.prototype,"format",void 0);g.__decorate([k.property()],
e.prototype,"gdbVersion",void 0);g.__decorate([k.property()],e.prototype,"sourceSpatialReference",void 0);return e=g.__decorate([z.subclass("esri.tasks.QueryTask")],e)});