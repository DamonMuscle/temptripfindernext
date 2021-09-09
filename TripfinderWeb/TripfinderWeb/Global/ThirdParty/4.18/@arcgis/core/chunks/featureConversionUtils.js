/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{L as e}from"./Logger.js";import t from"../core/Error.js";import{isPoint as n,isPolygon as o,isPolyline as r,isMultipoint as s}from"../geometry/support/jsonUtils.js";import{a as c,b as l,O as u}from"./OptimizedGeometry.js";function i(e,t){return e?t?4:3:t?3:2}const a=e.getLogger("esri.tasks.support.optimizedFeatureSet"),f={esriGeometryPoint:0,esriGeometryPolyline:2,esriGeometryPolygon:3,esriGeometryMultipoint:0},h=(e,t,n,o,r,s)=>{e[n]=r,e[n+1]=s},g=(e,t,n,o,r,s)=>{e[n]=r,e[n+1]=s,e[n+2]=t[o+2]},d=(e,t,n,o,r,s)=>{e[n]=r,e[n+1]=s,e[n+2]=t[o+3]},m=(e,t,n,o,r,s)=>{e[n]=r,e[n+1]=s,e[n+2]=t[o+2],e[n+3]=t[o+3]};function y(e,t,n,o){if(e){if(n)return t&&o?m:g;if(t&&o)return d}else if(t&&o)return g;return h}function p({scale:e,translate:t},n){return Math.round((n-t[0])/e[0])}function b({scale:e,translate:t},n){return Math.round((t[1]-n)/e[1])}function w({scale:e,translate:t},n){return n*e[0]+t[0]}function I({scale:e,translate:t},n){return t[1]-n*e[1]}function G(e,t,n){return e?t?n?x(e):N(e):n?P(e):M(e):null}function M(e){const t=e.coords;return{x:t[0],y:t[1]}}function T(e,t){return e.coords[0]=t.x,e.coords[1]=t.y,e}function N(e){const t=e.coords;return{x:t[0],y:t[1],z:t[2]}}function F(e,t){return e.coords[0]=t.x,e.coords[1]=t.y,e.coords[2]=t.z,e}function P(e){const t=e.coords;return{x:t[0],y:t[1],m:t[2]}}function k(e,t){return e.coords[0]=t.x,e.coords[1]=t.y,e.coords[2]=t.m,e}function x(e){const t=e.coords;return{x:t[0],y:t[1],z:t[2],m:t[3]}}function Z(e,t){return e.coords[0]=t.x,e.coords[1]=t.y,e.coords[2]=t.z,e.coords[3]=t.m,e}function j(e,t){return e&&t?Z:e?F:t?k:T}function v(e,t,n,o,r){const s=j(n,o);for(const n of t){const{geometry:t,attributes:o}=n;let u;t&&(u=s(new l,t)),e.push(new c(u,o,null,o[r]))}return e}function z(e,t,n){if(!e)return null;const o=i(t,n),r=[];for(let t=0;t<e.coords.length;t+=o){const n=[];for(let r=0;r<o;r++)n.push(e.coords[t+r]);r.push(n)}return t?n?{points:r,hasZ:t,hasM:n}:{points:r,hasZ:t}:n?{points:r,hasM:n}:{points:r}}function E(e,t,n,o,r){const s=i(n,o);for(const n of t){const t=n.geometry,o=n.attributes;let u;t&&(u=L(new l,t,s)),e.push(new c(u,o,null,o[r]))}return e}function L(e,t,n=i(t.hasZ,t.hasM)){e.lengths[0]=t.points.length;const o=e.coords;let r=0;for(const e of t.points)for(let t=0;t<n;t++)o[r++]=e[t];return e}function q(e,t,n){if(!e)return null;const o=i(t,n),{coords:r,lengths:s}=e,c=[];let l=0;for(const e of s){const t=[];for(let n=0;n<e;n++){const e=[];for(let t=0;t<o;t++)e.push(r[l++]);t.push(e)}c.push(t)}return t?n?{paths:c,hasZ:t,hasM:n}:{paths:c,hasZ:t}:n?{paths:c,hasM:n}:{paths:c}}function S(e,t,n,o,r){const s=i(n,o);for(const n of t){const t=n.geometry,o=n.attributes;let u;t&&(u=U(new l,t,s)),e.push(new c(u,o,null,o[r]))}return e}function U(e,t,n=i(t.hasZ,t.hasM)){const{lengths:o,coords:r}=e;let s=0;for(const e of t.paths){for(const t of e)for(let e=0;e<n;e++)r[s++]=t[e];o.push(e.length)}return e}function $(e,t,n){if(!e)return null;const o=i(t,n),{coords:r,lengths:s}=e,c=[];let l=0;for(const e of s){const t=[];for(let n=0;n<e;n++){const e=[];for(let t=0;t<o;t++)e.push(r[l++]);t.push(e)}c.push(t)}return t?n?{rings:c,hasZ:t,hasM:n}:{rings:c,hasZ:t}:n?{rings:c,hasM:n}:{rings:c}}function A(e,t,n,o,r){for(const s of t){const t=s.geometry,u=s.centroid,i=s.attributes;let a;t&&(a=O(new l,t,n,o)),u?e.push(new c(a,i,T(new l,u),i[r])):e.push(new c(a,i,null,i[r]))}return e}function O(e,t,n=t.hasZ,o=t.hasM){return R(e,t.rings,n,o),e}function R(e,t,n,o){const r=i(n,o),{lengths:s,coords:c}=e;let l=0;s.length=c.length=0;for(const e of t){for(const t of e)for(let e=0;e<r;e++)c[l++]=t[e];s.push(e.length)}return e}const V=[],Y=[];function _(e,t,n,o,r){V[0]=e;const[s]=C(Y,V,t,n,o,r);return V.length=Y.length=0,s}function C(e,n,o,r,s,l){if(e.length=0,!o){for(const t of n){const n=t.attributes[l];e.push(new c(null,t.attributes,null,n))}return e}switch(o){case"esriGeometryPoint":return v(e,n,r,s,l);case"esriGeometryMultipoint":return E(e,n,r,s,l);case"esriGeometryPolyline":return S(e,n,r,s,l);case"esriGeometryPolygon":return A(e,n,r,s,l);default:a.error("convertToFeatureSet:unknown-geometry",new t(`Unable to parse unknown geometry type '${o}'`)),e.length=0}return e}function B(e,n,o,r,s,c){const l=e.length;switch(o){case"esriGeometryPoint":v(e,n,r,s,c);break;case"esriGeometryMultipoint":E(e,n,r,s,c);break;case"esriGeometryPolyline":S(e,n,r,s,c);break;case"esriGeometryPolygon":A(e,n,r,s,c);break;default:a.error("convertToFeatureSet:unknown-geometry",new t(`Unable to parse unknown geometry type '${o}'`))}for(let t=0;t<n.length;t++)e[t+l].geometryType=o,e[t+l].insertAfter=n[t].insertAfter,e[t+l].groupId=n[t].groupId;return e}function D(e,t,n,o){Y[0]=e,K(V,Y,t,n,o);const r=V[0];return V.length=Y.length=0,r}function H(e,c,u){if(!e)return null;const f=new l;if("hasZ"in e&&null==c&&(c=e.hasZ),"hasM"in e&&null==u&&(u=e.hasM),n(e)){return j(null!=c?c:null!=e.z,null!=u?u:null!=e.m)(f,e)}return o(e)?O(f,e,c,u):r(e)?U(f,e,i(c,u)):s(e)?L(f,e,i(c,u)):void a.error("convertFromGeometry:unknown-geometry",new t(`Unable to parse unknown geometry type '${e}'`))}function J(e,n,o,r){const s=e&&("coords"in e?e:e.geometry);if(!s)return null;switch(n){case"esriGeometryPoint":{let e=M;return o&&r?e=x:o?e=N:r&&(e=P),e(s)}case"esriGeometryMultipoint":return z(s,o,r);case"esriGeometryPolyline":return q(s,o,r);case"esriGeometryPolygon":return $(s,o,r);default:return void a.error("convertToGeometry:unknown-geometry",new t(`Unable to parse unknown geometry type '${n}'`))}}function K(e,n,o,r,s){switch(e.length=0,o){case"esriGeometryPoint":return function(e,t,n,o){let r=M;n&&o?r=x:n?r=N:o&&(r=P);for(const n of t){const{geometry:t,attributes:o}=n,s=t?r(t):null;e.push({attributes:o,geometry:s})}return e}(e,n,r,s);case"esriGeometryMultipoint":return function(e,t,n,o){for(const r of t){const{geometry:t,attributes:s}=r;let c;t&&(c=z(t,n,o)),e.push({attributes:s,geometry:c})}return e}(e,n,r,s);case"esriGeometryPolyline":return function(e,t,n,o){for(const r of t){const{geometry:t,attributes:s}=r;let c;t&&(c=q(t,n,o)),e.push({attributes:s,geometry:c})}return e}(e,n,r,s);case"esriGeometryPolygon":return function(e,t,n,o){for(const r of t){const{geometry:t,attributes:s,centroid:c}=r;let l;if(t&&(l=$(t,n,o)),c){const t=M(c);e.push({attributes:s,centroid:t,geometry:l})}else e.push({attributes:s,geometry:l})}return e}(e,n,r,s);default:a.error("convertToFeatureSet:unknown-geometry",new t(`Unable to parse unknown geometry type '${o}'`))}return e}function Q(e){const{objectIdFieldName:t,spatialReference:n,transform:o,fields:r,hasM:s,hasZ:c,features:l,geometryType:u,exceededTransferLimit:i,uniqueIdField:a,queryGeometry:f,queryGeometryType:h}=e,g={features:K([],l,u,c,s),fields:r,geometryType:u,objectIdFieldName:t,spatialReference:n,uniqueIdField:a,queryGeometry:J(f,h,!1,!1)};return o&&(g.transform=o),i&&(g.exceededTransferLimit=i),s&&(g.hasM=s),c&&(g.hasZ=c),g}function W(e,n){const o=new u,{hasM:r,hasZ:s,features:c,objectIdFieldName:l,spatialReference:i,geometryType:f,exceededTransferLimit:h,transform:g,fields:d}=e;return d&&(o.fields=d),o.geometryType=f,o.objectIdFieldName=l||n,o.spatialReference=i,o.objectIdFieldName?(c&&C(o.features,c,f,s,r,o.objectIdFieldName),h&&(o.exceededTransferLimit=h),r&&(o.hasM=r),s&&(o.hasZ=s),g&&(o.transform=g),o):(a.error(new t("optimized-features:invalid-objectIdFieldName","objectIdFieldName is missing")),o)}function X(e,t){const{geometryType:n,features:o,hasM:r,hasZ:s}=t;if(!e)return t;for(let t=0;t<o.length;t++){const c=o[t],u=c.weakClone();u.geometry=new l,ee(u.geometry,c.geometry,r,s,n,e),c.centroid&&(u.centroid=new l,ee(u.centroid,c.centroid,r,s,"esriGeometryPoint",e)),o[t]=u}return t.transform=e,t}function ee(e,t,n,o,r,s,c=n,l=o){if(e.lengths.length&&(e.lengths.length=0),e.coords.length&&(e.coords.length=0),!t||!t.coords.length)return null;const u=f[r],{coords:a,lengths:h}=t,g=i(n,o),d=i(n&&c,o&&l),m=y(n,o,c,l);if(!h.length)return m(e.coords,a,0,0,p(s,a[0]),b(s,a[1])),e.lengths.length&&(e.lengths.length=0),e.coords.length=g,e;let w,I,G,M,T=0,N=0,F=N;for(const t of h){if(t<u)continue;let n=0;N=F,G=w=p(s,a[T]),M=I=b(s,a[T+1]),m(e.coords,a,N,T,G,M),n++,T+=g,N+=d;for(let o=1;o<t;o++,T+=g)G=p(s,a[T]),M=b(s,a[T+1]),G===w&&M===I||(m(e.coords,a,N,T,G-w,M-I),N+=d,n++,w=G,I=M);n>=u&&(e.lengths.push(n),F=N)}return e.coords.length=F,e.coords.length?e:null}function te(e,t,n,o,r,s,c=n,l=o){if(e.lengths.length&&(e.lengths.length=0),e.coords.length&&(e.coords.length=0),!t||!t.coords.length)return null;const u=f[r],{coords:a,lengths:h}=t,g=i(n,o),d=i(n&&c,o&&l),m=y(n,o,c,l);if(!h.length)return m(e.coords,a,0,0,a[0],a[1]),e.lengths.length&&(e.lengths.length=0),e.coords.length=g,e;let p=0;const b=s*s;for(const t of h){if(t<u){p+=t*g;continue}const n=e.coords.length/d,o=p,r=p+(t-1)*g;m(e.coords,a,e.coords.length,o,a[o],a[o+1]),oe(e.coords,a,g,b,m,o,r),m(e.coords,a,e.coords.length,r,a[r],a[r+1]);const s=e.coords.length/d-n;s>=u?e.lengths.push(s):e.coords.length=n*d,p+=t*g}return e.coords.length?e:null}function ne(e,t,n,o){const r=e[t],s=e[t+1],c=e[n],l=e[n+1],u=e[o],i=e[o+1];let a=c,f=l,h=u-a,g=i-f;if(0!==h||0!==g){const e=((r-a)*h+(s-f)*g)/(h*h+g*g);e>1?(a=u,f=i):e>0&&(a+=h*e,f+=g*e)}return h=r-a,g=s-f,h*h+g*g}function oe(e,t,n,o,r,s,c){let l,u=o,i=0;for(let e=s+n;e<c;e+=n)l=ne(t,e,s,c),l>u&&(i=e,u=l);u>o&&(i-s>n&&oe(e,t,n,o,r,s,i),r(e,t,e.length,i,t[i],t[i+1]),c-i>n&&oe(e,t,n,o,r,i,c))}function re(e,t,n,o){if(!t||!t.coords||!t.coords.length)return null;const r=i(n,o);let s=Number.POSITIVE_INFINITY,c=Number.POSITIVE_INFINITY,l=Number.NEGATIVE_INFINITY,u=Number.NEGATIVE_INFINITY;if(t&&t.coords){const e=t.coords;for(let t=0;t<e.length;t+=r){const n=e[t],o=e[t+1];s=Math.min(s,n),l=Math.max(l,n),c=Math.min(c,o),u=Math.max(u,o)}}return e[0]=s,e[1]=c,e[2]=l,e[3]=u,e}function se(e,t,n,o,r){const{coords:s,lengths:c}=t,l=n?o?m:g:o?g:h,u=i(n,o);if(!s.length)return e!==t&&(e.lengths.length=0,e.coords.length=0),e;if(!c.length)return l(e.coords,s,0,0,w(r,s[0]),I(r,s[1])),e!==t&&(e.lengths.length=0,e.coords.length=u),e;const[a,f]=r.scale;let d=0;for(let t=0;t<c.length;t++){const n=c[t];e.lengths[t]=n;let o=w(r,s[d]),i=I(r,s[d+1]);l(e.coords,s,d,d,o,i),d+=u;for(let t=1;t<n;t++,d+=u)o+=s[d]*a,i-=s[d+1]*f,l(e.coords,s,d,d,o,i)}return e!==t&&(e.lengths.length=c.length,e.coords.length=s.length),e}function ce(e,t,n,o,r,s){const c=i(n,o),l=y(n,o,r,s),u=t.coords;e.coords.length=0,e.lengths.length=0,e.lengths.push(...t.lengths);for(let t=0;t<u.length;t+=c)l(e.coords,u,e.coords.length,t,u[t],u[t+1]);return e}function le(e,t,n,o){let r=0,s=e[o*t],c=e[o*(t+1)];for(let l=1;l<n;l++){const n=s+e[o*(t+l)],u=c+e[o*(t+l)+1],i=(n-s)*(u+c);s=n,c=u,r+=i}return.5*r}function ue(e,t){const{coords:n,lengths:o}=e;let r=0,s=0;for(let e=0;e<o.length;e++){s+=le(n,r,o[e],t),r+=e}return Math.abs(s)}function ie(e,t){const n=e.clone(),o=e.coords,r=e.lengths;let s=0;for(let e=0;e<r.length;e++){const c=r[e];let l=o[t*s],u=o[t*s+1];for(let e=1;e<c;e++){const r=l+o[t*(s+e)],c=u+o[t*(s+e)+1];n.coords[t*(s+e)]=r,n.coords[t*(s+e)+1]=c,l=r,u=c}s+=c}return n}export{Q as a,H as b,J as c,R as d,O as e,te as f,re as g,G as h,q as i,$ as j,z as k,C as l,D as m,_ as n,W as o,X as p,ee as q,ce as r,p as s,b as t,se as u,ue as v,B as w,U as x,ie as y};