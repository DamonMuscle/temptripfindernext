//>>built
define("dojo/_base/kernel dojo/_base/declare dojo/_base/connect dojo/_base/array dojo/dom-geometry dojox/mdnd/AreaManager".split(" "),function(k,t,p,q,l,m){k=t("dojox.mdnd.dropMode.OverDropMode",null,{_oldXPoint:null,_oldYPoint:null,_oldBehaviour:"up",constructor:function(){this._dragHandler=[p.connect(m.areaManager(),"onDragEnter",function(a,c){a=m.areaManager();-1==a._oldIndexArea&&(a._oldIndexArea=a._lastValidIndexArea)})]},addArea:function(a,c){var b=a.length,d=l.position(c.node,!0);c.coords=
{x:d.x,y:d.y};if(0==b)a.push(c);else{var e=c.coords.x;for(d=0;d<b;d++)if(e<a[d].coords.x){for(e=b-1;e>=d;e--)a[e+1]=a[e];a[d]=c;break}d==b&&a.push(c)}return a},updateAreas:function(a){for(var c=a.length,b=0;b<c;b++)this._updateArea(a[b])},_updateArea:function(a){var c=l.position(a.node,!0);a.coords.x=c.x;a.coords.x2=c.x+c.w;a.coords.y=c.y},initItems:function(a){q.forEach(a.items,function(c){var b=l.position(c.item.node,!0);c.y=b.y+b.h/2});a.initItems=!0},refreshItems:function(a,c,b,d){if(-1!=c&&a&&
b&&b.h){b=b.h;a.margin&&(b+=a.margin.t);for(var e=a.items.length;c<e;c++){var g=a.items[c];g.y=d?g.y+b:g.y-b}}},getDragPoint:function(a,c,b){return{x:b.x,y:b.y}},getTargetArea:function(a,c,b){var d=0,e=c.x,g=c.y,h=a.length,f=0,r="right",n=!1;-1==b||3>arguments.length?n=!0:this._checkInterval(a,b,e,g)?d=b:(this._oldXPoint<e?f=b+1:(f=b-1,h=0,r="left"),n=!0);if(n)if("right"===r){for(;f<h;f++)if(this._checkInterval(a,f,e,g)){d=f;break}f==h&&(d=-1)}else{for(;f>=h;f--)if(this._checkInterval(a,f,e,g)){d=
f;break}f==h-1&&(d=-1)}this._oldXPoint=e;return d},_checkInterval:function(a,c,b,d){var e=a[c];a=e.coords;c=a.x2;var g=a.y;e=g+e.node.offsetHeight;return a.x<=b&&b<=c&&g<=d&&d<=e?!0:!1},getDropIndex:function(a,c){var b=a.items.length;c=c.y;if(0<b)for(var d=0;d<b;d++){if(c<a.items[d].y)return d;if(d==b-1)break}return-1},destroy:function(){q.forEach(this._dragHandler,p.disconnect)}});m.areaManager()._dropMode=new k;return k});