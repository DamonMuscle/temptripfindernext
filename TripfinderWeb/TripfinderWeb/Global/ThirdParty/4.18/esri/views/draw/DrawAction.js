// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/maybe ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../../core/Evented ../../core/screenUtils".split(" "),function(k,d,c,g,v,w,f,x,n,y,z,A,p,l){c=function(m){function h(){var a=m.apply(this,arguments)||this;
a._hasZ=null;a.interactiveUndoDisabled=!1;a.history=[];a.redoHistory=[];a.snapToScene=!1;a.view=null;a.elevationInfo=null;a.defaultZ=0;return a}k._inheritsLoose(h,m);var e=h.prototype;e.canUndo=function(){return 0<this.history.length};e.canRedo=function(){return 0<this.redoHistory.length};e.undo=function(){if(this.canUndo()){var a=this.history.pop();a.undo();this.redoHistory.push(a)}};e.redo=function(){if(this.canRedo()){var a=this.redoHistory.pop();a.redo();this.history.push(a)}};e.getCoordsFromScreenPoint=
function(a){a=this.screenToMap(a);return g.isSome(a)?a.hasZ?[a.x,a.y,a.z]:[a.x,a.y]:null};e.getCoordsAndPointFromScreenPoint=function(a){a=this.screenToMap(a);return g.isSome(a)?a.hasZ?{vertex:[a.x,a.y,a.z],mapPoint:a}:{vertex:[a.x,a.y],mapPoint:a}:null};e.isDuplicateVertex=function(a,b){if(a.length){const [q,r]=a[a.length-1];return q===b[0]&&r===b[1]}return!1};e.getGeometryZValue=function(){return this.defaultZ};e.screenToMap=function(a){var b=null;"3d"===this.view.type?this.hasZ?(b=g.unwrapOr(this.elevationInfo,
t),b=this.view.sceneIntersectionHelper.intersectElevationFromScreen(l.createScreenPointArray(a.x,a.y),b,this.getGeometryZValue())):(b=g.unwrapOr(this.elevationInfo,u),b=this.view.sceneIntersectionHelper.intersectElevationFromScreen(l.createScreenPointArray(a.x,a.y),b,0),g.isSome(b)&&(b.z=void 0)):(b=this.view.toMap(a),g.isSome(b)&&(b.z=this.hasZ?this.getGeometryZValue():void 0));return b};k._createClass(h,[{key:"hasZ",get:function(){return g.isSome(this._hasZ)?this._hasZ:"3d"===this.view.type},set:function(a){this._hasZ=
a;this.notifyChange("hasZ")}}]);return h}(p.EventedAccessor);d.__decorate([f.property({type:Boolean,nonNullable:!0})],c.prototype,"interactiveUndoDisabled",void 0);d.__decorate([f.property({readOnly:!0})],c.prototype,"history",void 0);d.__decorate([f.property({readOnly:!0})],c.prototype,"redoHistory",void 0);d.__decorate([f.property()],c.prototype,"snapToScene",void 0);d.__decorate([f.property()],c.prototype,"view",void 0);d.__decorate([f.property()],c.prototype,"elevationInfo",void 0);d.__decorate([f.property({nonNullable:!0})],
c.prototype,"defaultZ",void 0);d.__decorate([f.property({dependsOn:["view"]})],c.prototype,"hasZ",null);c=d.__decorate([n.subclass("esri.views.draw.DrawAction")],c);const t={mode:"absolute-height",offset:0},u={mode:"on-the-ground",offset:0};return c});