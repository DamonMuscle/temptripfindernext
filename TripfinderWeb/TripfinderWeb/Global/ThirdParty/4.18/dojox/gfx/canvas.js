//>>built
define("./_base dojo/_base/lang dojo/_base/array dojo/_base/declare dojo/_base/window dojo/dom-geometry dojo/dom ./shape ./path ./arc ./matrix ./decompose ./bezierutils".split(" "),function(x,G,O,t,H,V,W,r,I,R,J,A,M){function N(a,c,b,d,e,g,f,k,m,l){var u=c.length,q=0;if(l){var v=l.l/e;q=l.i}else v=c[0]/e;for(;g<f;){if(g+v>f){var K={l:(g+v-f)*e,i:q};v=f-g}q%2||(a.beginPath(),a.arc(b,d,e,g,g+v,k),m&&a.stroke());g+=v;++q;v=c[q%u]/e}return K}function S(a,c,b,d){var e=0,g=0,f=0;if(d){var k=d.l;f=d.i}else k=
c[0];for(;1>g;)g=M.tAtLength(a,k),1==g&&(e=M.computeLength(a),e={l:k-e,i:f}),a=M.splitBezierAtT(a,g),f%2||b.push(a[0]),a=a[1],++f,k=c[f%c.length];return e}function w(a,c,b,d){var e=[c.last.x,c.last.y].concat(b),g=!(a instanceof Array);b=4===b.length?"quadraticCurveTo":"bezierCurveTo";var f=[];c=S(e,c.canvasDash,f,d);for(d=0;d<f.length;++d)e=f[d],g?(a.moveTo(e[0],e[1]),a[b].apply(a,e.slice(2))):(a.push("moveTo",[e[0],e[1]]),a.push(b,e.slice(2)));return c}function n(a,c,b,d,e,g,f){var k=0,m=0,l=0,u=
M.distance(b,d,e,g),q=0;c=c.canvasDash;var v=b,K=d,X=!(a instanceof Array);f?(l=f.l,q=f.i):l+=c[0];for(;.01<Math.abs(1-m);){l>u&&(k={l:l-u,i:q},l=u);m=l/u;f=b+(e-b)*m;var P=d+(g-d)*m;q++%2||(X?(a.moveTo(v,K),a.lineTo(f,P)):(a.push("moveTo",[v,K]),a.push("lineTo",[f,P])));v=f;K=P;l+=c[q%c.length]}return k}var h=x.canvas={},D=null,B=J.multiplyPoint,y=Math.PI,T=2*y,z=y/2;A=G.extend;if(H.global.CanvasRenderingContext2D){H=H.doc.createElement("canvas").getContext("2d");var L="function"==typeof H.setLineDash,
Y="function"==typeof H.fillText}var U={solid:"none",shortdash:[4,1],shortdot:[1,1],shortdashdot:[4,1,1,1],shortdashdotdot:[4,1,1,1,1,1],dot:[1,3],dash:[4,3],longdash:[8,3],dashdot:[4,3,1,3],longdashdot:[8,3,1,3],longdashdotdot:[8,3,1,3,1,3]};h.Shape=t("dojox.gfx.canvas.Shape",r.Shape,{_render:function(a){a.save();this._renderTransform(a);this._renderClip(a);this._renderShape(a);this._renderFill(a,!0);this._renderStroke(a,!0);a.restore()},_renderClip:function(a){this.canvasClip&&(this.canvasClip.render(a),
a.clip())},_renderTransform:function(a){if("canvasTransform"in this){var c=this.canvasTransform;a.translate(c.dx,c.dy);a.rotate(c.angle2);a.scale(c.sx,c.sy);a.rotate(c.angle1)}},_renderShape:function(a){},_renderFill:function(a,c){if("canvasFill"in this){var b=this.fillStyle;if("canvasFillImage"in this){var d=b.width,e=b.height,g=this.canvasFillImage.width,f=this.canvasFillImage.height,k=Math.min(d==g?1:d/g,e==f?1:e/f),m=(d-k*g)/2,l=(e-k*f)/2;D.width=d;D.height=e;var u=D.getContext("2d");u.clearRect(0,
0,d,e);u.drawImage(this.canvasFillImage,0,0,g,f,m,l,k*g,k*f);this.canvasFill=a.createPattern(D,"repeat");delete this.canvasFillImage}a.fillStyle=this.canvasFill;c&&("pattern"!==b.type||0===b.x&&0===b.y||a.translate(b.x,b.y),a.fill())}else a.fillStyle="rgba(0,0,0,0.0)"},_renderStroke:function(a,c){var b=this.strokeStyle;b?(a.strokeStyle=b.color.toString(),a.lineWidth=b.width,a.lineCap=b.cap,"number"==typeof b.join?(a.lineJoin="miter",a.miterLimit=b.join):a.lineJoin=b.join,this.canvasDash?L?(a.setLineDash(this.canvasDash),
c&&a.stroke()):this._renderDashedStroke(a,c):c&&a.stroke()):c||(a.strokeStyle="rgba(0,0,0,0.0)")},_renderDashedStroke:function(a,c){},getEventSource:function(){return null},on:function(){},connect:function(){},disconnect:function(){},canvasClip:null,setClip:function(a){this.inherited(arguments);var c=a?"width"in a?"rect":"cx"in a?"ellipse":"points"in a?"polyline":"d"in a?"path":null:null;if(a&&!c)return this;this.canvasClip=a?Z(c,a):null;this.parent&&this.parent._makeDirty();return this}});var Z=
function(a,c){switch(a){case "ellipse":return{canvasEllipse:Q({shape:c}),render:function(b){return h.Ellipse.prototype._renderShape.call(this,b)}};case "rect":return{shape:G.delegate(c,{r:0}),render:function(b){return h.Rect.prototype._renderShape.call(this,b)}};case "path":return{canvasPath:aa(c),render:function(b){this.canvasPath._renderShape(b)}};case "polyline":return{canvasPolyline:c.points,render:function(b){return h.Polyline.prototype._renderShape.call(this,b)}}}return null},aa=function(a){var c=
new dojox.gfx.canvas.Path;c.canvasPath=[];c._setPath(a.d);return c},E=function(a,c,b){var d=a.prototype[c];a.prototype[c]=b?function(){this.parent&&this.parent._makeDirty();d.apply(this,arguments);b.call(this);return this}:function(){this.parent&&this.parent._makeDirty();return d.apply(this,arguments)}};E(h.Shape,"setTransform",function(){this.matrix?this.canvasTransform=x.decompose(this.matrix):delete this.canvasTransform});E(h.Shape,"setFill",function(){var a=this.fillStyle;if(a){if("object"==typeof a&&
"type"in a){var c=this.surface.rawNode.getContext("2d");switch(a.type){case "linear":case "radial":var b="linear"==a.type?c.createLinearGradient(a.x1,a.y1,a.x2,a.y2):c.createRadialGradient(a.cx,a.cy,0,a.cx,a.cy,a.r);O.forEach(a.colors,function(d){b.addColorStop(d.offset,x.normalizeColor(d.color).toString())});break;case "pattern":D||(D=document.createElement("canvas")),c=new Image,this.surface.downloadImage(c,a.src),this.canvasFillImage=c}}else b=a.toString();this.canvasFill=b}else delete this.canvasFill});
E(h.Shape,"setStroke",function(){var a=this.strokeStyle;if(a){var c=this.strokeStyle.style.toLowerCase();c in U&&(c=U[c]);if(c instanceof Array){this.canvasDash=c=c.slice();var b;for(b=0;b<c.length;++b)c[b]*=a.width;if("butt"!=a.cap){for(b=0;b<c.length;b+=2)c[b]-=a.width,1>c[b]&&(c[b]=1);for(b=1;b<c.length;b+=2)c[b]+=a.width}}else delete this.canvasDash}else delete this.canvasDash;this._needsDash=!L&&!!this.canvasDash});E(h.Shape,"setShape");h.Group=t("dojox.gfx.canvas.Group",h.Shape,{constructor:function(){r.Container._init.call(this)},
_render:function(a){a.save();this._renderTransform(a);this._renderClip(a);for(var c=0;c<this.children.length;++c)this.children[c]._render(a);a.restore()},destroy:function(){r.Container.clear.call(this,!0);h.Shape.prototype.destroy.apply(this,arguments)}});h.Rect=t("dojox.gfx.canvas.Rect",[h.Shape,r.Rect],{_renderShape:function(a){var c=this.shape,b=Math.min(c.r,c.height/2,c.width/2),d=c.x,e=d+c.width,g=c.y;c=g+c.height;var f=d+b,k=e-b,m=g+b,l=c-b;a.beginPath();a.moveTo(f,g);b?(a.arc(k,m,b,-z,0,!1),
a.arc(k,l,b,0,z,!1),a.arc(f,l,b,z,y,!1),a.arc(f,m,b,y,y+z,!1)):(a.lineTo(k,g),a.lineTo(e,l),a.lineTo(f,c),a.lineTo(d,m));a.closePath()},_renderDashedStroke:function(a,c){var b=this.shape,d=Math.min(b.r,b.height/2,b.width/2),e=b.x,g=e+b.width,f=b.y,k=f+b.height,m=e+d,l=g-d,u=f+d,q=k-d;d?(a.beginPath(),b=n(a,this,m,f,l,f),c&&a.stroke(),b=N(a,this.canvasDash,l,u,d,-z,0,!1,c,b),a.beginPath(),b=n(a,this,g,u,g,q,b),c&&a.stroke(),b=N(a,this.canvasDash,l,q,d,0,z,!1,c,b),a.beginPath(),b=n(a,this,l,k,m,k,b),
c&&a.stroke(),b=N(a,this.canvasDash,m,q,d,z,y,!1,c,b),a.beginPath(),b=n(a,this,e,q,e,u,b),c&&a.stroke(),N(a,this.canvasDash,m,u,d,y,y+z,!1,c,b)):(a.beginPath(),b=n(a,this,m,f,l,f),b=n(a,this,l,f,g,q,b),b=n(a,this,g,q,m,k,b),n(a,this,m,k,e,u,b),c&&a.stroke())}});var C=[];(function(){var a=R.curvePI4;C.push(a.s,a.c1,a.c2,a.e);for(var c=45;360>c;c+=45){var b=J.rotateg(c);C.push(B(b,a.c1),B(b,a.c2),B(b,a.e))}})();var Q=function(a){var c=[],b=a.shape,d=J.normalize([J.translate(b.cx,b.cy),J.scale(b.rx,
b.ry)]);var e=B(d,C[0]);c.push([e.x,e.y]);for(b=1;b<C.length;b+=3){var g=B(d,C[b]);var f=B(d,C[b+1]);e=B(d,C[b+2]);c.push([g.x,g.y,f.x,f.y,e.x,e.y])}if(a._needsDash){e=[];g=c[0];for(b=1;b<c.length;++b)f=[],S(g.concat(c[b]),a.canvasDash,f),g=[c[b][4],c[b][5]],e.push(f);a._dashedPoints=e}return c};h.Ellipse=t("dojox.gfx.canvas.Ellipse",[h.Shape,r.Ellipse],{setShape:function(){this.inherited(arguments);this.canvasEllipse=Q(this);return this},setStroke:function(){this.inherited(arguments);L||(this.canvasEllipse=
Q(this));return this},_renderShape:function(a){var c=this.canvasEllipse,b;a.beginPath();a.moveTo.apply(a,c[0]);for(b=1;b<c.length;++b)a.bezierCurveTo.apply(a,c[b]);a.closePath()},_renderDashedStroke:function(a,c){var b=this._dashedPoints;a.beginPath();for(var d=0;d<b.length;++d)for(var e=b[d],g=0;g<e.length;++g){var f=e[g];a.moveTo(f[0],f[1]);a.bezierCurveTo(f[2],f[3],f[4],f[5],f[6],f[7])}c&&a.stroke()}});h.Circle=t("dojox.gfx.canvas.Circle",[h.Shape,r.Circle],{_renderShape:function(a){var c=this.shape;
a.beginPath();a.arc(c.cx,c.cy,c.r,0,T,1)},_renderDashedStroke:function(a,c){var b=this.shape,d=0,e=this.canvasDash.length;for(i=0;d<T;){var g=this.canvasDash[i%e]/b.r;i%2||(a.beginPath(),a.arc(b.cx,b.cy,b.r,d,d+g,0),c&&a.stroke());d+=g;++i}}});h.Line=t("dojox.gfx.canvas.Line",[h.Shape,r.Line],{_renderShape:function(a){var c=this.shape;a.beginPath();a.moveTo(c.x1,c.y1);a.lineTo(c.x2,c.y2)},_renderDashedStroke:function(a,c){var b=this.shape;a.beginPath();n(a,this,b.x1,b.y1,b.x2,b.y2);c&&a.stroke()}});
h.Polyline=t("dojox.gfx.canvas.Polyline",[h.Shape,r.Polyline],{setShape:function(){this.inherited(arguments);var a=this.shape.points,c=a[0],b;this.bbox=null;this._normalizePoints();if(a.length)if("number"==typeof c)c=a;else for(c=[],b=0;b<a.length;++b){var d=a[b];c.push(d.x,d.y)}else c=[];this.canvasPolyline=c;return this},_renderShape:function(a){var c=this.canvasPolyline;if(c.length){a.beginPath();a.moveTo(c[0],c[1]);for(var b=2;b<c.length;b+=2)a.lineTo(c[b],c[b+1])}},_renderDashedStroke:function(a,
c){var b=this.canvasPolyline,d=0;a.beginPath();for(var e=0;e<b.length;e+=2)d=n(a,this,b[e],b[e+1],b[e+2],b[e+3],d);c&&a.stroke()}});h.Image=t("dojox.gfx.canvas.Image",[h.Shape,r.Image],{setShape:function(){this.inherited(arguments);var a=new Image;this.surface.downloadImage(a,this.shape.src);this.canvasImage=a;return this},_renderShape:function(a){var c=this.shape;a.drawImage(this.canvasImage,c.x,c.y,c.width,c.height)}});h.Text=t("dojox.gfx.canvas.Text",[h.Shape,r.Text],{_setFont:function(){this.fontStyle?
this.canvasFont=x.makeFontString(this.fontStyle):delete this.canvasFont},getTextWidth:function(){var a=this.shape,c=0;if(a.text){var b=this.surface.rawNode.getContext("2d");b.save();this._renderTransform(b);this._renderFill(b,!1);this._renderStroke(b,!1);this.canvasFont&&(b.font=this.canvasFont);c=b.measureText(a.text).width;b.restore()}return c},_render:function(a){a.save();this._renderTransform(a);this._renderFill(a,!1);this._renderStroke(a,!1);this._renderShape(a);a.restore()},_renderShape:function(a){var c=
this.shape;c.text&&(a.textAlign="middle"===c.align?"center":c.align,this.canvasFont&&(a.font=this.canvasFont),this.canvasFill&&a.fillText(c.text,c.x,c.y),this.strokeStyle&&(a.beginPath(),a.strokeText(c.text,c.x,c.y),a.closePath()))}});E(h.Text,"setFont");Y||h.Text.extend({getTextWidth:function(){return 0},getBoundingBox:function(){return null},_renderShape:function(){}});var ba={M:"_moveToA",m:"_moveToR",L:"_lineToA",l:"_lineToR",H:"_hLineToA",h:"_hLineToR",V:"_vLineToA",v:"_vLineToR",C:"_curveToA",
c:"_curveToR",S:"_smoothCurveToA",s:"_smoothCurveToR",Q:"_qCurveToA",q:"_qCurveToR",T:"_qSmoothCurveToA",t:"_qSmoothCurveToR",A:"_arcTo",a:"_arcTo",Z:"_closePath",z:"_closePath"};h.Path=t("dojox.gfx.canvas.Path",[h.Shape,I.Path],{constructor:function(){this.lastControl={}},setShape:function(){this.canvasPath=[];this._dashedPath=[];return this.inherited(arguments)},setStroke:function(){this.inherited(arguments);L||(this.segmented=!1,this._confirmSegmented());return this},_setPath:function(){this._dashResidue=
null;this.inherited(arguments)},_updateWithSegment:function(a){var c=G.clone(this.last);this[ba[a.action]](this.canvasPath,a.action,a.args,this._needsDash?this._dashedPath:null);this.last=c;this.inherited(arguments)},_renderShape:function(a){var c=this.canvasPath;a.beginPath();for(var b=0;b<c.length;b+=2)a[c[b]].apply(a,c[b+1])},_renderDashedStroke:L?function(){}:function(a,c){var b=this._dashedPath;a.beginPath();for(var d=0;d<b.length;d+=2)a[b[d]].apply(a,b[d+1]);c&&a.stroke()},_moveToA:function(a,
c,b,d){a.push("moveTo",[b[0],b[1]]);d&&d.push("moveTo",[b[0],b[1]]);for(c=2;c<b.length;c+=2)a.push("lineTo",[b[c],b[c+1]]),d&&(this._dashResidue=n(d,this,b[c-2],b[c-1],b[c],b[c+1],this._dashResidue));this.last.x=b[b.length-2];this.last.y=b[b.length-1];this.lastControl={}},_moveToR:function(a,c,b,d){c="x"in this.last?[this.last.x+=b[0],this.last.y+=b[1]]:[this.last.x=b[0],this.last.y=b[1]];a.push("moveTo",c);d&&d.push("moveTo",c);for(c=2;c<b.length;c+=2)a.push("lineTo",[this.last.x+=b[c],this.last.y+=
b[c+1]]),d&&(this._dashResidue=n(d,this,d[d.length-1][0],d[d.length-1][1],this.last.x,this.last.y,this._dashResidue));this.lastControl={}},_lineToA:function(a,c,b,d){for(c=0;c<b.length;c+=2)d&&(this._dashResidue=n(d,this,this.last.x,this.last.y,b[c],b[c+1],this._dashResidue)),a.push("lineTo",[b[c],b[c+1]]);this.last.x=b[b.length-2];this.last.y=b[b.length-1];this.lastControl={}},_lineToR:function(a,c,b,d){for(c=0;c<b.length;c+=2)a.push("lineTo",[this.last.x+=b[c],this.last.y+=b[c+1]]),d&&(this._dashResidue=
n(d,this,d[d.length-1][0],d[d.length-1][1],this.last.x,this.last.y,this._dashResidue));this.lastControl={}},_hLineToA:function(a,c,b,d){for(c=0;c<b.length;++c)a.push("lineTo",[b[c],this.last.y]),d&&(this._dashResidue=n(d,this,d[d.length-1][0],d[d.length-1][1],b[c],this.last.y,this._dashResidue));this.last.x=b[b.length-1];this.lastControl={}},_hLineToR:function(a,c,b,d){for(c=0;c<b.length;++c)a.push("lineTo",[this.last.x+=b[c],this.last.y]),d&&(this._dashResidue=n(d,this,d[d.length-1][0],d[d.length-
1][1],this.last.x,this.last.y,this._dashResidue));this.lastControl={}},_vLineToA:function(a,c,b,d){for(c=0;c<b.length;++c)a.push("lineTo",[this.last.x,b[c]]),d&&(this._dashResidue=n(d,this,d[d.length-1][0],d[d.length-1][1],this.last.x,b[c],this._dashResidue));this.last.y=b[b.length-1];this.lastControl={}},_vLineToR:function(a,c,b,d){for(c=0;c<b.length;++c)a.push("lineTo",[this.last.x,this.last.y+=b[c]]),d&&(this._dashResidue=n(d,this,d[d.length-1][0],d[d.length-1][1],this.last.x,this.last.y,this._dashResidue));
this.lastControl={}},_curveToA:function(a,c,b,d){for(c=0;c<b.length;c+=6)a.push("bezierCurveTo",b.slice(c,c+6)),d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue));this.last.x=b[b.length-2];this.last.y=b[b.length-1];this.lastControl.x=b[b.length-4];this.lastControl.y=b[b.length-3];this.lastControl.type="C"},_curveToR:function(a,c,b,d){for(c=0;c<b.length;c+=6)a.push("bezierCurveTo",[this.last.x+b[c],this.last.y+b[c+1],this.lastControl.x=this.last.x+b[c+2],this.lastControl.y=this.last.y+
b[c+3],this.last.x+b[c+4],this.last.y+b[c+5]]),d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue)),this.last.x+=b[c+4],this.last.y+=b[c+5];this.lastControl.type="C"},_smoothCurveToA:function(a,c,b,d){for(c=0;c<b.length;c+=4){var e="C"==this.lastControl.type;a.push("bezierCurveTo",[e?2*this.last.x-this.lastControl.x:this.last.x,e?2*this.last.y-this.lastControl.y:this.last.y,b[c],b[c+1],b[c+2],b[c+3]]);d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue));this.lastControl.x=
b[c];this.lastControl.y=b[c+1];this.lastControl.type="C"}this.last.x=b[b.length-2];this.last.y=b[b.length-1]},_smoothCurveToR:function(a,c,b,d){for(c=0;c<b.length;c+=4){var e="C"==this.lastControl.type;a.push("bezierCurveTo",[e?2*this.last.x-this.lastControl.x:this.last.x,e?2*this.last.y-this.lastControl.y:this.last.y,this.last.x+b[c],this.last.y+b[c+1],this.last.x+b[c+2],this.last.y+b[c+3]]);d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue));this.lastControl.x=this.last.x+b[c];this.lastControl.y=
this.last.y+b[c+1];this.lastControl.type="C";this.last.x+=b[c+2];this.last.y+=b[c+3]}},_qCurveToA:function(a,c,b,d){for(c=0;c<b.length;c+=4)a.push("quadraticCurveTo",b.slice(c,c+4));d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue));this.last.x=b[b.length-2];this.last.y=b[b.length-1];this.lastControl.x=b[b.length-4];this.lastControl.y=b[b.length-3];this.lastControl.type="Q"},_qCurveToR:function(a,c,b,d){for(c=0;c<b.length;c+=4)a.push("quadraticCurveTo",[this.lastControl.x=this.last.x+
b[c],this.lastControl.y=this.last.y+b[c+1],this.last.x+b[c+2],this.last.y+b[c+3]]),d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue)),this.last.x+=b[c+2],this.last.y+=b[c+3];this.lastControl.type="Q"},_qSmoothCurveToA:function(a,c,b,d){for(c=0;c<b.length;c+=2){var e="Q"==this.lastControl.type;a.push("quadraticCurveTo",[this.lastControl.x=e?2*this.last.x-this.lastControl.x:this.last.x,this.lastControl.y=e?2*this.last.y-this.lastControl.y:this.last.y,b[c],b[c+1]]);d&&(this._dashResidue=
w(d,this,a[a.length-1],this._dashResidue));this.lastControl.type="Q"}this.last.x=b[b.length-2];this.last.y=b[b.length-1]},_qSmoothCurveToR:function(a,c,b,d){for(c=0;c<b.length;c+=2){var e="Q"==this.lastControl.type;a.push("quadraticCurveTo",[this.lastControl.x=e?2*this.last.x-this.lastControl.x:this.last.x,this.lastControl.y=e?2*this.last.y-this.lastControl.y:this.last.y,this.last.x+b[c],this.last.y+b[c+1]]);d&&(this._dashResidue=w(d,this,a[a.length-1],this._dashResidue));this.lastControl.type="Q";
this.last.x+=b[c];this.last.y+=b[c+1]}},_arcTo:function(a,c,b,d){c="a"==c;for(var e=0;e<b.length;e+=7){var g=b[e+5],f=b[e+6];c&&(g+=this.last.x,f+=this.last.y);var k=R.arcAsBezier(this.last,b[e],b[e+1],b[e+2],b[e+3]?1:0,b[e+4]?1:0,g,f);O.forEach(k,function(m){a.push("bezierCurveTo",m)});d&&(this._dashResidue=w(d,this,p,this._dashResidue));this.last.x=g;this.last.y=f}this.lastControl={}},_closePath:function(a,c,b,d){a.push("closePath",[]);d&&(this._dashResidue=n(d,this,this.last.x,this.last.y,d[1][0],
d[1][1],this._dashResidue));this.lastControl={}}});O.forEach("moveTo lineTo hLineTo vLineTo curveTo smoothCurveTo qCurveTo qSmoothCurveTo arcTo closePath".split(" "),function(a){E(h.Path,a)});h.TextPath=t("dojox.gfx.canvas.TextPath",[h.Shape,I.TextPath],{_renderShape:function(a){},_setText:function(){},_setFont:function(){}});h.Surface=t("dojox.gfx.canvas.Surface",r.Surface,{constructor:function(){r.Container._init.call(this);this.pendingImageCount=0;this.makeDirty()},destroy:function(){r.Container.clear.call(this,
!0);this.inherited(arguments)},setDimensions:function(a,c){this.width=x.normalizedLength(a);this.height=x.normalizedLength(c);if(!this.rawNode)return this;a=!1;this.rawNode.width!=this.width&&(this.rawNode.width=this.width,a=!0);this.rawNode.height!=this.height&&(this.rawNode.height=this.height,a=!0);a&&this.makeDirty();return this},getDimensions:function(){return this.rawNode?{width:this.rawNode.width,height:this.rawNode.height}:null},_render:function(a){!this.rawNode||!a&&this.pendingImageCount||
(a=this.rawNode.getContext("2d"),a.clearRect(0,0,this.rawNode.width,this.rawNode.height),this.render(a),"pendingRender"in this&&(clearTimeout(this.pendingRender),delete this.pendingRender))},render:function(a){a.save();for(var c=0;c<this.children.length;++c)this.children[c]._render(a);a.restore()},makeDirty:function(){this.pendingImagesCount||"pendingRender"in this||this._batch||(this.pendingRender=setTimeout(G.hitch(this,this._render),0))},downloadImage:function(a,c){var b=G.hitch(this,this.onImageLoad);
!this.pendingImageCount++&&"pendingRender"in this&&(clearTimeout(this.pendingRender),delete this.pendingRender);a.onload=b;a.onerror=b;a.onabort=b;a.src=c},onImageLoad:function(){--this.pendingImageCount||(this.onImagesLoaded(),this._render())},onImagesLoaded:function(){},getEventSource:function(){return null},connect:function(){},disconnect:function(){},on:function(){}});h.createSurface=function(a,c,b){if(!c&&!b){var d=V.position(a);c=c||d.w;b=b||d.h}"number"==typeof c&&(c+="px");"number"==typeof b&&
(b+="px");d=new h.Surface;a=W.byId(a);var e=a.ownerDocument.createElement("canvas");e.width=x.normalizedLength(c);e.height=x.normalizedLength(b);a.appendChild(e);d.rawNode=e;d._parent=a;return d.surface=d};var F=r.Container;t={openBatch:function(){++this._batch;return this},closeBatch:function(){this._batch=0<this._batch?--this._batch:0;this._makeDirty();return this},_makeDirty:function(){this._batch||this.surface.makeDirty()},add:function(a){this._makeDirty();return F.add.apply(this,arguments)},
remove:function(a,c){this._makeDirty();return F.remove.apply(this,arguments)},clear:function(){this._makeDirty();return F.clear.apply(this,arguments)},getBoundingBox:F.getBoundingBox,_moveChildToFront:function(a){this._makeDirty();return F._moveChildToFront.apply(this,arguments)},_moveChildToBack:function(a){this._makeDirty();return F._moveChildToBack.apply(this,arguments)}};I={createObject:function(a,c){a=new a;a.surface=this.surface;a.setShape(c);this.add(a);return a}};A(h.Group,t);A(h.Group,r.Creator);
A(h.Group,I);A(h.Surface,t);A(h.Surface,r.Creator);A(h.Surface,I);h.fixTarget=function(a,c){return!0};return h});