// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../../core/Error","../../../renderers/support/rasterRendererHelper","../support/utils"],function(g,h,e,p){async function q(a){a=await p.processRasterRendererParameters(a);const {rasterInfo:b}=a.layer;if(1===b.bandCount)throw new h("raster-rgb-renderer:not-supported","Only multiband image is supported");const {rgbBandIds:c}=a;if(c&&3!==c.length)throw new h("raster-rgb-renderer:invalid-parameters","rgb band ids must have exactly three 0-based band indices");c||(a.rgbBandIds=e.getDefaultBandCombination(b));
return a}g.createRenderer=async function(a){a=await q(a);var b=a.layer;const {rasterInfo:c}=b,{rgbBandIds:k}=a,l={bandIds:k,stretchType:a.stretchType};let d=e.createStretchRenderer(c,l);a.estimateStatistics&&d.dynamicRangeAdjustment&&(await b.updateRasterInfoWithEstimatedStats({renderingRule:a.renderingRule,signal:a.signal}),d=e.createStretchRenderer(c,l));{b=d;const {gamma:f,useGamma:m,dynamicRangeAdjustment:n}=a;3===(null==f?void 0:f.length)&&(b.gamma=f);null!=m&&(b.useGamma=m);null!=n&&(b.dynamicRangeAdjustment=
n)}return{renderer:d,rgbBandIds:k}};Object.defineProperty(g,"__esModule",{value:!0})});