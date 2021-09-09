/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{b as t}from"./Logger.js";import{P as i}from"../core/scheduling.js";import{c as e,f as n,a as s}from"./vec3f64.js";import{b as r,h as a}from"./vec3.js";import{Q as h,ac as o,D as d,ad as c,a9 as u}from"./PiUtils.glsl.js";import{T as l}from"./isWebGL2Context.js";import{g as b,V as g,a as m}from"./Util.js";import{V as f,B as I}from"./VertexArrayObject.js";import{I as p}from"./Object3D.js";class x{constructor(t,i=x.DefaultIndices,e="triangle"){this.initialize(t,i,e)}get id(){return this._id}get vertexAttributes(){return this._vertexAttributes}get indices(){return this._indices}get indexCount(){const t=b(this._indices);return null==t?0:t.length}get primitiveType(){return this._primitiveType}getVertexAttr(){return this.vertexAttributes}initialize(t,i=x.DefaultIndices,e="triangle"){const n={};for(const i in t){const{data:e,size:s}=t[i];n[i]={data:e,size:s,offsetIdx:0,strideIdx:s}}if(i===x.DefaultIndices){const t=function(t){const i=b(t);if(null==i)return 0;return i.data.length/i.size}(n),e=h(t);i={};for(const t in n)i[t]=e}this._id=o(),this._vertexAttributes=n,this._indices=i,this._primitiveType=e}toRenderData(){return{id:this._id.toString(),indices:this._indices,vertexAttr:this._vertexAttributes}}getIndices(t){return this._indices[t]}getAttribute(t){return this._vertexAttributes[t]}estimateGpuMemoryUsage(){let t=0;if(this._indices[g.POSITION]){const i=3;t+=this._indices[g.POSITION].length*i*4}if(this._indices[g.NORMAL]){const i=3;t+=this._indices[g.NORMAL].length*i*4}if(this._indices[g.UV0]){const i=2;t+=this._indices[g.UV0].length*i*4}if(this._indices[g.COLOR]){const i=1;t+=this._indices[g.COLOR].length*i*4}return t}}x.DefaultIndices={};const _=[{name:"position",count:2,type:5126,offset:0,stride:8,normalized:!1}],M=[{name:"position",count:2,type:5126,offset:0,stride:16,normalized:!1},{name:"uv0",count:2,type:5126,offset:8,stride:16,normalized:!1}];function v(t,i=_,e=d,n=-1,s=1){let r=null;switch(i){case M:r=new Float32Array([n,n,0,0,s,n,1,0,n,s,0,1,s,s,1,1]);break;case _:default:r=new Float32Array([n,n,s,n,n,s,s,s])}return new f(t,e,{geometry:i},{geometry:I.createVertex(t,35044,r)})}function P(t,i=4){return new l(t,{target:3553,pixelFormat:6408,dataType:5121,samplingMode:9728,width:i,height:i})}function A(t,i,e=4){const n=new Uint8Array(e*e*4);for(let t=0;t<n.length;t+=4)n[t+0]=255*i[0],n[t+1]=255*i[1],n[t+2]=255*i[2],n[t+3]=255*i[3];return new l(t,{target:3553,pixelFormat:6408,dataType:5121,samplingMode:9728,width:e,height:e},n)}function O(t){return new l(t,{target:3553,pixelFormat:6408,dataType:5121,samplingMode:9728,width:1,height:1},new Uint8Array([255,255,255,255]))}class y{constructor(t,i,a,h){this.primitiveIndices=t,this._numIndexPerPrimitive=i,this.indices=a,this._position=h,this.center=e(),m(t.length>=1),m(a.length%this._numIndexPerPrimitive==0),m(a.length>=t.length*this._numIndexPerPrimitive),m(3===this._position.size||4===this._position.size);const{data:o,offsetIdx:d,strideIdx:c}=this._position;let u=0;const l=t.length;let b=d+c*a[this._numIndexPerPrimitive*t[u]];for(y.tmpIndices.clear(),y.tmpIndices.push(b),this.bbMin=n(o[b],o[b+1],o[b+2]),this.bbMax=s(this.bbMin);u<l;++u){const i=this._numIndexPerPrimitive*t[u];for(let t=0;t<this._numIndexPerPrimitive;++t){b=d+c*a[i+t],y.tmpIndices.push(b);let e=o[b];this.bbMin[0]=Math.min(e,this.bbMin[0]),this.bbMax[0]=Math.max(e,this.bbMax[0]),e=o[b+1],this.bbMin[1]=Math.min(e,this.bbMin[1]),this.bbMax[1]=Math.max(e,this.bbMax[1]),e=o[b+2],this.bbMin[2]=Math.min(e,this.bbMin[2]),this.bbMax[2]=Math.max(e,this.bbMax[2])}}r(this.center,this.bbMin,this.bbMax,.5),this.bsRadius=.5*Math.max(Math.max(this.bbMax[0]-this.bbMin[0],this.bbMax[1]-this.bbMin[1]),this.bbMax[2]-this.bbMin[2]);let g=this.bsRadius*this.bsRadius;for(u=0;u<y.tmpIndices.length;++u){b=y.tmpIndices.data[u];const t=o[b]-this.center[0],i=o[b+1]-this.center[1],e=o[b+2]-this.center[2],n=t*t+i*i+e*e;if(n<=g)continue;const s=Math.sqrt(n),r=.5*(s-this.bsRadius);this.bsRadius=this.bsRadius+r,g=this.bsRadius*this.bsRadius;const a=r/s;this.center[0]+=t*a,this.center[1]+=i*a,this.center[2]+=e*a}y.tmpIndices.clear()}getCenter(){return this.center}getBSRadius(){return this.bsRadius}getBBMin(){return this.bbMin}getBBMax(){return this.bbMax}getPrimitiveIndices(){return this.primitiveIndices}getIndices(){return this.indices}getPosition(){return this._position}getChildren(){if(this._children)return this._children;if(a(this.bbMin,this.bbMax)>1){const t=r(e(),this.bbMin,this.bbMax,.5),i=this.primitiveIndices.length,n=new Uint8Array(i),s=new Array(8);for(let t=0;t<8;++t)s[t]=0;const{data:a,offsetIdx:h,strideIdx:o}=this._position;for(let e=0;e<i;++e){let i=0;const r=this._numIndexPerPrimitive*this.primitiveIndices[e];let d=h+o*this.indices[r],c=a[d],u=a[d+1],l=a[d+2];for(let t=1;t<this._numIndexPerPrimitive;++t){d=h+o*this.indices[r+t];const i=a[d],e=a[d+1],n=a[d+2];i<c&&(c=i),e<u&&(u=e),n<l&&(l=n)}c<t[0]&&(i|=1),u<t[1]&&(i|=2),l<t[2]&&(i|=4),n[e]=i,++s[i]}let d=0;for(let t=0;t<8;++t)s[t]>0&&++d;if(d<2)return;const c=new Array(8);for(let t=0;t<8;++t)c[t]=s[t]>0?new Uint32Array(s[t]):void 0;for(let t=0;t<8;++t)s[t]=0;for(let t=0;t<i;++t){const i=n[t];c[i][s[i]++]=this.primitiveIndices[t]}this._children=new Array(8);for(let t=0;t<8;++t)void 0!==c[t]&&(this._children[t]=new y(c[t],this._numIndexPerPrimitive,this.indices,this._position))}return this._children}}!function(t){t.tmpIndices=new i({deallocator:null})}(y||(y={}));var w=y;class T{constructor(t,i){this._boundingInfo=null,this._id=T.__idGen.gen(i),this._data=t}get id(){return this._id}get data(){return this._data}getIndices(t){return this.data.getIndices(t)}get indexCount(){return this.data.indexCount}getAttribute(t){return this.data.getAttribute(t)}get vertexCount(){return this.data.indexCount}get faceCount(){return this.data.indexCount/3}get boundingInfo(){return t(this._boundingInfo)&&(this._boundingInfo=this._calculateBoundingInfo()),this._boundingInfo}computeAttachmentOrigin(t){return"triangle"===this.data.primitiveType?this.computeAttachmentOriginTriangles(t):this.computeAttachmentOriginPoints(t)}computeAttachmentOriginTriangles(t){const i=this.getIndices(g.POSITION),e=this.getAttribute(g.POSITION);return c(e,i,t)}computeAttachmentOriginPoints(t){const i=this.getIndices(g.POSITION),e=this.getAttribute(g.POSITION);return u(e,i,t)}invalidateBoundingInfo(){this._boundingInfo=null}_calculateBoundingInfo(){let t=this.data.getIndices(g.POSITION);const i=this.data.getAttribute(g.POSITION),e="triangle"===this.data.primitiveType?3:1;if(0===t.length){t=new Uint32Array(e);for(let i=0;i<e;++i)t[i]=i}const n=t.length;m(n%e==0,"Indexing error: "+n.toFixed(0)+" not divisible by "+e.toFixed(0));const s=h(n/e);return new w(s,e,t,i)}}T.__idGen=new p;export{w as B,T as G,M as P,x as a,A as b,v as c,P as d,_ as e,O as f};