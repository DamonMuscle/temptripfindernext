/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{O as t}from"./ArrayPool.js";import"./object.js";import{L as e}from"./Logger.js";import r from"../core/Error.js";import"./mathUtils2.js";import"./isWebGL2Context.js";import"./RenderingContext.js";import{a as s,V as n}from"./enums.js";class o{constructor(){this.color=[0,0,0,0],this.haloColor=[0,0,0,0],this.haloSize=0,this.size=12,this.angle=0,this.offsetX=0,this.offsetY=0,this.hAnchor=0,this.vAnchor=0}acquire(t,e,r,s,n,o,i,a,c){this.color=t,this.haloColor=e,this.haloSize=r,this.size=s,this.angle=n,this.offsetX=o,this.offsetY=i,this.hAnchor=a,this.vAnchor=c}release(){this.color[0]=this.color[1]=this.color[2]=this.color[3]=0,this.haloColor[0]=this.haloColor[1]=this.haloColor[2]=this.haloColor[3]=0,this.haloSize=0,this.size=0,this.angle=0,this.offsetX=0,this.offsetY=0,this.hAnchor=0,this.vAnchor=0}}o.pool=new t(o);const i=e.getLogger("esri.views.2d.engine.webgl.Utils"),a=[{name:"geometry",strideInBytes:32,divisor:0}],c=[{name:"geometry",strideInBytes:12,divisor:0}],u=[{name:"geometry",strideInBytes:36,divisor:0}],h=[{name:"geometry",strideInBytes:32,divisor:0}],l=[{name:"geometry",strideInBytes:36,divisor:0}];function f(t){const e={};for(const r of t)e[r.name]=r.strideInBytes;return e}const d=f([{name:"geometry",strideInBytes:32,divisor:0}]),m=f(a),y=f(c),g=f(u),p=f(h),w=f(l);function v(t,e){switch(t){case s.MARKER:return d;case s.FILL:return e?y:m;case s.LINE:return g;case s.TEXT:return p;case s.LABEL:return w}}const A=["geometry"],L=["geometry"],C=["geometry"],b=["geometry"],I=["geometry"];function E(t){switch(t){case s.MARKER:return A;case s.FILL:return L;case s.LINE:return C;case s.TEXT:return b;case s.LABEL:return I}}function j(t){switch(t%4){case 0:case 2:return 4;case 1:case 3:return 1}}function U(t,e){switch(e%4){case 0:case 2:return new Uint32Array(Math.floor(t*e/4));case 1:case 3:return new Uint8Array(t*e)}}function z(t,e){switch(e%4){case 0:case 2:return new Uint32Array(t);case 1:case 3:return new Uint8Array(t)}}function B(t){return null!=t}function x(t){return"number"==typeof t}function R(t,e){switch(t){case"butt":return 0;case"round":return e?2:1;case"square":return 2;default:return i.error(new r("mapview-invalid-type",`Cap type ${t} is not a valid option. Defaulting to round`)),1}}function T(t){switch(t){case"miter":return 2;case"bevel":return 0;case"round":return 1;default:return i.error(new r("mapview-invalid-type",`Join type ${t} is not a valid option. Defaulting to round`)),1}}function F(t){switch(t){case"opacity":return n.OPACITY;case"color":return n.COLOR;case"rotation":return n.ROTATION;case"size":return n.SIZE;default:return i.error(`Cannot interpret unknown vv: ${t}`),null}}function O(t,e,r,s,n,o,i){for(const e in o){const s=o[e].stride,i=j(s),a=o[e].data,c=r[e].data,u=s*n.vertexCount/i,h=s*t/i,l=s*n.vertexFrom/i;for(let t=0;t<u;++t)c[t+h]=a[t+l]}const a=n.indexCount;for(let r=0;r<a;++r)s[r+e]=i[r+n.indexFrom]-n.vertexFrom+t}const X={geometry:35044};function $(t,e){const r=[];for(let s=0;s<5;++s){const n=E(s),o={};for(const t of n)o[t]={data:e(s,t)};r.push({data:t(s),buffers:o})}return r}function M(t){switch(t){case 5120:case 5121:return 1;case 5122:case 5123:return 2;case 5126:case 5124:case 5125:return 4}}function S(t){switch(t){case 5121:return 1;case 32819:return 2;case 5126:return 4;default:return void i.error(new r("webgl-utils",`Unable to handle type ${t}`))}}function Y(t){switch(t){case 5121:return Uint8Array;case 32819:return Uint16Array;case 5126:return Float32Array;default:return void i.error(new r("webgl-utils",`Unable to handle type ${t}`))}}const N=new Map,k=(t,e)=>{if(!N.has(t)){const r=function(t){const e={};for(const r in t){const s=t[r];let n=0;e[r]=s.map((t=>{const e={...t,normalized:t.normalized||!1,divisor:t.divisor||0,offset:n,stride:0};return n+=t.count*M(t.type),e})),e[r].forEach((t=>t.stride=n))}return e}(e),s={strides:(t=>{const e={};for(const r in t){const s=t[r];e[r]=s.length?s[0].stride:0}return e})(r),bufferLayouts:r,attributes:(t=>{const e={};for(const r in t)for(const s of t[r])e[s.name]=s.location;return e})(e)};N.set(t,s)}return N.get(t)};export{X as C,F as a,v as b,k as c,R as d,T as e,z as f,Y as g,U as h,x as i,O as j,$ as k,S as l,B as m,j as s};
