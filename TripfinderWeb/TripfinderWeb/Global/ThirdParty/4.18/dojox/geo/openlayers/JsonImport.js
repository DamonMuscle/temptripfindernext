//>>built
define("dojo/_base/declare dojo/_base/xhr dojo/_base/lang dojo/_base/array ./LineString ./Collection ./GeometryFeature".split(" "),function(v,w,m,x,y,z,u){return v("dojox.geo.openlayers.JsonImport",null,{constructor:function(b){this._params=b},loadData:function(){w.get({url:this._params.url,handleAs:"json",sync:!0,load:m.hitch(this,this._gotData),error:m.hitch(this,this._loadError)})},_gotData:function(b){var c=this._params.nextFeature;if(m.isFunction(c)){var a=b.layerExtent,d=a[0],e=a[1],f=d+a[2],
g=e+a[3];a=b.layerExtentLL;var h=a[0],k=a[1],p=k+a[3],l=h+a[2];b=b.features;for(var n in b){a=b[n].shape;var q=null;if(m.isArray(a[0])){var r=[];x.forEach(a,function(t){t=this._makeGeometry(t,d,e,f,g,h,p,l,k);r.push(t)},this);a=new z(r);q=new u(a)}else q=this._makeFeature(a,d,e,f,g,h,p,l,k);c.call(this,q)}c=this._params.complete;m.isFunction(c)&&c.call(this,c)}},_makeGeometry:function(b,c,a,d,e,f,g,h,k){for(var p=[],l=0,n=0;n<b.length-1;n+=2){var q=b[n+1];l=(b[n]-c)/(d-c);var r=l*(h-f)+f;l=(q-a)/
(e-a);p.push({x:r,y:l*(k-g)+g})}return new y(p)},_makeFeature:function(b,c,a,d,e,f,g,h,k){b=this._makeGeometry(b,c,a,d,e,f,g,h,k);return new u(b)},_loadError:function(){var b=this._params.error;m.isFunction(b)&&b.apply(this,parameters)}})});