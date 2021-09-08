//>>built
define("dojo/_base/kernel dojo/_base/lang dojo/_base/connect dojo/_base/html ../gfx ../xml/DomParser ./UndoStack".split(" "),function(f){f.experimental("dojox.sketch");var h=dojox.sketch;h.tools={};h.registerTool=function(b,a){h.tools[b]=a};h.Figure=function(b){var a=this;this.annCounter=1;this.shapes=[];this.imageSrc=this.image=null;this.size={w:0,h:0};this.node=this.group=this.surface=null;this.zoomFactor=1;this.tools=null;this.obj={};f.mixin(this,b);this.selected=[];this.hasSelections=function(){return 0<
this.selected.length};this.isSelected=function(c){for(var e=0;e<a.selected.length;e++)if(a.selected[e]==c)return!0;return!1};this.select=function(c){a.isSelected(c)||(a.clearSelections(),a.selected=[c]);c.setMode(h.Annotation.Modes.View);c.setMode(h.Annotation.Modes.Edit)};this.deselect=function(c){for(var e=-1,g=0;g<a.selected.length;g++)if(a.selected[g]==c){e=g;break}-1<e&&(c.setMode(h.Annotation.Modes.View),a.selected.splice(e,1));return c};this.clearSelections=function(){for(var c=0;c<a.selected.length;c++)a.selected[c].setMode(h.Annotation.Modes.View);
a.selected=[]};this.replaceSelection=function(c,e){if(a.isSelected(e)){for(var g=-1,k=0;k<a.selected.length;k++)if(a.selected[k]==e){g=k;break}-1<g&&a.selected.splice(g,1,c)}else a.select(c)};this._cshape=this._absEnd=this._end=this._start=this._ctool=this._startPoint=this._prevState=this._action=this._lp=this._ctr=this._c=null;this._dblclick=function(c){var e=a._fromEvt(c);if(e)a.onDblClickShape(e,c)};this._keydown=function(c){var e=!1;if(c.ctrlKey)if(90===c.keyCode||122===c.keyCode)a.undo(),e=!0;
else if(89===c.keyCode||121===c.keyCode)a.redo(),e=!0;if(46===c.keyCode||8===c.keyCode)a._delete(a.selected),e=!0;e&&f.stopEvent(c)};this._md=function(c){"vml"==dojox.gfx.renderer&&a.node.focus();var e=a._fromEvt(c);a._startPoint={x:c.pageX,y:c.pageY};a._ctr=f.position(a.node);a._ctr={x:a._ctr.x-a.node.scrollLeft,y:a._ctr.y-a.node.scrollTop};var g=c.clientX-a._ctr.x,k=c.clientY-a._ctr.y;a._lp={x:g,y:k};a._start={x:g,y:k};a._end={x:g,y:k};a._absEnd={x:g,y:k};e?(e.type&&"Anchor"!=e.type()&&(a.isSelected(e)?
a._sameShapeSelected=!0:(a.select(e),a._sameShapeSelected=!1)),e.beginEdit(),a._c=e):(a.clearSelections(),a._ctool.onMouseDown(c))};this._mm=function(c){if(a._ctr)if(a._c&&!a._c.shape)a._clearMouse();else{var e=c.clientX-a._ctr.x,g=c.clientY-a._ctr.y,k=e-a._lp.x,m=g-a._lp.y;a._absEnd={x:e,y:g};if(a._c)a._c.setBinding({dx:k/a.zoomFactor,dy:m/a.zoomFactor}),a._lp={x:e,y:g};else if(a._end={x:k,y:m},e={x:Math.min(a._start.x,a._absEnd.x),y:Math.min(a._start.y,a._absEnd.y),width:Math.abs(a._start.x-a._absEnd.x),
height:Math.abs(a._start.y-a._absEnd.y)},e.width&&e.height)a._ctool.onMouseMove(c,e)}};this._mu=function(c){if(a._c)a._c.shape&&a._c.endEdit();else a._ctool.onMouseUp(c);a._clearMouse()};this._clearMouse=function(){a._c=a._ctr=a._lp=a._action=a._prevState=a._startPoint=null;a._cshape=a._start=a._end=a._absEnd=null};this.initUndoStack()};var d=h.Figure.prototype;d.initUndoStack=function(){this.history=new h.UndoStack(this)};d.setTool=function(b){this._ctool=b};d.gridSize=0;d._calCol=function(b){return this.gridSize?
Math.round(b/this.gridSize)*this.gridSize:b};d._delete=function(b,a){for(var c=0;c<b.length;c++)if(b[c].setMode(h.Annotation.Modes.View),b[c].destroy(a),this.remove(b[c]),this._remove(b[c]),!a)b[c].onRemove();b.splice(0,b.length)};d.onDblClickShape=function(b,a){if(b.onDblClick)b.onDblClick(a)};d.onCreateShape=function(b){};d.onBeforeCreateShape=function(b){};d.initialize=function(b){this.node=b;this.surface=dojox.gfx.createSurface(b,this.size.w,this.size.h);this.group=this.surface.createGroup();
this._cons=[];var a=this.surface.getEventSource();this._cons.push(f.connect(a,"ondraggesture",f.stopEvent),f.connect(a,"ondragenter",f.stopEvent),f.connect(a,"ondragover",f.stopEvent),f.connect(a,"ondragexit",f.stopEvent),f.connect(a,"ondragstart",f.stopEvent),f.connect(a,"onselectstart",f.stopEvent),f.connect(a,"onmousedown",this._md),f.connect(a,"onmousemove",this._mm),f.connect(a,"onmouseup",this._mu),f.connect(a,"onclick",this,"onClick"),f.connect(a,"ondblclick",this._dblclick),f.connect(b,"onkeydown",
this._keydown));this.image=this.group.createImage({width:this.imageSize.w,height:this.imageSize.h,src:this.imageSrc})};d.destroy=function(b){this.node&&(b||(this.history&&this.history.destroy(),this._subscribed&&(f.unsubscribe(this._subscribed),delete this._subscribed)),f.forEach(this._cons,f.disconnect),this._cons=[],f.empty(this.node),this.group=this.surface=null,this.obj={},this.shapes=[])};d.nextKey=function(){return"annotation-"+this.annCounter++};d.draw=function(){};d.zoom=function(b){this.zoomFactor=
b/100;this.surface.setDimensions(this.size.w*this.zoomFactor,this.size.h*this.zoomFactor);this.group.setTransform(dojox.gfx.matrix.scale(this.zoomFactor,this.zoomFactor));for(b=0;b<this.shapes.length;b++)this.shapes[b].zoom(this.zoomFactor)};d.getFit=function(){return 100*Math.min((this.node.parentNode.offsetWidth-5)/this.size.w,(this.node.parentNode.offsetHeight-5)/this.size.h)};d.unzoom=function(){this.zoomFactor=1;this.surface.setDimensions(this.size.w,this.size.h);this.group.setTransform()};d._add=
function(b){this.obj[b._key]=b};d._remove=function(b){this.obj[b._key]&&delete this.obj[b._key]};d._get=function(b){b&&-1<b.indexOf("bounding")?b=b.replace("-boundingBox",""):b&&-1<b.indexOf("-labelShape")&&(b=b.replace("-labelShape",""));return this.obj[b]};d._keyFromEvt=function(b){var a=b.target.id+"";if(0==a.length){b=b.target.parentNode;for(a=this.surface.getEventSource();b&&0==b.id.length&&b!=a;)b=b.parentNode;a=b.id}return a};d._fromEvt=function(b){return this._get(this._keyFromEvt(b))};d.add=
function(b){for(var a=0;a<this.shapes.length;a++)if(this.shapes[a]==b)return!0;this.shapes.push(b);return!0};d.remove=function(b){for(var a=-1,c=0;c<this.shapes.length;c++)if(this.shapes[c]==b){a=c;break}-1<a&&this.shapes.splice(a,1);return b};d.getAnnotator=function(b){for(var a=0;a<this.shapes.length;a++)if(this.shapes[a].id==b)return this.shapes[a];return null};d.convert=function(b,a){var c=a+"Annotation";if(h[c]){var e=b.type(),g=b.id;a=b.label;var k=b.mode;switch(e){case "Preexisting":case "Lead":var m=
{dx:b.transform.dx,dy:b.transform.dy};var l={x:b.start.x,y:b.start.y};var n={x:b.end.x,y:b.end.y};var p={x:n.x-(n.x-l.x)/2,y:n.y-(n.y-l.y)/2};break;case "SingleArrow":case "DoubleArrow":m={dx:b.transform.dx,dy:b.transform.dy};l={x:b.start.x,y:b.start.y};n={x:b.end.x,y:b.end.y};p={x:b.control.x,y:b.control.y};break;case "Underline":m={dx:b.transform.dx,dy:b.transform.dy},l={x:b.start.x,y:b.start.y},p={x:l.x+50,y:l.y+50},n={x:l.x+100,y:l.y+100}}c=new h[c](this,g);"Underline"==c.type()?c.transform={dx:m.dx+
l.x,dy:m.dy+l.y}:(c.transform&&(c.transform=m),c.start&&(c.start=l));c.end&&(c.end=n);c.control&&(c.control=p);c.label=a;c.token=f.lang.shallowCopy(b.token);c.initialize();this.replaceSelection(c,b);this._remove(b);this.remove(b);b.destroy();c.setMode(k)}};d.setValue=function(b){b=dojox.xml.DomParser.parse(b);this.load(b,this.node)};d.load=function(b,a){this.surface&&this.destroy(!0);b=b.documentElement;this.size={w:parseFloat(b.getAttribute("width"),10),h:parseFloat(b.getAttribute("height"),10)};
b=b.childrenByName("g")[0];var c=b.childrenByName("image")[0];this.imageSize={w:parseFloat(c.getAttribute("width"),10),h:parseFloat(c.getAttribute("height"),10)};this.imageSrc=c.getAttribute("xlink:href");this.initialize(a);a=b.childrenByName("g");for(b=0;b<a.length;b++)this._loadAnnotation(a[b]);this._loadDeferred&&(this._loadDeferred.callback(this),this._loadDeferred=null);this.onLoad()};d.onLoad=function(){};d.onClick=function(){};d._loadAnnotation=function(b){var a=b.getAttribute("dojoxsketch:type")+
"Annotation";return h[a]?(a=new h[a](this,b.id),a.initialize(b),this.nextKey(),a.setMode(h.Annotation.Modes.View),this._add(a),a):null};d.onUndo=function(){};d.onBeforeUndo=function(){};d.onRedo=function(){};d.onBeforeRedo=function(){};d.undo=function(){this.history&&(this.onBeforeUndo(),this.history.undo(),this.onUndo())};d.redo=function(){this.history&&(this.onBeforeRedo(),this.history.redo(),this.onRedo())};d.serialize=function(){for(var b='\x3csvg xmlns\x3d"http://www.w3.org/2000/svg" xmlns:xlink\x3d"http://www.w3.org/1999/xlink" xmlns:dojoxsketch\x3d"http://dojotoolkit.org/dojox/sketch" width\x3d"'+
this.size.w+'" height\x3d"'+this.size.h+'"\x3e\x3cg\x3e\x3cimage xlink:href\x3d"'+this.imageSrc+'" x\x3d"0" y\x3d"0" width\x3d"'+this.size.w+'" height\x3d"'+this.size.h+'" /\x3e',a=0;a<this.shapes.length;a++)b+=this.shapes[a].serialize();return b+"\x3c/g\x3e\x3c/svg\x3e"};d.getValue=d.serialize;return dojox.sketch.Figure});