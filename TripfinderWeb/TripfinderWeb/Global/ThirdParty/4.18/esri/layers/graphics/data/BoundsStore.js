// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../../core/has","../../../chunks/rbush"],function(g,h,k){function l(f,b){e.minX=b[0];e.minY=b[1];e.maxX=b[2];e.maxY=b[3];return f.search(e)}const e={minX:0,minY:0,maxX:0,maxY:0};let n=function(){function f(){this._indexInvalid=!1;this._boundsToLoad=[];this._boundsById=new Map;this._idByBounds=new Map;this._index=k.rbush(9,h("csp-restrictions")?a=>({minX:a[0],minY:a[1],maxX:a[2],maxY:a[3]}):["[0]","[1]","[2]","[3]"]);this._loadIndex=()=>{if(this._indexInvalid){const a=Array(this._idByBounds.size);
let c=0;this._idByBounds.forEach((d,m)=>{a[c++]=m});this._indexInvalid=!1;this._index.clear();this._index.load(a)}else this._boundsToLoad.length&&(this._index.load(this._boundsToLoad.filter(a=>this._idByBounds.has(a))),this._boundsToLoad.length=0)}}var b=f.prototype;b.clear=function(){this._indexInvalid=!1;this._boundsToLoad.length=0;this._boundsById.clear();this._idByBounds.clear();this._index.clear()};b.delete=function(a){const c=this._boundsById.get(a);this._boundsById.delete(a);c&&(this._idByBounds.delete(c),
this._indexInvalid||this._index.remove(c))};b.forEachInBounds=function(a,c){this._loadIndex();for(const d of l(this._index,a))c(this._idByBounds.get(d))};b.get=function(a){return this._boundsById.get(a)};b.has=function(a){return this._boundsById.has(a)};b.invalidateIndex=function(){this._indexInvalid||(this._indexInvalid=!0,this._boundsToLoad.length=0)};b.set=function(a,c){if(!this._indexInvalid){const d=this._boundsById.get(a);d&&(this._index.remove(d),this._idByBounds.delete(d))}this._boundsById.set(a,
c);c&&(this._idByBounds.set(c,a),this._indexInvalid||(this._boundsToLoad.push(c),5E4<this._boundsToLoad.length&&this._loadIndex()))};return f}();g.BoundsStore=n;Object.defineProperty(g,"__esModule",{value:!0})});