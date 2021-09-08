// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["../../../chunks/_rollupPluginBabelHelpers","../../../core/promiseUtils","../support/shared","../support/IdSet","../support/FeatureSet"],function(v,l,g,p,q){return function(r){function n(a){var b=r.call(this,a)||this;b._topnum=0;b.declaredClass="esri.arcade.featureset.actions.Top";b._countedin=0;b._maxProcessing=100;b._topnum=a.topnum;b._parent=a.parentfeatureset;return b}v._inheritsLoose(n,r);var k=n.prototype;k._getSet=function(a){return null===this._wset?this._ensureLoaded().then(()=>this._parent._getSet(a)).then(b=>
{this._wset=new p(b._candidates.slice(0),b._known.slice(0),!1,this._clonePageDefinition(b.pagesDefinition));this._setKnownLength(this._wset)>this._topnum&&(this._wset._known=this._wset._known.slice(0,this._topnum));this._setKnownLength(this._wset)>=this._topnum&&(this._wset._candidates=[]);return this._wset}):l.resolve(this._wset)};k._setKnownLength=function(a){return 0<a._known.length&&"GETPAGES"===a._known[a._known.length-1]?a._known.length-1:a._known.length};k._isInFeatureSet=function(a){const b=
this._parent._isInFeatureSet(a);if(b===g.IdState.NotInFeatureSet)return b;const f=this._idstates[a];return f===g.IdState.InFeatureSet||f===g.IdState.NotInFeatureSet?f:b===g.IdState.InFeatureSet&&void 0===f?this._countedin<this._topnum?(this._idstates[a]=g.IdState.InFeatureSet,this._countedin++,g.IdState.InFeatureSet):this._idstates[a]=g.IdState.NotInFeatureSet:g.IdState.Unknown};k._expandPagedSet=function(a,b,f,d,e){if(null===this._parent)return l.reject(Error("Parent Paging not implemented"));b>
this._topnum&&(b=this._topnum);return this._countedin>=this._topnum&&a.pagesDefinition.internal.set.length<=a.pagesDefinition.resultOffset?(b=a._known.length,0<b&&"GETPAGES"===a._known[b-1]&&(a._known.length=b-1),b=a._candidates.length,0<b&&"GETPAGES"===a._candidates[b-1]&&(a._candidates.length=b-1),l.resolve("success")):this._parent._expandPagedSet(a,b,f,d,e).then(c=>{this._setKnownLength(a)>this._topnum&&(a._known.length=this._topnum);this._setKnownLength(a)>=this._topnum&&(a._candidates.length=
0);return c})};k._getFeatures=function(a,b,f,d){const e=[];var c=this._maxQueryRate();if(!0===this._checkIfNeedToExpandKnownPage(a,c))return this._expandPagedSet(a,c,0,0,d).then(()=>this._getFeatures(a,b,f,d));-1!==b&&void 0===this._featureCache[b]&&e.push(b);let m=0;for(let h=a._lastFetchedIndex;h<a._known.length&&!(m++,m<=f&&(a._lastFetchedIndex+=1),void 0===this._featureCache[a._known[h]]&&(a._known[h]!==b&&e.push(a._known[h]),e.length>c-1));h++);if(0===e.length)return l.resolve("success");c=new p([],
e,!1,null);const t=Math.min(e.length,f);return this._parent._getFeatures(c,-1,t,d).then(()=>{for(let h=0;h<t;h++){const u=this._parent._featureFromCache(e[h]);void 0!==u&&(this._featureCache[e[h]]=u)}return"success"})};k._getFilteredSet=function(a,b,f,d,e){return this._ensureLoaded().then(()=>this._getSet(e)).then(c=>new p(c._candidates.slice(0).concat(c._known.slice(0)),[],!1,this._clonePageDefinition(c.pagesDefinition)))};k._refineKnowns=function(a,b){let f=0,d=null;const e=[];for(let c=0;c<a._candidates.length;c++){const m=
this._isInFeatureSet(a._candidates[c]);if(m===g.IdState.InFeatureSet){if(a._known.push(a._candidates[c]),f+=1,null===d?d={start:c,end:c}:d.end===c-1?d.end=c:(e.push(d),d={start:c,end:c}),a._known.length>=this._topnum)break}else if(m===g.IdState.NotInFeatureSet)null===d?d={start:c,end:c}:d.end===c-1?d.end=c:(e.push(d),d={start:c,end:c}),f+=1;else if(m===g.IdState.Unknown)break;if(f>=b)break}null!==d&&e.push(d);for(b=e.length-1;0<=b;b--)a._candidates.splice(e[b].start,e[b].end-e[b].start+1);this._setKnownLength(a)>
this._topnum&&(a._known=a._known.slice(0,this._topnum));this._setKnownLength(a)>=this._topnum&&(a._candidates=[])};k._stat=function(){return l.resolve({calculated:!1})};k._canDoAggregates=function(){return l.resolve(!1)};n.registerAction=function(){q._featuresetFunctions.top=function(a){return new n({parentfeatureset:this,topnum:a})}};return n}(q)});