//>>built
define(["dojo/_base/lang","../util/oo","./_Base","../manager/_registry"],function(f,d,g,h){d=d.declare(g,function(a){},{type:"dojox.drawing.stencil.Ellipse",anchorType:"group",baseRender:!0,dataToPoints:function(a){a=a||this.data;var b=a.cx-a.rx,c=a.cy-a.ry,e=2*a.rx;a=2*a.ry;return this.points=[{x:b,y:c},{x:b+e,y:c},{x:b+e,y:c+a},{x:b,y:c+a}]},pointsToData:function(a){a=a||this.points;var b=a[0];a=a[2];return this.data={cx:b.x+(a.x-b.x)/2,cy:b.y+(a.y-b.y)/2,rx:.5*(a.x-b.x),ry:.5*(a.y-b.y)}},_create:function(a,
b,c){this.remove(this[a]);this[a]=this.container.createEllipse(b).setStroke(c).setFill(c.fill);this._setNodeAtts(this[a])},render:function(){this.onBeforeRender(this);this.renderHit&&this._create("hit",this.data,this.style.currentHit);this._create("shape",this.data,this.style.current)}});f.setObject("dojox.drawing.stencil.Ellipse",d);h.register({name:"dojox.drawing.stencil.Ellipse"},"stencil");return d});