// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../../../../chunks/_rollupPluginBabelHelpers"],function(e,m){let l=function(){function c(a,b,f=0,d,g){this.TypedArrayConstructor=a;this.elementCount=1;a=this.TypedArrayConstructor;void 0===d&&(d=a.BYTES_PER_ELEMENT);const h=0===b.byteLength?0:f;this.typedBuffer=null==g?new a(b,h):new a(b,h,(g-f)/a.BYTES_PER_ELEMENT);this.typedBufferStride=d/a.BYTES_PER_ELEMENT;this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride);this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}
var k=c.prototype;k.get=function(a){return this.typedBuffer[a*this.typedBufferStride]};k.set=function(a,b){this.typedBuffer[a*this.typedBufferStride]=b};m._createClass(c,[{key:"buffer",get:function(){return this.typedBuffer.buffer}}]);return c}();l.ElementCount=1;e.BufferViewScalarImpl=l;Object.defineProperty(e,"__esModule",{value:!0})});