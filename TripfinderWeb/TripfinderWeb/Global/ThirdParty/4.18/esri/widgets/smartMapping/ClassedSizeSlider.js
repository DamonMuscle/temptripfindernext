// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/maybe ../../core/Logger ../../core/accessorSupport/decorators/property ../../core/accessorSupport/decorators/aliasOf ../../core/accessorSupport/decorators/cast ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../../Color ../../renderers/support/ClassBreakInfo ../support/widgetUtils ../support/decorators/messageBundle ../support/decorators/renderable ../../chunks/index ./support/utils ./SmartMappingSliderBase ./ClassedSizeSlider/ClassedSizeSliderViewModel".split(" "),
function(E,g,f,y,O,l,F,G,P,H,Q,R,S,z,I,J,K,t,k,A,L,M){var u;const B={trackFillColor:new z([149,149,149]),trackBackgroundColor:new z([224,224,224])};f=u=function(C){function m(a,c){a=C.call(this,a,c)||this;a._rampNode=null;a.breaks=null;a.label=void 0;a.messages=null;a.style={...B};a.viewModel=new M;return a}E._inheritsLoose(m,C);var h=m.prototype;h.castStyle=function(a){return{...B,...a}};m.fromRendererResult=function(a,c){({renderer:{classBreakInfos:a}}=a);a=a.map(b=>{const d=b.symbol;let e;switch(d.type){case "simple-line":e=
d.width;break;case "simple-marker":e=d.size;break;case "picture-marker":e=d.height}return{min:b.minValue,max:b.maxValue,size:e}});return new u({breaks:a,histogramConfig:{bins:c?c.bins:[]}})};h.updateClassBreakInfos=function(a){const c=this.breaks;if(c.length!==a.length)console.error(`Number of input breakInfos must match number of slider breaks: ${c.length}`);else return a.map((b,d)=>{b=b.symbol;switch(b.type){case "simple-line":b.width=c[d].size;break;case "simple-marker":b.size=c[d].size;break;
case "picture-marker":{const e=c[d].size,v=b.width,w=b.height;b.height=e;b.width=e/w*v}}return new I({minValue:c[d].min,maxValue:c[d].max,symbol:b})})};h.updateFromRendererResult=function(a,c){({renderer:{classBreakInfos:a}}=a);a=a.map(b=>{const d=b.symbol;let e;switch(d.type){case "simple-line":e=d.width;break;case "simple-marker":e=d.size;break;case "picture-marker":e=d.height}return{min:b.minValue,max:b.maxValue,size:e}});this.set({breaks:a});null!=c&&c.bins&&(this.histogramConfig.bins=c.bins)};
h.render=function(){const {state:a,label:c}=this,b="disabled"===a,d=this.classes("esri-classed-size-slider","esri-widget","esri-widget--panel",{["esri-disabled"]:b});return k.jsx("div",{"aria-label":c,class:d},b?null:this.renderContent(this.renderRamp(),"esri-classed-size-slider__slider-container","esri-classed-size-slider__histogram-container"))};h.renderRamp=function(){const {style:{trackBackgroundColor:a}}=this;return k.jsx("div",{afterCreate:J.storeNode,bind:this,class:"esri-classed-size-slider__ramp",
"data-node-ref":"_rampNode"},k.jsx("svg",{xmlns:"http://www.w3.org/2000/svg"},k.jsx("rect",{x:"0",y:"0",fill:A.getFillFromColor(a),height:"100%",width:"100%"}),this.renderPath()))};h.renderPath=function(){if(this._rampNode){var {offsetHeight:a=0,offsetWidth:c=0}=this._rampNode;if(y.isSome(a)&&y.isSome(c)){var {breaks:b,viewModel:{max:d,min:e},style:{trackFillColor:v}}=this,w=d-e,x=c/b.length,N=b.map(n=>a-Math.round((n.min-e)/w*a)+1).reverse(),D=b[0].size>b[b.length-1].size||!1,p=D?x:c,q=`M${p} 0 `;
N.forEach((n,r)=>{r=x*(r+1);q+=`L${p} ${n} `;p=D?x+r:c-r;q+=`L${p} ${n} `});q+=`L0 ${a} L0 ${a} L0 0 Z`;return k.jsx("path",{d:q,fill:A.getFillFromColor(v)})}}};return m}(L.SmartMappingSliderBase);g.__decorate([F.aliasOf("viewModel.breaks")],f.prototype,"breaks",void 0);g.__decorate([l.property({aliasOf:{source:"messages.widgetLabel",overridable:!0}})],f.prototype,"label",void 0);g.__decorate([l.property(),t.renderable(),K.messageBundle("esri/widgets/smartMapping/ClassedSizeSlider/t9n/ClassedSizeSlider")],
f.prototype,"messages",void 0);g.__decorate([l.property(),t.renderable()],f.prototype,"style",void 0);g.__decorate([G.cast("style")],f.prototype,"castStyle",null);g.__decorate([l.property(),t.renderable("viewModel.hasTimeData viewModel.inputFormatFunction viewModel.inputParseFunction viewModel.labelFormatFunction viewModel.max viewModel.min viewModel.values".split(" "))],f.prototype,"viewModel",void 0);return f=u=g.__decorate([H.subclass("esri.widgets.smartMapping.ClassedSizeSlider")],f)});