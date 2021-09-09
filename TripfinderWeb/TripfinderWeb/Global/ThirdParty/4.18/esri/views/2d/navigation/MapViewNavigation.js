// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../../../core/Accessor ../../../geometry/Point ../../../Viewpoint ../viewpointUtils ./ZoomBox ./actions/Pan ./actions/Pinch ./actions/Rotate".split(" "),
function(z,g,f,I,J,h,K,A,L,M,N,B,C,D,l,E,F,G,H){const q=new D({targetGeometry:new C}),r=[0,0];f=function(y){function t(a){a=y.call(this,a)||this;a._endTimer=null;a.animationManager=null;return a}z._inheritsLoose(t,y);var c=t.prototype;c.initialize=function(){this.pan=new F({navigation:this});this.rotate=new H({navigation:this});this.pinch=new G({navigation:this});this.zoomBox=new E({view:this.view,navigation:this})};c.destroy=function(){this.zoomBox.destroy();this.animationManager=this.zoomBox=null};
c.begin=function(){this._set("interacting",!0)};c.end=function(){this._lastEventTimestamp=performance.now();this._startTimer(250)};c.zoom=async function(a,b=this._getDefaultAnchor()){this.stop();this.begin();if(this.view.constraints.snapToZoom&&this.view.constraints.effectiveLODs)return 1>a?this.zoomIn(b):this.zoomOut(b);this.setViewpoint(b,a,0,[0,0])};c.zoomIn=async function(a){var b=this.view;b=b.constraints.snapToNextScale(b.scale);return this._zoomToScale(b,a)};c.zoomOut=async function(a){var b=
this.view;b=b.constraints.snapToPreviousScale(b.scale);return this._zoomToScale(b,a)};c.setViewpoint=function(a,b,d,e){this.begin();this.view.state.viewpoint=this._scaleRotateTranslateViewpoint(this.view.viewpoint,a,b,d,e);this.end()};c.setViewpointImmediate=function(a,b=0,d=[0,0],e=this._getDefaultAnchor()){this.view.state.viewpoint=this._scaleRotateTranslateViewpoint(this.view.viewpoint,e,a,b,d)};c.continousRotateClockwise=function(){const a=this.get("view.viewpoint");this.animationManager.animateContinous(a,
b=>{l.rotateBy(b,b,-1)})};c.continousRotateCounterclockwise=function(){const a=this.get("view.viewpoint");this.animationManager.animateContinous(a,b=>{l.rotateBy(b,b,1)})};c.resetRotation=function(){this.view.rotation=0};c.continousPanLeft=function(){this._continuousPan([-10,0])};c.continousPanRight=function(){this._continuousPan([10,0])};c.continousPanUp=function(){this._continuousPan([0,10])};c.continousPanDown=function(){this._continuousPan([0,-10])};c.stop=function(){this.pan.stopMomentumNavigation();
this.animationManager.stop();this.end();null!==this._endTimer&&(clearTimeout(this._endTimer),this._endTimer=null,this._set("interacting",!1))};c._continuousPan=function(a){const b=this.get("view.viewpoint");this.animationManager.animateContinous(b,d=>{l.translateBy(d,d,a);this.view.constraints.constrainByGeometry(d)})};c._startTimer=function(a){return null!==this._endTimer?this._endTimer:this._endTimer=setTimeout(()=>{this._endTimer=null;const b=performance.now()-this._lastEventTimestamp;250>b?this._endTimer=
this._startTimer(b):this._set("interacting",!1)},a)};c._getDefaultAnchor=function(){const {size:a,padding:{left:b,right:d,top:e,bottom:k}}=this.view;r[0]=.5*(a[0]-d+b);r[1]=.5*(a[1]-k+e);return r};c._zoomToScale=async function(a,b=this._getDefaultAnchor()){const {view:d}=this,{constraints:e,scale:k,viewpoint:m,size:u,padding:v}=d,n=e.canZoomInTo(a),w=e.canZoomOutTo(a);if(!(a<k&&!n||a>k&&!w))return l.padAndScaleAndRotateBy(q,m,a/k,0,b,u,v),e.constrainByGeometry(q),d.goTo(q,{animate:!0})};c._scaleRotateTranslateViewpoint=
function(a,b,d,e,k){var {view:m}=this;const {size:u,padding:v,constraints:n,scale:w,viewpoint:x}=m;var p=w*d;m=n.canZoomInTo(p);p=n.canZoomOutTo(p);if(1>d&&!m||1<d&&!p)d=1;l.translateBy(x,x,k);l.padAndScaleAndRotateBy(a,x,d,e,b,u,v);return n.constrainByGeometry(a)};return t}(B);g.__decorate([h.property()],f.prototype,"animationManager",void 0);g.__decorate([h.property({type:Boolean,readOnly:!0})],f.prototype,"interacting",void 0);g.__decorate([h.property()],f.prototype,"pan",void 0);g.__decorate([h.property()],
f.prototype,"pinch",void 0);g.__decorate([h.property()],f.prototype,"rotate",void 0);g.__decorate([h.property()],f.prototype,"view",void 0);g.__decorate([h.property()],f.prototype,"zoomBox",void 0);return f=g.__decorate([A.subclass("esri.views.2d.navigation.MapViewNavigation")],f)});