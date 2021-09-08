// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../../chunks/_rollupPluginBabelHelpers","../../../core/clock","../InputHandler","./support"],function(l,m,r,n,t){const h={maximumClickDelay:300,movementUntilMouseDrag:1.5,movementUntilPenDrag:6,movementUntilTouchDrag:6,holdDelay:500};n=function(p){function q(b=h.maximumClickDelay,c=h.movementUntilMouseDrag,e=h.movementUntilPenDrag,d=h.movementUntilTouchDrag,f=h.holdDelay,u=r["default"]){var a=p.call(this,!1)||this;a.maximumClickDelay=b;a.movementUntilMouseDrag=c;a.movementUntilPenDrag=
e;a.movementUntilTouchDrag=d;a.holdDelay=f;a._clock=u;a._pointerState=new Map;a._pointerDrag=a.registerOutgoing("pointer-drag");a._immediateClick=a.registerOutgoing("immediate-click");a._pointerHold=a.registerOutgoing("hold");a.registerIncoming("pointer-down",a._handlePointerDown.bind(m._assertThisInitialized(a)));a.registerIncoming("pointer-up",k=>{a._handlePointerLoss(k,"pointer-up")});a.registerIncoming("pointer-capture-lost",k=>{a._handlePointerLoss(k,"pointer-capture-lost")});a.registerIncoming("pointer-cancel",
k=>{a._handlePointerLoss(k,"pointer-cancel")});a._moveHandle=a.registerIncoming("pointer-move",a._handlePointerMove.bind(m._assertThisInitialized(a)));a._moveHandle.pause();return a}m._inheritsLoose(q,p);var g=q.prototype;g.onUninstall=function(){this._pointerState.forEach(b=>{null!=b.holdTimeout&&(b.holdTimeout.remove(),b.holdTimeout=null)});p.prototype.onUninstall.call(this)};g._handlePointerDown=function(b){const c=b.data,e=c.native.pointerId;var d=null;0===this._pointerState.size&&(d=this._clock.setTimeout(()=>
{const f=this._pointerState.get(e);f&&(f.isDragging||(this._pointerHold.emit(f.previousEvent,void 0,b.modifiers),f.holdEmitted=!0),f.holdTimeout=null)},this.holdDelay));d={startEvent:c,previousEvent:c,startTimestamp:b.timestamp,isDragging:!1,downButton:c.native.button,holdTimeout:d,modifiers:new Set};this._pointerState.set(e,d);this.startCapturingPointer(c.native);this._moveHandle.resume();1<this._pointerState.size&&this.startDragging(b)};g._createPointerDragData=function(b,c,e){return{action:b,startEvent:c.startEvent,
previousEvent:c.previousEvent,currentEvent:e}};g._handlePointerMove=function(b){const c=b.data,e=this._pointerState.get(c.native.pointerId);if(e){if(e.isDragging)this._pointerDrag.emit(this._createPointerDragData("update",e,c),void 0,e.modifiers);else{const d=t.euclideanDistance(c,e.startEvent),f=this._getDragThreshold(c.native.pointerType);d>f&&this.startDragging(b)}e.previousEvent=c}};g._getDragThreshold=function(b){switch(b){case "touch":return this.movementUntilTouchDrag;case "pen":return this.movementUntilPenDrag;
default:return this.movementUntilMouseDrag}};g.startDragging=function(b){const c=b.data,e=c.native.pointerId;this._pointerState.forEach(d=>{null!=d.holdTimeout&&(d.holdTimeout.remove(),d.holdTimeout=null);d.isDragging||(d.modifiers=b.modifiers,d.isDragging=!0,e===d.startEvent.native.pointerId?this._pointerDrag.emit(this._createPointerDragData("start",d,c)):this._pointerDrag.emit(this._createPointerDragData("start",d,d.previousEvent),b.timestamp))})};g._handlePointerLoss=function(b,c){const e=b.data,
d=e.native.pointerId,f=this._pointerState.get(d);f&&(null!=f.holdTimeout&&(f.holdTimeout.remove(),f.holdTimeout=null),f.isDragging?this._pointerDrag.emit(this._createPointerDragData("end",f,"pointer-up"===c?e:f.previousEvent),void 0,f.modifiers):"pointer-up"===c&&f.downButton===e.native.button&&b.timestamp-f.startTimestamp<=this.maximumClickDelay&&!f.holdEmitted&&this._immediateClick.emit(e),this._pointerState.delete(d),this.stopCapturingPointer(e.native),0===this._pointerState.size&&this._moveHandle.pause())};
return q}(n.InputHandler);l.DefaultParameters=h;l.PointerClickHoldAndDrag=n;Object.defineProperty(l,"__esModule",{value:!0})});