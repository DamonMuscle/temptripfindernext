// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../../../chunks/_rollupPluginBabelHelpers ../../../../../chunks/tslib.es6 ../../../../../core/has ../../../../../core/maybe ../../../../../core/Logger ../../../../../core/accessorSupport/ensureType ../../../../../core/accessorSupport/decorators/property ../../../../../core/jsonMap ../../../../../core/accessorSupport/decorators/subclass ../../../../../core/urlUtils ../../../../../core/uuid ../../../../../portal/support/resourceExtension ../../../../../core/promiseUtils ../../../../../core/watchUtils ../../../../../layers/graphics/featureConversionUtils ../../../../../layers/support/FieldsIndex ../../../../../core/HandleOwner ../support/FeatureSetReaderJSON ../../../../support/QueueProcessor ../support/AttributeStore ../support/ComputedAttributeStorage ../FeatureStore2D ../../../../../layers/graphics/data/QueryEngine ../support/UpdateToken ../Source2D ../support/ClusterStore".split(" "),
function(v,k,x,r,h,L,l,M,y,N,O,P,g,p,z,A,B,C,D,E,F,G,H,w,I,J){function m(n){if(!g.isAbortError(n)&&"worker:port-closed"!==n.name)throw n;}h=function(n){function t(){var a=n.apply(this,arguments)||this;a._storage=new F.ComputedAttributeStorage;a._markedIdsBufId=a._storage.createBitset();a._lastCleanup=performance.now();a._cleanupNeeded=!1;a._invalidated=!1;a._tileToResolver=new Map;a.tileStore=null;a.config=null;a.processor=null;a.remoteClient=null;a.service=null;a._editing=!1;return a}v._inheritsLoose(t,
n);var c=t.prototype;c.initialize=function(){this._initAttributeStore();this._initStores();this._initQueryEngine();this._initSource();this._updateQueue=new D.QueueProcessor({concurrency:4,process:(a,b)=>this._onDisplayTilePatch(a,{signal:b})});this.handles.add([this.tileStore.on("update",this.onTileUpdate.bind(this)),this.watch("updating",a=>!a&&this.onIdle())])};c.startup=async function(){this._initAttributeStore()};c._initSource=function(){this._source=new I.Source2D(this.service,this.spatialReference,
this.tileStore.tileScheme);this._source.onDisplayTilePatch=(b,e)=>{this._invalidated=!0;return this._patchTile(b,e)};this._source.canAcceptPatch=()=>50>this._updateQueue.length;var a=this._source.sourceEvents;"geoevent"===a.type&&(a=a.events,this.handles.add([a.on("connectionStatus",b=>this.remoteClient.invoke("setProperty",{propertyName:"connectionStatus",value:b}).catch(m)),a.on("errorString",b=>this.remoteClient.invoke("setProperty",{propertyName:"errorString",value:b}).catch(m)),a.on("feature",
b=>this.remoteClient.invoke("emitEvent",{name:"data-received",event:{attributes:b.attributes,centroid:b.centroid,geometry:b.geometry}}).catch(m)),a.on("updateRate",b=>this.remoteClient.invoke("emitEvent",{name:"update-rate",event:{...b}}).catch(m))]))};c._initAttributeStore=function(){this.attributeStore?this.attributeStore.invalidateResources():this.attributeStore=new E["default"]({type:"remote",initialize:(a,b)=>g.ignoreAbortErrors(this.remoteClient.invoke("tileRenderer.featuresView.attributeView.initialize",
a,{signal:b}).catch(m)),update:(a,b)=>g.ignoreAbortErrors(this.remoteClient.invoke("tileRenderer.featuresView.attributeView.requestUpdate",a,{signal:b}).catch(m)),render:a=>g.ignoreAbortErrors(this.remoteClient.invoke("tileRenderer.featuresView.requestRender",void 0,{signal:a}).catch(m))},this.config)};c._initStores=function(){const a={geometryInfo:{geometryType:this.service.geometryType,hasM:!1,hasZ:!1},spatialReference:this.spatialReference,fieldsIndex:this.fieldsIndex,fields:this.service.fields};
this.featureStore=new G.FeatureStore2D(a,this._storage);this.aggregateStore=new J.ClusterStore(a,this.spatialReference,this._storage);this.handles.add(this.aggregateStore.events.on("valueRangesChanged",b=>{this.remoteClient.invoke("emitEvent",{name:"valueRangesChanged",event:{valueRanges:b.valueRanges}}).catch(m)}))};c._initQueryEngine=function(){var a;const b=this;null==(a=this.queryEngine)?void 0:a.destroy();this.queryEngine=new H["default"]({definitionExpression:this.config.definitionExpression,
fields:this.service.fields,geometryType:this.service.geometryType,objectIdField:this.service.objectIdField,hasM:!1,hasZ:!1,spatialReference:this.spatialReference.toJSON(),cacheSpatialQueries:!0,featureStore:this.featureStore,aggregateAdapter:{getFeatureObjectIds(e){return b.aggregateStore.getFeatureDisplayIdsForAggregate(e).map(d=>b.getObjectId(d))}},timeInfo:this.service.timeInfo})};c.destroy=function(){this._updateQueue.destroy();this._source.destroy();this.queryEngine.destroy();this.attributeStore&&
this.attributeStore.destroy()};c.isUpdating=function(){return this._source.updating||!!this._updateQueue.length};c.enableEvent=function(a){this._source.enableEvent(a.name,a.value)};c.invalidate=async function(a){if(a.any()){x("esri-2d-update-debug")&&a.describe();var b=this.tileStore.tiles.map(({key:d})=>{const f=g.createResolver();this._tileToResolver.set(d.id,f);return f.promise}),e=this._updateQueue.takeAll();this._updateQueue.resume();this.hasAggregates&&a.mesh&&a.targets.aggregate&&!a.queryFilter?
this._repushAggregateMeshTiles(a):(this._source.resubscribe(a),g.all(b).then(()=>{this._source.resume()}),a.mesh&&await p.whenFalseOnce(this,"updating"));this.notifyChange("updating");await g.all(b);this._updateQueue.pause();for(const d of e)this._patchTile(d);a.source&&(this._cleanupNeeded=!0)}};c.resume=function(){this._updateQueue.resume();return this._source.resume()};c.update=async function(a,b,e=!1){this._editing&&await p.whenFalseOnce(this,"updating");e&&(this._source.pause(),this._updateQueue.pause());
this._set("config",b);this._schema=b.schema;this._initQueryEngine();await g.all([this._source.update(a,b.schema.source),this.featureStore.updateSchema(a,b.schema.targets.feature),this.attributeStore.update(a,b),this.attributeStore.updateFilters(a,this)]);await this.aggregateStore.updateSchema(a,b.schema.targets.aggregate)};c.refresh=async function(){this._source.resubscribe(w.UpdateToken.all(),!0);this._cleanupNeeded=!0;this.notifyChange("updating");await p.whenFalseOnce(this,"updating",!0)};c.onTileUpdate=
function(a){this.aggregateStore.onTileUpdate(a);for(const b of a.added)this._source.subscribe(b),this._level=b.level;for(const b of a.removed)this._source.unsubscribe(b),this._cleanupNeeded=!0,this._tileToResolver.has(b.id)&&(this._tileToResolver.get(b.id).resolve(),this._tileToResolver.delete(b.id));this.notifyChange("updating")};c.onIdle=function(){this.hasAggregates&&this._invalidated&&(this._repushAggregateMeshTiles(),this._invalidated=!1);this._markAndSweep()};c.onEdits=async function(a){if(this._editing)return await p.whenFalseOnce(this,
"updating"),await g.after(16),this.onEdits(a);this._editing=!0;try{await this._source.onEdits(a),await p.whenFalseOnce(this,"updating")}catch(b){}this._editing=!1};c.queryExtent=function(a){return this.queryEngine.executeQueryForExtent(a)};c.queryFeatures=function(a){return this.queryEngine.executeQuery(a)};c.queryFeatureCount=function(a){return this.queryEngine.executeQueryForCount(a)};c.queryLatestObservations=function(a){return this.queryEngine.executeQueryForLatestObservations(a)};c.queryObjectIds=
function(a){return this.queryEngine.executeQueryForIds(a)};c.queryStatistics=async function(){return{...this.featureStore.storeStatistics,displayedFeatureCount:0,displayedVertexCount:0,displayPreProcessTime:0}};c.getObjectId=function(a){return this.featureStore.lookupObjectId(a,this._storage)};c.getDisplayId=function(a){if(this._schema.targets.aggregate){const b=this.aggregateStore.getDisplayId(a);return r.isNone(b)?(a=this.featureStore.lookupDisplayId(a),this.aggregateStore.getDisplayIdForReferenceId(a)):
b}return this.featureStore.lookupDisplayId(a)};c.getFeature=function(a){a=this.featureStore.lookupFeatureByDisplayId(a,this._storage);if(r.isNone(a))return null;var b=a.readHydratedGeometry();b=z.convertToGeometry(b,a.geometryType,a.hasZ,a.hasM);return{attributes:a.readAttributes(),geometry:b}};c.getAggregate=function(a){return this.aggregateStore.getAggregate(a)};c.setHighlight=async function(a){const b=a.map(e=>this.getDisplayId(e));return this.attributeStore.setHighlight(a,b)};c._repushAggregateMeshTiles=
function(a){for(const b of this.tileStore.tiles)this._patchTile({type:"replace",id:b.key.id,addOrUpdate:C.FeatureSetReaderJSON.fromOptimizedFeatures([],this.service.geometryType),remove:[],end:!0,noData:!1,update:a||w.UpdateToken.create({mesh:!0,targets:{aggregate:!0}})})};c._maybeForceCleanup=function(){5E3<performance.now()-this._lastCleanup&&this._markAndSweep()};c._patchTile=function(a,b){a=this._updateQueue.push(a,b).then(()=>{this.notifyChange("updating")}).catch(e=>{this.notifyChange("updating")});
this.notifyChange("updating");return a};c._onDisplayTilePatch=async function(a,b){g.throwIfAborted(b);const e=this.tileStore.get(a.id);if(e){var d=a.update;a.remove.length&&(this._cleanupNeeded=!0);var f=[];for(const q of a.remove)f.push(this.featureStore.lookupDisplayId(q));a.remove=f;try{if(r.isNone(a.addOrUpdate))this.processor.onTileData(e,{...a,addOrUpdate:null},b).catch(q=>{g.throwIfNotAbortError(q)});else{a.addOrUpdate._storage=this._storage;var u=a.addOrUpdate.hasFilter(),K=a.addOrUpdate.instance;
a.addOrUpdate._arcadeSpatialReference=this.spatialReference;if(!this.featureStore.hasInstance(K)||d.targets.feature&&!u)this.featureStore.onTileData(e,a,this._storage);!d.storage.data&&!d.storage.filters||u||(this.attributeStore.onTileData(e,a),this._source.isStream?await this.attributeStore.sendUpdates():this.attributeStore.sendUpdates());this.hasAggregates&&d.targets.aggregate&&(this.aggregateStore.onTileData(e,a,this._storage,this.attributeStore,d.mesh),d.mesh&&(this.attributeStore.onTileData(e,
a),await this.attributeStore.sendUpdates()));d.mesh&&await this.processor.onTileData(e,a,b);this._maybeForceCleanup()}this._finishedPatch(a)}catch(q){g.throwIfNotAbortError(q)}}};c._finishedPatch=function(a){(a.noData||a.end)&&this._tileToResolver.has(a.id)&&(this._tileToResolver.get(a.id).resolve(),this._tileToResolver.delete(a.id))};c._markAndSweep=function(){this._lastCleanup=performance.now();if(this._cleanupNeeded||this._source.isStream){this._cleanupNeeded=!1;var a=this._storage.getBitset(this._markedIdsBufId),
b=new Set;a.clear();var e=d=>{d=this.featureStore.lookupDisplayId(d);const f=this._storage.getInstanceId(d);d&&(b.add((4294901760&f)>>>16),a.set(d))};for(const d of this.tileStore.tiles)this._source.forEachRequest(d.key.id,f=>{if(!r.isNone(f.features))for(f=f.features.getCursor();f.next();){const u=f.getObjectId();e(u)}});this._source.forEachPendingEdit(d=>e(d));this._updateQueue.forEach(d=>{for(const f of d.remove)e(f)});this.config.schema.targets.aggregate&&(this.aggregateStore.sweepFeatures(a,
this.featureStore),this.aggregateStore.sweepClusters(this._storage,this.attributeStore,this._level));this.featureStore.sweepFeatures(a,this._storage,this.attributeStore);this.featureStore.sweepFeatureSets(b)}};v._createClass(t,[{key:"fieldsIndex",get:function(){return new A(this.service.fields)}},{key:"hasAggregates",get:function(){return!!this.config.schema.targets.aggregate}},{key:"spatialReference",get:function(){return this.tileStore.tileScheme.spatialReference}},{key:"updating",get:function(){return this.isUpdating()}}]);
return t}(B.HandleOwner);k.__decorate([l.property({constructOnly:!0})],h.prototype,"tileStore",void 0);k.__decorate([l.property()],h.prototype,"config",void 0);k.__decorate([l.property({readOnly:!0,dependsOn:["service"]})],h.prototype,"fieldsIndex",null);k.__decorate([l.property()],h.prototype,"processor",void 0);k.__decorate([l.property({constructOnly:!0})],h.prototype,"remoteClient",void 0);k.__decorate([l.property({constructOnly:!0})],h.prototype,"service",void 0);k.__decorate([l.property({dependsOn:["tileStore"]})],
h.prototype,"spatialReference",null);k.__decorate([l.property()],h.prototype,"updating",null);return h=k.__decorate([y.subclass("esri.views.2d.layers.features.controllers.FeatureController2D")],h)});