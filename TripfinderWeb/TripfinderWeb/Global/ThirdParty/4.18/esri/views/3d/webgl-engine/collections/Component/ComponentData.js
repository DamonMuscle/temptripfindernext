// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["../../../../../chunks/_rollupPluginBabelHelpers","../../../../../core/typedArrayUtil","../../../../../core/maybe","../../lib/AutoDisposable","./IndexRange/ComponentRangeRunLengthEncoded"],function(h,k,g,l,m){function n(f,e,d){const a=[];let c=d.length;e.forEachComponent(b=>{0<f[b]&&(c!==b-1&&(a.length&&a.push(d[c+1]-a[a.length-1]),a.push(d[b])),c=b);return!0});a.length&&a.push(d[c+1]-a[a.length-1]);return a}return function(f){function e(a,c){var b=f.call(this)||this;b.pickability=null;b.highlightCounts=
null;b.cachedGeometryRanges=null;b.cachedHighlightRanges=null;b.offsets=k.slice(c);c=b.count;b.visibility=new m.ComponentRangeRunLengthEncoded(c);b.materialDataBuffer=a.getBuffer(c);b.materialDataIndices=new Uint16Array(c);for(a=0;a<c;a++)b.materialDataIndices[a]=b.materialDataBuffer.acquireIndex();return b}h._inheritsLoose(e,f);var d=e.prototype;d.dispose=function(){f.prototype.dispose.call(this);for(let a=0;a<this.count;a++)this.materialDataBuffer.releaseIndex(this.materialDataIndices[a])};d.highlightsDirty=
function(){this.cachedHighlightRanges=null};d.visibilityDirty=function(){this.cachedHighlightRanges=this.cachedGeometryRanges=null};h._createClass(e,[{key:"count",get:function(){return this.offsets.length-1}},{key:"geometryRanges",get:function(){g.isNone(this.cachedGeometryRanges)&&(this.cachedGeometryRanges=this.visibility.computeOffsetRanges(this.offsets));return this.cachedGeometryRanges}},{key:"highlightRanges",get:function(){if(g.isNone(this.highlightCounts))return null;g.isNone(this.cachedHighlightRanges)&&
(this.cachedHighlightRanges=n(this.highlightCounts,this.visibility,this.offsets));return this.cachedHighlightRanges}}]);return e}(l.AutoDisposable)});