/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{f as e}from"./vec3.js";import{s as t}from"./vec2.js";import{s as r}from"./vec4.js";class s{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=9;const y=this.TypedArrayConstructor;void 0===s&&(s=9*y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}getMat(e,t){const r=e*this.typedBufferStride;for(let e=0;e<9;e++)t[e]=this.typedBuffer[r+e];return t}setMat(e,t){const r=e*this.typedBufferStride;for(let e=0;e<9;e++)this.typedBuffer[r+e]=t[e]}get(e,t){return this.typedBuffer[e*this.typedBufferStride+t]}set(e,t,r){this.typedBuffer[e*this.typedBufferStride+t]=r}copyFrom(e,t,r){const s=this.typedBuffer,f=t.typedBuffer,y=e*this.typedBufferStride,n=r*t.typedBufferStride;for(let e=0;e<9;++e)s[y+e]=f[n+e]}get buffer(){return this.typedBuffer.buffer}}s.ElementCount=9;class f{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=16;const y=this.TypedArrayConstructor;void 0===s&&(s=16*y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}getMat(e,t){const r=e*this.typedBufferStride;for(let e=0;e<16;e++)t[e]=this.typedBuffer[r+e];return t}setMat(e,t){const r=e*this.typedBufferStride;for(let e=0;e<16;e++)this.typedBuffer[r+e]=t[e]}get(e,t){return this.typedBuffer[e*this.typedBufferStride+t]}set(e,t,r){this.typedBuffer[e*this.typedBufferStride+t]=r}copyFrom(e,t,r){const s=this.typedBuffer,f=t.typedBuffer,y=e*this.typedBufferStride,n=r*t.typedBufferStride;for(let e=0;e<16;++e)s[y+e]=f[n+e]}get buffer(){return this.typedBuffer.buffer}}f.ElementCount=16;class y{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=1;const y=this.TypedArrayConstructor;void 0===s&&(s=y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}get(e){return this.typedBuffer[e*this.typedBufferStride]}set(e,t){this.typedBuffer[e*this.typedBufferStride]=t}get buffer(){return this.typedBuffer.buffer}}y.ElementCount=1;class n{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=2;const y=this.TypedArrayConstructor;void 0===s&&(s=2*y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}getVec(e,r){return t(r,this.typedBuffer[e*this.typedBufferStride],this.typedBuffer[e*this.typedBufferStride+1])}setVec(e,t){this.typedBuffer[e*this.typedBufferStride]=t[0],this.typedBuffer[e*this.typedBufferStride+1]=t[1]}get(e,t){return this.typedBuffer[e*this.typedBufferStride+t]}set(e,t,r){this.typedBuffer[e*this.typedBufferStride+t]=r}setValues(e,t,r){this.typedBuffer[e*this.typedBufferStride]=t,this.typedBuffer[e*this.typedBufferStride+1]=r}copyFrom(e,t,r){const s=this.typedBuffer,f=t.typedBuffer,y=e*this.typedBufferStride,n=r*t.typedBufferStride;s[y]=f[n],s[y+1]=f[n+1]}get buffer(){return this.typedBuffer.buffer}}n.ElementCount=2;class u{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=3;const y=this.TypedArrayConstructor;void 0===s&&(s=3*y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}getVec(t,r){return e(r,this.typedBuffer[t*this.typedBufferStride],this.typedBuffer[t*this.typedBufferStride+1],this.typedBuffer[t*this.typedBufferStride+2])}setVec(e,t){this.typedBuffer[e*this.typedBufferStride]=t[0],this.typedBuffer[e*this.typedBufferStride+1]=t[1],this.typedBuffer[e*this.typedBufferStride+2]=t[2]}get(e,t){return this.typedBuffer[e*this.typedBufferStride+t]}set(e,t,r){this.typedBuffer[e*this.typedBufferStride+t]=r}setValues(e,t,r,s){this.typedBuffer[e*this.typedBufferStride]=t,this.typedBuffer[e*this.typedBufferStride+1]=r,this.typedBuffer[e*this.typedBufferStride+2]=s}copyFrom(e,t,r){const s=this.typedBuffer,f=t.typedBuffer,y=e*this.typedBufferStride,n=r*t.typedBufferStride;s[y]=f[n],s[y+1]=f[n+1],s[y+2]=f[n+2]}get buffer(){return this.typedBuffer.buffer}}u.ElementCount=3;class i{constructor(e,t,r=0,s,f){this.TypedArrayConstructor=e,this.elementCount=4;const y=this.TypedArrayConstructor;void 0===s&&(s=4*y.BYTES_PER_ELEMENT);const n=0===t.byteLength?0:r;this.typedBuffer=null==f?new y(t,n):new y(t,n,(f-r)/y.BYTES_PER_ELEMENT),this.typedBufferStride=s/y.BYTES_PER_ELEMENT,this.count=Math.ceil(this.typedBuffer.length/this.typedBufferStride),this.stride=this.typedBufferStride*this.TypedArrayConstructor.BYTES_PER_ELEMENT}getVec(e,t){return r(t,this.typedBuffer[e*this.typedBufferStride],this.typedBuffer[e*this.typedBufferStride+1],this.typedBuffer[e*this.typedBufferStride+2],this.typedBuffer[e*this.typedBufferStride+3])}setVec(e,t){this.typedBuffer[e*this.typedBufferStride]=t[0],this.typedBuffer[e*this.typedBufferStride+1]=t[1],this.typedBuffer[e*this.typedBufferStride+2]=t[2],this.typedBuffer[e*this.typedBufferStride+3]=t[3]}get(e,t){return this.typedBuffer[e*this.typedBufferStride+t]}set(e,t,r){this.typedBuffer[e*this.typedBufferStride+t]=r}setValues(e,t,r,s,f){this.typedBuffer[e*this.typedBufferStride]=t,this.typedBuffer[e*this.typedBufferStride+1]=r,this.typedBuffer[e*this.typedBufferStride+2]=s,this.typedBuffer[e*this.typedBufferStride+3]=f}copyFrom(e,t,r){const s=this.typedBuffer,f=t.typedBuffer,y=e*this.typedBufferStride,n=r*t.typedBufferStride;s[y]=f[n],s[y+1]=f[n+1],s[y+2]=f[n+2],s[y+3]=f[n+3]}get buffer(){return this.typedBuffer.buffer}}i.ElementCount=4;class d extends y{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new d(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}d.ElementType="f32";class p extends n{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new p(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}p.ElementType="f32";class h extends u{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new h(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}h.ElementType="f32";class o extends i{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new o(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}o.ElementType="f32";class a extends s{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new a(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}a.ElementType="f32";class c extends s{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new c(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}c.ElementType="f64";class T extends f{constructor(e,t=0,r,s){super(Float32Array,e,t,r,s),this.elementType="f32"}static fromTypedArray(e,t){return new T(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}T.ElementType="f32";class l extends f{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new l(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}l.ElementType="f64";class B extends y{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new B(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}B.ElementType="f64";class b extends n{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new b(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}b.ElementType="f64";class E extends u{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new E(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}E.ElementType="f64";class m extends i{constructor(e,t=0,r,s){super(Float64Array,e,t,r,s),this.elementType="f64"}static fromTypedArray(e,t){return new m(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}m.ElementType="f64";class S extends y{constructor(e,t=0,r,s){super(Uint8Array,e,t,r,s),this.elementType="u8"}static fromTypedArray(e,t){return new S(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}S.ElementType="u8";class A extends n{constructor(e,t=0,r,s){super(Uint8Array,e,t,r,s),this.elementType="u8"}static fromTypedArray(e,t){return new A(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}A.ElementType="u8";class O extends u{constructor(e,t=0,r,s){super(Uint8Array,e,t,r,s),this.elementType="u8"}static fromTypedArray(e,t){return new O(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}O.ElementType="u8";class g extends i{constructor(e,t=0,r,s){super(Uint8Array,e,t,r,s),this.elementType="u8"}static fromTypedArray(e,t){return new g(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}g.ElementType="u8";class L extends y{constructor(e,t=0,r,s){super(Uint16Array,e,t,r,s),this.elementType="u16"}static fromTypedArray(e,t){return new L(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}L.ElementType="u16";class w extends n{constructor(e,t=0,r,s){super(Uint16Array,e,t,r,s),this.elementType="u16"}static fromTypedArray(e,t){return new w(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}w.ElementType="u16";class _ extends u{constructor(e,t=0,r,s){super(Uint16Array,e,t,r,s),this.elementType="u16"}static fromTypedArray(e,t){return new _(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}_.ElementType="u16";class x extends i{constructor(e,t=0,r,s){super(Uint16Array,e,t,r,s),this.elementType="u16"}static fromTypedArray(e,t){return new x(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}x.ElementType="u16";class M extends y{constructor(e,t=0,r,s){super(Uint32Array,e,t,r,s),this.elementType="u32"}static fromTypedArray(e,t){return new M(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}M.ElementType="u32";class C extends n{constructor(e,t=0,r,s){super(Uint32Array,e,t,r,s),this.elementType="u32"}static fromTypedArray(e,t){return new C(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}C.ElementType="u32";class N extends u{constructor(e,t=0,r,s){super(Uint32Array,e,t,r,s),this.elementType="u32"}static fromTypedArray(e,t){return new N(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}N.ElementType="u32";class P extends i{constructor(e,t=0,r,s){super(Uint32Array,e,t,r,s),this.elementType="u32"}static fromTypedArray(e,t){return new P(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}P.ElementType="u32";class R extends y{constructor(e,t=0,r,s){super(Int8Array,e,t,r,s),this.elementType="i8"}static fromTypedArray(e,t){return new R(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}R.ElementType="i8";class Y extends n{constructor(e,t=0,r,s){super(Int8Array,e,t,r,s),this.elementType="i8"}static fromTypedArray(e,t){return new Y(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}Y.ElementType="i8";class F extends u{constructor(e,t=0,r,s){super(Int8Array,e,t,r,s),this.elementType="i8"}static fromTypedArray(e,t){return new F(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}F.ElementType="i8";class I extends i{constructor(e,t=0,r,s){super(Int8Array,e,t,r,s),this.elementType="i8"}static fromTypedArray(e,t){return new I(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}I.ElementType="i8";class U extends y{constructor(e,t=0,r,s){super(Int16Array,e,t,r,s),this.elementType="i16"}static fromTypedArray(e,t){return new U(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}U.ElementType="i16";class v extends n{constructor(e,t=0,r,s){super(Int16Array,e,t,r,s),this.elementType="i16"}static fromTypedArray(e,t){return new v(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}v.ElementType="i16";class V extends u{constructor(e,t=0,r,s){super(Int16Array,e,t,r,s),this.elementType="i16"}static fromTypedArray(e,t){return new V(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}V.ElementType="i16";class j extends i{constructor(e,t=0,r,s){super(Int16Array,e,t,r,s),this.elementType="i16"}static fromTypedArray(e,t){return new j(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}j.ElementType="i16";class k extends y{constructor(e,t=0,r,s){super(Int32Array,e,t,r,s),this.elementType="i32"}static fromTypedArray(e,t){return new k(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}k.ElementType="i32";class q extends n{constructor(e,t=0,r,s){super(Int32Array,e,t,r,s),this.elementType="i32"}static fromTypedArray(e,t){return new q(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}q.ElementType="i32";class z extends u{constructor(e,t=0,r,s){super(Int32Array,e,t,r,s),this.elementType="i32"}static fromTypedArray(e,t){return new z(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}z.ElementType="i32";class D extends i{constructor(e,t=0,r,s){super(Int32Array,e,t,r,s),this.elementType="i32"}static fromTypedArray(e,t){return new D(e.buffer,e.byteOffset,t,e.byteOffset+e.byteLength)}}D.ElementType="i32";export{F as A,E as B,I as C,U as D,V as E,j as F,k as G,q as H,z as I,D as J,h as a,o as b,l as c,a as d,p as e,m as f,S as g,g as h,M as i,L as j,x as k,O as l,_ as m,C as n,w as o,v as p,A as q,Y as r,b as s,c as t,T as u,d as v,B as w,R as x,N as y,P as z};