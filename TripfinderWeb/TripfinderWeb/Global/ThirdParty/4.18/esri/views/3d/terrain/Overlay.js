// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../../geometry/support/aaBoundingRect","./OverlayRenderTarget","../webgl-engine/lib/localOrigin"],function(f,h,e,k){let m=function(){function g(a,b){this.extent=h.create();this.resolution=0;this.renderLocalOrigin=k.fromValues(0,0,0,"O");this.pixelRatio=1;this.renderTargets={color:{fbo:new e.OverlayRenderTarget(a,"overlay",b,!0),valid:!1,lastUsed:Infinity},colorWithoutRasterImage:{fbo:new e.OverlayRenderTarget(a,"overlayWithoutRasterImage",b,!0),valid:!1,lastUsed:Infinity},highlight:{fbo:new e.OverlayRenderTarget(a,
"overlayHighlight",b,!1),valid:!1,lastUsed:Infinity},water:{fbo:new e.OverlayRenderTarget(a,"overlayWaterMask",b,!0),valid:!1,lastUsed:Infinity},occluded:{fbo:new e.OverlayRenderTarget(a,"overlayOccluded",b,!0),valid:!1,lastUsed:Infinity}}}var d=g.prototype;d.dispose=function(){this.renderTargets.color.fbo.dispose();this.renderTargets.colorWithoutRasterImage.fbo.dispose();this.renderTargets.highlight.fbo.dispose();this.renderTargets.water.fbo.dispose();this.renderTargets.occluded.fbo.dispose()};d.drawRenderTargets=
function(a,b,l){const c=this.renderTargets;c.color.valid=a.drawPass(0,c.color.fbo,b);c.highlight.valid=a.drawPass(5,c.highlight.fbo,b);c.water.valid=a.drawPass(3,c.water.fbo,b);c.occluded.valid=a.drawPass(0,c.occluded.fbo,b,1);c.colorWithoutRasterImage.valid=l&&a.drawPass(0,c.colorWithoutRasterImage.fbo,b,2)};d.computeRenderTargetValidityBitfield=function(){const a=this.renderTargets;return+a.color.valid|+a.colorWithoutRasterImage.valid<<1|+a.highlight.valid<<2|+a.water.valid<<3|+a.occluded.valid<<
4};d.validateUsage=function(a,b){if(a.valid)a.lastUsed=b;else if(1E3<b-a.lastUsed)a.fbo.disposeRenderTargetMemory(),a.lastUsed=Infinity;else if(Infinity>a.lastUsed)return!0;return!1};d.collectUnusedMemory=function(a){let b=!1;b=this.validateUsage(this.renderTargets.color,a)||b;b=this.validateUsage(this.renderTargets.colorWithoutRasterImage,a)||b;b=this.validateUsage(this.renderTargets.highlight,a)||b;b=this.validateUsage(this.renderTargets.occluded,a)||b;return b=this.validateUsage(this.renderTargets.water,
a)||b};d.getGpuMemoryUsage=function(){return this.renderTargets.color.fbo.getGpuMemoryUsage()+this.renderTargets.colorWithoutRasterImage.fbo.getGpuMemoryUsage()+this.renderTargets.highlight.fbo.getGpuMemoryUsage()+this.renderTargets.water.fbo.getGpuMemoryUsage()+this.renderTargets.occluded.fbo.getGpuMemoryUsage()};return g}();f.Overlay=m;Object.defineProperty(f,"__esModule",{value:!0})});