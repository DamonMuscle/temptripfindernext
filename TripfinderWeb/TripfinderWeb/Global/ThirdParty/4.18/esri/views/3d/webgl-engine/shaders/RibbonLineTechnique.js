// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("require exports ../../../../chunks/_rollupPluginBabelHelpers ../../../../chunks/tslib.es6 ../../../../core/maybe ../core/shaderTechnique/ReloadableShaderModule ../core/shaderTechnique/ShaderTechnique ../core/shaderTechnique/ShaderTechniqueConfiguration ../../../webgl/Program ../../../webgl/renderState ../core/shaderLibrary/util/View.glsl ../core/shaderLibrary/Slice.glsl ../core/shaderLibrary/output/OutputHighlight.glsl ../core/shaderLibrary/shading/VisualVariables.glsl ../lib/OrderIndependentTransparency ../lib/StencilUtils ../../../../chunks/RibbonLine.glsl".split(" "),
function(y,q,t,g,u,e,r,f,z,l,v,A,B,C,n,h,D){const w={position:0,subdivisionFactor:1,uv0:2,auxpos1:3,auxpos2:4,size:6,sizeFeatureAttribute:6,color:5,colorFeatureAttribute:5,opacityFeatureAttribute:7};r=function(m){function k(c,a){a=m.call(this,c,a)||this;a.stipplePattern=null;a.stippleTextureBind=null;a.stippleTextureRepository=c.stippleTextureRepository;return a}t._inheritsLoose(k,m);var d=k.prototype;d.initializeProgram=function(c){var a=k.shader.get();const b=this.configuration;a=a.build({OITEnabled:0===
b.transparencyPassType,output:b.output,slicePlaneEnabled:b.slicePlaneEnabled,sliceHighlightDisabled:b.sliceHighlightDisabled,sliceEnabledForVertexPrograms:!1,stippleEnabled:b.stippleEnabled,stippleOffColorEnabled:b.stippleOffColorEnabled,stippleUVMaxEnabled:b.stippleIntegerRepeatsEnabled,stippleIntegerRepeatsEnabled:b.stippleIntegerRepeatsEnabled,roundCaps:b.roundCaps,roundJoins:b.roundJoins,vvColor:b.vvColor,vvSize:b.vvSize,vvInstancingEnabled:!0,vvOpacity:b.vvOpacity,falloffEnabled:b.falloffEnabled,
innerColorEnabled:b.innerColorEnabled});return new z(c.rctx,a.generateSource("vertex"),a.generateSource("fragment"),w)};d.dispose=function(){m.prototype.dispose.call(this);this.stippleTextureRepository.release(this.stipplePattern);this.stippleTextureBind=this.stipplePattern=null};d.bindPass=function(c,a,b){v.View.bindProjectionMatrix(this.program,b.camera.projectionMatrix);4===this.configuration.output&&B.OutputHighlight.bindOutputHighlight(c,this.program,b);this.program.setUniform1f("intrinsicWidth",
a.width);this.program.setUniform4fv("intrinsicColor",a.color);this.program.setUniform1f("miterLimit","miter"!==a.join?0:a.miterLimit);this.program.setUniform2fv("nearFar",b.camera.nearFar);this.program.setUniform1f("pixelRatio",b.camera.pixelRatio);this.program.setUniform2f("screenSize",b.camera.fullViewport[2],b.camera.fullViewport[3]);C.VisualVariables.bindUniformsWithOpacity(this.program,a);if(this.stipplePattern!==a.stipplePattern){const p=a.stipplePattern;this.stippleTextureBind=this.stippleTextureRepository.swap(this.stipplePattern,
p);this.stipplePattern=p}this.configuration.stippleEnabled&&(c=u.isSome(this.stippleTextureBind)?this.stippleTextureBind(c,0)*b.camera.pixelRatio:1,this.program.setUniform1i("stipplePatternTexture",0),this.program.setUniform1f("stipplePatternPixelSizeInv",1/c),this.configuration.stippleOffColorEnabled&&(c=u.unwrap(a.stippleOffColor),this.program.setUniform4f("stippleOffColor",c[0],c[1],c[2],3<c.length?c[3]:1)));this.configuration.falloffEnabled&&this.program.setUniform1f("falloff",a.falloff);this.configuration.innerColorEnabled&&
(this.program.setUniform4fv("innerColor",u.unwrapOr(a.innerColor,a.color)),this.program.setUniform1f("innerWidth",a.innerWidth*b.camera.pixelRatio))};d.bindDraw=function(c){v.View.bindView(this.program,c);A.Slice.bindUniformsWithOrigin(this.program,this.configuration,c)};d.setPipelineState=function(c,a){const b=this.configuration,p=3===c,E=2===c;return l.makePipelineState({blending:0===b.output||7===b.output?p?n.blendingDefault:n.OITBlending(c):null,depthTest:{func:n.OITDepthTest(c)},depthWrite:p?
!b.transparent&&b.writeDepth&&l.defaultDepthWriteParams:n.OITDepthWrite(c),colorWrite:l.defaultColorWriteParams,stencilWrite:b.sceneHasOcludees?h.stencilWriteMaskOn:null,stencilTest:b.sceneHasOcludees?a?h.stencilToolMaskBaseParams:h.stencilBaseAllZerosParams:null,polygonOffset:p||E?b.polygonOffset&&x:n.OITPolygonOffset})};d.initializePipeline=function(){const c=this.configuration,a=c.polygonOffset&&x;c.occluder&&(this._occluderPipelineTransparent=l.makePipelineState({blending:n.blendingDefault,polygonOffset:a,
depthTest:h.depthCompareAlways,depthWrite:null,colorWrite:l.defaultColorWriteParams,stencilWrite:null,stencilTest:h.stencilToolTransparentOccluderParams}),this._occluderPipelineOpaque=l.makePipelineState({blending:n.blendingDefault,polygonOffset:a,depthTest:h.depthCompareAlways,depthWrite:null,colorWrite:l.defaultColorWriteParams,stencilWrite:h.stencilWriteMaskOff,stencilTest:h.stencilToolMaskOccluderParams}),this._occluderPipelineMaskWrite=l.makePipelineState({blending:null,polygonOffset:a,depthTest:h.depthCompareLess,
depthWrite:null,colorWrite:null,stencilWrite:h.stencilWriteMaskOn,stencilTest:h.stencilToolMaskBaseParams}));this._occludeePipelineState=this.setPipelineState(this.configuration.transparencyPassType,!0);return this.setPipelineState(this.configuration.transparencyPassType,!1)};d.getPipelineState=function(c,a){return a?this._occludeePipelineState:this.configuration.occluder?11===c?this._occluderPipelineTransparent:10===c?this._occluderPipelineOpaque:this._occluderPipelineMaskWrite:this.pipeline};t._createClass(k,
[{key:"primitiveType",get:function(){return 5}}]);return k}(r.ShaderTechnique);r.shader=new e.ReloadableShaderModule(D.RibbonLineShader,()=>new Promise(function(m,k){y(["./RibbonLine.glsl"],m,k)}));const x={factor:0,units:-4};e=function(m){function k(){var d=m.apply(this,arguments)||this;d.output=0;d.occluder=!1;d.slicePlaneEnabled=!1;d.sliceHighlightDisabled=!1;d.vertexColors=!1;d.transparent=!1;d.polygonOffset=!1;d.writeDepth=!1;d.stippleEnabled=!1;d.stippleOffColorEnabled=!1;d.stippleIntegerRepeatsEnabled=
!1;d.roundCaps=!1;d.roundJoins=!1;d.vvSize=!1;d.vvColor=!1;d.vvOpacity=!1;d.falloffEnabled=!1;d.innerColorEnabled=!1;d.sceneHasOcludees=!1;d.transparencyPassType=3;return d}t._inheritsLoose(k,m);return k}(f.ShaderTechniqueConfiguration);g.__decorate([f.parameter({count:8})],e.prototype,"output",void 0);g.__decorate([f.parameter()],e.prototype,"occluder",void 0);g.__decorate([f.parameter()],e.prototype,"slicePlaneEnabled",void 0);g.__decorate([f.parameter()],e.prototype,"sliceHighlightDisabled",void 0);
g.__decorate([f.parameter()],e.prototype,"vertexColors",void 0);g.__decorate([f.parameter()],e.prototype,"transparent",void 0);g.__decorate([f.parameter()],e.prototype,"polygonOffset",void 0);g.__decorate([f.parameter()],e.prototype,"writeDepth",void 0);g.__decorate([f.parameter()],e.prototype,"stippleEnabled",void 0);g.__decorate([f.parameter()],e.prototype,"stippleOffColorEnabled",void 0);g.__decorate([f.parameter()],e.prototype,"stippleIntegerRepeatsEnabled",void 0);g.__decorate([f.parameter()],
e.prototype,"roundCaps",void 0);g.__decorate([f.parameter()],e.prototype,"roundJoins",void 0);g.__decorate([f.parameter()],e.prototype,"vvSize",void 0);g.__decorate([f.parameter()],e.prototype,"vvColor",void 0);g.__decorate([f.parameter()],e.prototype,"vvOpacity",void 0);g.__decorate([f.parameter()],e.prototype,"falloffEnabled",void 0);g.__decorate([f.parameter()],e.prototype,"innerColorEnabled",void 0);g.__decorate([f.parameter()],e.prototype,"sceneHasOcludees",void 0);g.__decorate([f.parameter({count:4})],
e.prototype,"transparencyPassType",void 0);q.RibbonLineTechnique=r;q.RibbonLineTechniqueConfiguration=e;q.RibbonVertexAttributeConstants={POSITION:"position",SUBDIVISIONFACTOR:"subdivisionFactor",UV0:"uv0",AUXPOS1:"auxpos1",AUXPOS2:"auxpos2",SUBDIVISIONS:"subdivisions",COLOR:"color",COLORFEATUREATTRIBUTE:"colorFeatureAttribute",SIZE:"size",SIZEFEATUREATTRIBUTE:"sizeFeatureAttribute",OPACITYFEATUREATTRIBUTE:"opacityFeatureAttribute"};q.ribbonVertexAttributeLocations=w;Object.defineProperty(q,"__esModule",
{value:!0})});