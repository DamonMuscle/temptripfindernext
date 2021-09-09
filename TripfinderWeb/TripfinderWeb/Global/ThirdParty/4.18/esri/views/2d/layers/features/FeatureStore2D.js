// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../chunks/_rollupPluginBabelHelpers ../../../../core/maybe ../../../../core/Evented ../../../../geometry/support/aaBoundingBox ../../../../chunks/rbush ./Store2D".split(" "),function(l,p,m,t,u,v,n){const q={getObjectId(f){return f.getObjectId()},getAttributes(f){return f.readAttributes()},getAttribute(f,g){return f.readAttribute(g)},cloneWithGeometry(f,g){return f},getGeometry(f){return f.readHydratedGeometry()},getCentroid(f,g){return f.readCentroid()}};n=function(f){function g(a,
b){var c=f.call(this,a,b)||this;c.featureAdapter=q;c.events=new t;c._featureSetsByInstance=new Map;c._objectIdToDisplayId=new Map;c._spatialIndexInvalid=!0;c._index=v.rbush(9,d=>({minX:c._storage.getXMin(d),minY:c._storage.getYMin(d),maxX:c._storage.getXMax(d),maxY:c._storage.getYMax(d)}));return c}p._inheritsLoose(g,f);var e=g.prototype;e.onTileData=function(a,b,c){if(m.isNone(b.addOrUpdate))return b;this._featureSetsByInstance.set(b.addOrUpdate.instance,b.addOrUpdate);this._storage=c;b.addOrUpdate._storage=
c;const d=b.addOrUpdate.getCursor();for(;d.next();){const r=d.getObjectId();var h=d.getIndex();h|=d.instance<<16;let k=this._objectIdToDisplayId.get(r);k||(k=c.createDisplayId(),this._objectIdToDisplayId.set(r,k),this._spatialIndexInvalid=!0);d.setDisplayId(k);c.setInstanceId(k,h);this.setComputedAttributes(c,d,k,a.scale)}"update"===b.type&&(this._spatialIndexInvalid=!0);this.events.emit("changed");return b};e.forEach=function(a){this._objectIdToDisplayId.forEach(b=>{b=this._storage.getInstanceId(b);
b=this._lookupFeature(b);a(b)})};e.forEachUnsafe=function(a){this._objectIdToDisplayId.forEach(b=>{var c=this._storage.getInstanceId(b);b=65535&c;c=this._getFeatureSet((4294901760&c)>>>16);c.setIndex(b);a(c)})};e.forEachInBounds=function(a,b){a=this._searchIndex(a);for(const c of a)a=this.lookupFeatureByDisplayId(c,this._storage),b(m.unwrap(a))};e.forEachBounds=function(a,b,c){this._rebuildIndex();const d=[0,0,0,0];for(const h of a)h.readGeometry()&&(a=h.getDisplayId(),d[0]=this._storage.getXMin(a),
d[1]=this._storage.getYMin(a),d[2]=this._storage.getXMax(a),d[3]=this._storage.getYMax(a),b(u.fromRect(c,d)))};e.sweepFeatures=function(a,b,c){this._objectIdToDisplayId.forEach((d,h)=>{a.has(d)||(b.releaseDisplayId(d),c.unsetAttributeData(d),this._objectIdToDisplayId.delete(h))});this.events.emit("changed")};e.sweepFeatureSets=function(a){this._featureSetsByInstance.forEach((b,c)=>{a.has(c)||this._featureSetsByInstance.delete(c)})};e.lookupObjectId=function(a,b){a=this.lookupFeatureByDisplayId(a,
b);return m.isNone(a)?null:a.getObjectId()};e.lookupDisplayId=function(a){return this._objectIdToDisplayId.get(a)};e.lookupFeatureByDisplayId=function(a,b){a=b.getInstanceId(a);return this._lookupFeature(a)};e.lookupByDisplayIdUnsafe=function(a){var b=this._storage.getInstanceId(a);a=65535&b;b=this._getFeatureSet((4294901760&b)>>>16);if(!b)return null;b.setIndex(a);return b};e.hasInstance=function(a){return this._featureSetsByInstance.has(a)};e._rebuildIndex=function(){if(this._spatialIndexInvalid){this._index.clear();
var a=[];this._objectIdToDisplayId.forEach(b=>{const c=this._storage.getInstanceId(b);this._storage.setBounds(b,this._lookupFeature(c))&&a.push(b)});this._index.load(a);this._spatialIndexInvalid=!1}};e._lookupFeature=function(a){const b=65535&a;a=this._getFeatureSet((4294901760&a)>>>16);if(!a)return null;a=a.getCursor();a.setIndex(b);return a};e._getFeatureSet=function(a){return this._featureSetsByInstance.get(a)};e._searchIndex=function(a){this._rebuildIndex();return this._index.search({minX:a[0],
minY:a[1],maxX:a[2],maxY:a[3]})};p._createClass(g,[{key:"storeStatistics",get:function(){return{featureCount:0,vertexCount:0}}}]);return g}(n.Store2D);l.FeatureStore2D=n;l.featureAdapter=q;Object.defineProperty(l,"__esModule",{value:!0})});