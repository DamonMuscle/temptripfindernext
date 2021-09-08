// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("require exports ../../../../chunks/_rollupPluginBabelHelpers ../../../../chunks/tslib.es6 ../core/shaderTechnique/ReloadableShaderModule ../core/shaderTechnique/ShaderTechnique ../core/shaderTechnique/ShaderTechniqueConfiguration ../../../webgl/Program ../../../webgl/renderState ../core/shaderLibrary/util/View.glsl ../core/shaderLibrary/Slice.glsl ../lib/OrderIndependentTransparency ../lib/StencilUtils ../core/shaderLibrary/shading/ReadShadowMap.glsl ../core/shaderLibrary/attributes/VertexNormal.glsl ../core/shaderLibrary/attributes/PathVertexPosition.glsl ../../../../chunks/Path.glsl".split(" "),
function(w,l,r,g,d,m,f,x,q,n,y,p,t,z,A,B,C){const u={position:0,profileRight:1,profileUp:2,profileVertexAndNormal:3,featureValue:4};m=function(k){function h(){return k.apply(this,arguments)||this}r._inheritsLoose(h,k);var b=h.prototype;b.initializeProgram=function(e){var a=h.shader.get();const c=this.configuration;a=a.build({OITEnabled:0===c.transparencyPassType,output:c.output,viewingMode:e.viewingMode,slicePlaneEnabled:c.slicePlaneEnabled,sliceHighlightDisabled:!1,sliceEnabledForVertexPrograms:!1,
receiveShadows:c.receiveShadows,vvSize:c.vvSize,vvColor:c.vvColor,vvInstancingEnabled:!0,vvOpacity:c.vvOpacity,useOldSceneLightInterface:!1,pbrMode:0,useCustomDTRExponentForWater:!1,receiveAmbientOcclusion:c.receiveSSAO,doubleSidedMode:c.doubleSidedMode});return new x(e.rctx,a.generateSource("vertex"),a.generateSource("fragment"),u)};b.bindPass=function(e,a,c){n.View.bindProjectionMatrix(this.program,c.camera.projectionMatrix);this.program.setUniform3fv("size",a.size);0!==this.configuration.output&&
7!==this.configuration.output||this.program.setUniform1f("opacity",a.opacity);0===this.configuration.output?(c.lighting.setUniforms(this.program,!1),this.program.setUniform3fv("ambient",a.ambient),this.program.setUniform3fv("diffuse",a.diffuse),this.program.setUniform3fv("specular",a.specular),this.program.setUniform1f("opacity",a.opacity)):1!==this.configuration.output&&3!==this.configuration.output||n.View.bindNearFar(this.program,c.camera.nearFar);B.setVVUniforms(this.program,a)};b.bindDraw=function(e){n.View.bindView(this.program,
e);y.Slice.bindUniformsWithOrigin(this.program,this.configuration,e);0!==this.configuration.output&&7!==this.configuration.output||n.View.bindCamPosition(this.program,e.origin,e.camera.viewInverseTransposeMatrix);0===this.configuration.output&&z.ReadShadowMap.bindView(this.program,e);2===this.configuration.output&&A.VertexNormal.bindUniforms(this.program,e.camera.viewInverseTransposeMatrix)};b.setPipelineState=function(e){const a=this.configuration,c=3===e,v=2===e;return q.makePipelineState({blending:0!==
a.output&&7!==a.output||!a.transparent?null:c?p.blendingDefault:p.OITBlending(e),culling:(a.slicePlaneEnabled?!1:!a.transparent&&0!==a.doubleSidedMode)&&{face:1028,mode:2305},depthTest:{func:p.OITDepthTest(e)},depthWrite:c||v?q.defaultDepthWriteParams:null,colorWrite:q.defaultColorWriteParams,stencilWrite:a.sceneHasOcludees?t.stencilWriteMaskOn:null,stencilTest:a.sceneHasOcludees?t.stencilBaseAllZerosParams:null,polygonOffset:c||v?null:p.OITPolygonOffset})};b.initializePipeline=function(){return this.setPipelineState(this.configuration.transparencyPassType)};
return h}(m.ShaderTechnique);m.shader=new d.ReloadableShaderModule(C.PathShader,()=>new Promise(function(k,h){w(["../shaders/Path.glsl"],k,h)}));d=function(k){function h(){var b=k.apply(this,arguments)||this;b.output=0;b.doubleSidedMode=0;b.receiveShadows=!1;b.receiveSSAO=!1;b.vvSize=!1;b.vvColor=!1;b.vvOpacity=!1;b.slicePlaneEnabled=!1;b.shadowMap=!1;b.transparent=!1;b.sceneHasOcludees=!1;b.transparencyPassType=3;return b}r._inheritsLoose(h,k);return h}(f.ShaderTechniqueConfiguration);g.__decorate([f.parameter({count:8})],
d.prototype,"output",void 0);g.__decorate([f.parameter({count:3})],d.prototype,"doubleSidedMode",void 0);g.__decorate([f.parameter()],d.prototype,"receiveShadows",void 0);g.__decorate([f.parameter()],d.prototype,"receiveSSAO",void 0);g.__decorate([f.parameter()],d.prototype,"vvSize",void 0);g.__decorate([f.parameter()],d.prototype,"vvColor",void 0);g.__decorate([f.parameter()],d.prototype,"vvOpacity",void 0);g.__decorate([f.parameter()],d.prototype,"slicePlaneEnabled",void 0);g.__decorate([f.parameter()],
d.prototype,"shadowMap",void 0);g.__decorate([f.parameter()],d.prototype,"transparent",void 0);g.__decorate([f.parameter()],d.prototype,"sceneHasOcludees",void 0);g.__decorate([f.parameter({count:4})],d.prototype,"transparencyPassType",void 0);l.PathTechnique=m;l.PathTechniqueConfiguration=d;l.PathVertexAttrConstants={POSITION:"position",PROFILERIGHT:"profileRight",PROFILEUP:"profileUp",PROFILEVERTEXANDNORMAL:"profileVertexAndNormal",FEATUREVALUE:"featureValue"};l.pathVertexAttributeLocations=u;Object.defineProperty(l,
"__esModule",{value:!0})});