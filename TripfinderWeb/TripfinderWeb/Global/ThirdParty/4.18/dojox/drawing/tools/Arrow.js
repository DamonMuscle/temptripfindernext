//>>built
define("dojo/_base/lang ../util/oo ../manager/_registry ./Line ../annotations/Arrow ../util/positioning".split(" "),function(e,b,f,g,d,h){b=b.declare(g,function(a){this.arrowStart&&(this.begArrow=new d({stencil:this,idx1:0,idx2:1}));this.arrowEnd&&(this.endArrow=new d({stencil:this,idx1:1,idx2:0}));this.points.length&&(this.render(),a.label&&this.setLabel(a.label))},{draws:!0,type:"dojox.drawing.tools.Arrow",baseRender:!1,arrowStart:!1,arrowEnd:!0,labelPosition:function(){var a=this.data;a=h.label({x:a.x1,
y:a.y1},{x:a.x2,y:a.y2});return{x:a.x,y:a.y}},onUp:function(a){if(!this.created&&this.shape){var c=this.points;this.util.distance(c[0].x,c[0].y,c[1].x,c[1].y)<this.minimumSize?this.remove(this.shape,this.hit):(a=this.util.snapAngle(a,this.angleSnap/180),this.setPoints([{x:c[0].x,y:c[0].y},{x:a.x,y:a.y}]),this.renderedOnce=!0,this.onRender(this))}}});e.setObject("dojox.drawing.tools.Arrow",b);b.setup={name:"dojox.drawing.tools.Arrow",tooltip:"Arrow Tool",iconClass:"iconArrow"};f.register(b.setup,"tool");
return b});