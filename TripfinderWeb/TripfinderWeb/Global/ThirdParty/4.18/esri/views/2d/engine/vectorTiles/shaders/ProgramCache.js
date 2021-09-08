// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../../webgl/Program ../../../../webgl/BufferObject ../../../../webgl/Texture ../../../../webgl/VertexArrayObject ../../../../webgl/Renderbuffer ../../../../webgl/FramebufferObject ../../../../webgl/ProgramCache ../../../../webgl/RenderingContext ../../../../webgl/ShaderCompiler ./Programs".split(" "),function(k,l,m,n,p,q,g,r,t,a){return function(){function f(b){this._cache=Array(8);for(let c=0;8>c;c++)this._cache[c]={};this._programRepo=new g(b)}var d=f.prototype;d.dispose=function(){this._programRepo&&
(this._programRepo.dispose(),this._programRepo=null)};d.getProgram=function(b,c,h){const e=this._cache[b];e[c]||(b=this._programRepo.getProgram(this._getProgramTemplate(b),h),e[c]=b);return e[c]};d.getProgramAttributes=function(b){switch(b){case 0:return a.background.attributes;case 5:return a.circle.attributes;case 1:return a.fill.attributes;case 4:return a.icon.attributes;case 3:return a.line.attributes;case 2:return a.outline.attributes;case 6:return a.text.attributes;default:return null}};d._getProgramTemplate=
function(b){switch(b){case 0:return a.background;case 5:return a.circle;case 1:return a.fill;case 4:return a.icon;case 3:return a.line;case 2:return a.outline;case 6:return a.text;default:return null}};return f}()});