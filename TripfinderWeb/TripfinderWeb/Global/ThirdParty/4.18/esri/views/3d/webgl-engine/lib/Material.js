// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../chunks/_rollupPluginBabelHelpers ../../../../core/maybe ./DefaultVertexAttributeLocations ./IdGen ../materials/internal/MaterialUtil".split(" "),function(d,g,h,k,l,e){let f=function(){function c(a,m,n){this.supportsEdges=!1;this._visible=!0;this._insertOrder=this._renderPriority=0;this._vertexAttributeLocations=k.Default3D;this.id=c._idGen.gen(a);this._params=e.copyParameters(m,n);this.validateParameterValues(this._params)}var b=c.prototype;b.dispose=function(){};b.update=
function(){return!1};b.setParameterValues=function(a){e.updateParameters(this._params,a)&&(this.validateParameterValues(this._params),this.parametersChanged())};b.validateParameterValues=function(){};b.isVisibleInPass=function(a){return!0};b.isVisible=function(){return this._visible};b.parametersChanged=function(){h.isSome(this.materialRepository)&&this.materialRepository.materialChanged(this)};g._createClass(c,[{key:"params",get:function(){return this._params}},{key:"visible",get:function(){return this._visible},
set:function(a){a!==this._visible&&(this._visible=a,this.parametersChanged())}},{key:"renderOccluded",get:function(){return this.params.renderOccluded}},{key:"renderPriority",get:function(){return this._renderPriority},set:function(a){a!==this._renderPriority&&(this._renderPriority=a,this.parametersChanged())}},{key:"insertOrder",get:function(){return this._insertOrder},set:function(a){a!==this._insertOrder&&(this._insertOrder=a,this.parametersChanged())}},{key:"vertexAttributeLocations",get:function(){return this._vertexAttributeLocations}}]);
return c}();f._idGen=new l.IdGen;d.Material=f;d.materialParametersDefaults={renderOccluded:1};d.materialPredicate=function(c,b){return c.isVisible()&&c.isVisibleInPass(b.pass)&&0!==(c.renderOccluded&b.renderOccludedMask)};Object.defineProperty(d,"__esModule",{value:!0})});