// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../core/maybe ../../../symbols/SimpleLineSymbol ../../../symbols/SimpleMarkerSymbol ../../../Graphic ../../../layers/GraphicsLayer".split(" "),function(c,f,g,h,k,l){let q=function(){function d(b){this._view=b;this._graphicsLayer=new l({listMode:"hide"});this._view.map.add(this._graphicsLayer)}var e=d.prototype;e.destroy=function(){this._view.map.remove(this._graphicsLayer);this._graphicsLayer.destroy();this._graphicsLayer=null};e.update=function(b){for(;this._graphicsLayer.graphics.length>
b.length;)this._graphicsLayer.graphics.pop().destroy();for(;this._graphicsLayer.graphics.length<b.length;)this._graphicsLayer.add(new k({symbol:new h({size:6,outline:new g({color:[255,255,255,1],width:1})})}));b.forEach((a,m)=>{const {color:n,hoveredPoint:p}=a;a=this._graphicsLayer.graphics.getItemAt(m);a.geometry=p.clone();f.isSome(a.symbol)&&"simple-marker"===a.symbol.type&&(a.symbol.color=n)})};return d}();c.HoveredPoints2D=q;Object.defineProperty(c,"__esModule",{value:!0})});