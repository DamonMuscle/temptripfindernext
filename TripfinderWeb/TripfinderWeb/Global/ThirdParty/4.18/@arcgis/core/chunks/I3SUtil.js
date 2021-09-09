/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{h as e}from"./object.js";import{h as t,j as r}from"../core/lang.js";import{i as n,b as o}from"./Logger.js";import{f as a,s,g as i}from"../core/scheduling.js";import{all as c,eachAlways as l}from"../core/promiseUtils.js";import u from"../core/Error.js";import f from"../geometry/SpatialReference.js";import h from"../request.js";import{canProject as p}from"../geometry/support/webMercatorUtils.js";import{c as m}from"./vec3f64.js";import{f as d,g,z as y,w as b,s as w,a as M,i as v}from"./vec3.js";import{e as x,f as S}from"./unitUtils.js";import{a as j}from"./mat4.js";import{c as q,e as R,g as T,i as k}from"./aaBoundingRect.js";import{computeLinearTransformation as I,projectBoundingSphere as z,projectBuffer as F,projectVectorToVector as A}from"../geometry/projection.js";import{c as L}from"./vec4f64.js";import{c as G}from"./quatf64.js";import{a as C,m as K,c as O}from"./quat.js";import W from"../tasks/support/Query.js";import{c as B}from"./aaBoundingBox.js";import{h as E,i as U,j as P,g as $,k as D,l as Q}from"../views/SceneView.js";import{b as V}from"./quatf32.js";import{r as Z}from"./I3SBinaryReader.js";function H(e,t,r,n){const o=J(e,t,r),a=G();return I(r,o,a,n),a}function J(e,t,r){const n=m(),o=e[3],a=2**(4*Math.ceil(Math.log(o)*Math.LOG2E/4)+1);if(r.isGeographic){const t=a/x(r).radius*180/Math.PI,o=Math.round(e[1]/t),s=Math.max(-90,Math.min(90,o*t)),i=t/Math.cos((Math.abs(s)-t/2)/180*Math.PI),c=Math.round(e[0]/i)*i;n[0]=c,n[1]=s}else{const t=Math.round(e[0]/a),r=Math.round(e[1]/a);n[0]=t*a,n[1]=r*a}const s=e[2]+t,i=Math.round(s/a);return n[2]=i*a,n}const N="image/vnd-ms.dds",X=["image/jpeg","image/png"];function Y(e){return e&&parseInt(e.substring(e.lastIndexOf("/")+1,e.length),10)}function _(e,t){if(t)for(let t=0;t<e.length;t++)if("image/vnd-ms.dds"===e[t].encoding)return e[t];for(let t=0;t<e.length;t++)if(X.indexOf(e[t].encoding)>-1)return e[t];return null}function ee(t){if(e("disable-feature:i3s-draco")||!t)return!1;for(const e of t)for(const t of e.geometryBuffers)if("draco"===t.compressedAttributes.encoding)return!0;return!1}function te(e,t,r,n,o,a){o.traverse(r,(r=>{let o=r.mbs;t!==n&&(o=se,z(r.mbs,n,o,t));const s=function(e,t){const r=t[0],n=t[1],o=t[3],a=e[0]-r,s=r-e[2],i=e[1]-n,c=n-e[3],l=Math.max(a,s,0),u=Math.max(i,c,0),f=l*l+u*u;if(f>o*o)return 0;if(f>0)return 1;if(-Math.max(a,s,i,c)>o)return 3;return 2}(e,o);return 0!==s&&(a(r,s),!0)}))}function re(e,t,r){let n=0,o=0;for(let a=0;a<t.length&&n<e.length;a++)e[n]===t[a]&&(r(a)&&(e[o]=e[n],o++),n++);e.length=o}function ne(e,t,r){let n=0,o=0;for(;n<r.length;){i(e,r[n])>=0===t&&(r[o]=r[n],o++),n++}r.length=o}const oe=B();function ae(e,t){if(0===t.rotationScale[1]&&0===t.rotationScale[2]&&0===t.rotationScale[3]&&0===t.rotationScale[5]&&0===t.rotationScale[6]&&0===t.rotationScale[7])return oe[0]=(e[0]-t.position[0])/t.rotationScale[0],oe[1]=(e[1]-t.position[1])/t.rotationScale[4],oe[2]=(e[2]-t.position[2])/t.rotationScale[8],oe[3]=(e[3]-t.position[0])/t.rotationScale[0],oe[4]=(e[4]-t.position[1])/t.rotationScale[4],oe[5]=(e[5]-t.position[2])/t.rotationScale[8],oe}const se=L();function ie(e,t){const r=t[0],n=t[1],o=t[2],a=t[3],s=e[0]-r,i=r-e[3],c=e[1]-n,l=n-e[4],u=e[2]-o,f=o-e[5],h=Math.max(s,i,0),p=Math.max(c,l,0),m=Math.max(u,f,0),d=h*h+p*p+m*m;if(d>a*a)return 0;if(d>0)return 1;return-Math.max(s,i,c,l,u,f)>a?3:2}function ce(e,t,r){const n=[],o=r&&r.missingFields,a=r&&r.originalFields;for(const r of e){const e=r.toLowerCase();let s=!1;for(const o of t)if(e===o.name.toLowerCase()){n.push(o.name),s=!0,a&&a.push(r);break}!s&&o&&o.push(r)}return n}async function le(e,t,r,s,i,f){var p;if(!0===(f&&f.populateObjectId)&&(p=r,s=s.filter((e=>e!==p)).concat([p])),0===t.length)return[];const m=e.attributeStorageInfo;if(n(e.associatedLayer))try{return await async function(e,t,r,n){t.sort(((e,t)=>e.attributes[r]-t.attributes[r]));const o=t.map((e=>e.attributes[r])),a=[],s=ce(n,e.fields,{originalFields:a}),i=await ue(e,o,s);for(let e=0;e<t.length;e++){const r=t[e],n=i[e],o={};if(r.attributes)for(const e in r.attributes)o[e]=r.attributes[e];for(let e=0;e<a.length;e++)o[a[e]]=n[s[e]];r.attributes=o}return t}(e.associatedLayer,t,r,s)}catch(t){if(e.associatedLayer.loaded)throw t}if(m){const n=function(e,t,r){const n=new Map,o=[],a=r();for(const r of e){const e=r.attributes[t];for(let t=0;t<a.length;t++){const s=a[t],i=s.featureIds.indexOf(e);if(i>=0){let e=n.get(s.node);e||(e={node:s.node,indices:[],graphics:[]},o.push(e),n.set(s.node,e)),e.indices.push(i),e.graphics.push(r);for(let e=t;e>0;e--)a[e]=a[e-1];a[0]=s;break}}}return o}(t,r,i);if(o(n))throw new u("scenelayer:features-not-loaded","Tried to query attributes for unloaded features");const f=e.parsedUrl.path,p=await c(n.map((e=>function(e,t,r,n,o){const a=[];for(const n of t)if(n&&-1!==o.indexOf(n.name)){const t=`${e}/nodes/${r.resources.attributes}/attributes/${n.key}/0`;a.push({url:t,storageInfo:n})}return l(a.map((e=>h(e.url,{responseType:"array-buffer"}).then((t=>Z(e.storageInfo,t.data)))))).then((e=>{const t=[];for(const r of n){const n={};for(let t=0;t<e.length;t++)null!=e[t].value&&(n[a[t].storageInfo.name]=fe(e[t].value,r));t.push(n)}return t}))}(f,m,e.node,e.indices,s).then((t=>{for(let r=0;r<e.graphics.length;r++){const n=e.graphics[r],o=t[r];if(n.attributes)for(const e in n.attributes)e in o||(o[e]=n.attributes[e]);n.attributes=o}return e.graphics})))));return a(p)}throw new u("scenelayer:no-attribute-source","This scene layer does not have a source for attributes available")}function ue(e,t,r){const n=e.capabilities.query.maxRecordCount;if(null!=n&&t.length>n){const o=s(t,n);return c(o.map((t=>ue(e,t,r)))).then(a)}const o=new W({objectIds:t,outFields:r,orderByFields:[e.objectIdField]});return e.queryFeatures(o).then((e=>{if(e&&e.features&&e.features.length===t.length)return e.features.map((e=>e.attributes));throw new u("scenelayer:feature-not-in-associated-layer","Feature not found in associated feature layer")}))}function fe(e,n){if(!e)return null;const o=e[n];if(t(e))return-32768===o?null:o;if(r(e))return-2147483648===o?null:o;return o!=o?null:o}function he(e){const t=e.store.indexCRS||e.store.geographicCRS,r=void 0===t?e.store.indexWKT:void 0;if(r){if(!e.spatialReference)throw new u("layerview:no-store-spatial-reference-wkt-index-and-no-layer-spatial-reference","Found indeWKT in the scene layer store but no layer spatial reference",{});if(r!==e.spatialReference.wkt)throw new u("layerview:store-spatial-reference-wkt-index-incompatible","The indeWKT of the scene layer store does not match the WKT of the layer spatial reference",{})}const n=t?new f(Y(t)):e.spatialReference;return n.equals(e.spatialReference)?e.spatialReference:n}function pe(e){const t=e.store.vertexCRS||e.store.projectedCRS,r=void 0===t?e.store.vertexWKT:void 0;if(r){if(!e.spatialReference)throw new u("layerview:no-store-spatial-reference-wkt-vertex-and-no-layer-spatial-reference","Found vertexWKT in the scene layer store but no layer spatial reference",{});if(r!==e.spatialReference.wkt)throw new u("layerview:store-spatial-reference-wkt-vertex-incompatible","The vertexWKT of the scene layer store does not match the WKT of the layer spatial reference",{})}const n=t?new f(Y(t)):e.spatialReference;return n.equals(e.spatialReference)?e.spatialReference:n}function me(e,t){return o(t)?"@null":t===S(t)?"@ECEF":e.equals(t)?"":null!=t.wkid?"@"+t.wkid:null}function de(e,t,r){if(!p(e,t))throw new u("layerview:spatial-reference-incompatible","The spatial reference of this scene layer is incompatible with the spatial reference of the view",{});if("local"===r&&e.isGeographic)throw new u("layerview:local-gcs-not-supported","Geographic coordinate systems are not supported in local scenes",{})}function ge(e,t,r){const n=he(e),o=pe(e);de(n,t,r),de(o,t,r)}function ye(e){if(null==e.store||null==e.store.defaultGeometrySchema||(null!=(t=e.store.defaultGeometrySchema).geometryType&&"triangles"!==t.geometryType||null!=t.topology&&"PerAttributeArray"!==t.topology||null==t.vertexAttributes||null==t.vertexAttributes.position))throw new u("scenelayer:unsupported-geometry-schema","The geometry schema of this scene layer is not supported.",{url:e.parsedUrl.path});var t}function be(e,t){ge(e,t.spatialReference,t.viewingMode)}function we(e){if(null==e.store||null==e.store.defaultGeometrySchema||(null==(t=e.store.defaultGeometrySchema).geometryType||"points"!==t.geometryType||null!=t.topology&&"PerAttributeArray"!==t.topology||null!=t.encoding&&""!==t.encoding&&"lepcc-xyz"!==t.encoding||null==t.vertexAttributes||null==t.vertexAttributes.position))throw new u("pointcloud:unsupported-geometry-schema","The geometry schema of this point cloud scene layer is not supported.",{});var t}function Me(e,t){de(e.spatialReference,t.spatialReference,t.viewingMode)}function ve(e){return"mesh-3d"===e.type}function xe(e){if(null==e||!function(e){return"simple"===e.type||"class-breaks"===e.type||"unique-value"===e.type}(e))return!0;if(("unique-value"===e.type||"class-breaks"===e.type)&&null==e.defaultSymbol)return!0;const t=e.getSymbols();if(0===t.length)return!0;for(const e of t){if(!ve(e)||0===e.symbolLayers.length)return!0;for(const t of e.symbolLayers.items)if("fill"!==t.type||o(t.material)||o(t.material.color)||"replace"!==t.material.colorMixMode)return!0}return!1}const Se=U({color:[0,0,0,0],opacity:0});class je{constructor(){this.edgeMaterial=null,this.material=null,this.castShadows=!0}}function qe(e){const t=new je;let r=!1,o=!1;for(const a of e.symbolLayers.items)if("fill"===a.type&&a.enabled){const e=a.material,s=a.edges;if(n(e)&&!r){const o=e.color,s=P(e.colorMixMode);n(o)?t.material={color:[o.r/255,o.g/255,o.b/255],alpha:o.a,colorMixMode:s}:t.material={color:[1,1,1],alpha:1,colorMixMode:1},t.castShadows=a.castShadows,r=!0}n(s)&&!o&&(t.edgeMaterial=$(s,{}),o=!0)}return t.material||(t.material={color:[1,1,1],alpha:1,colorMixMode:1}),t}function Re(e,t){return(0|e)+(0|t)|0}function Te(e,t,r,n,o=0){n===S(n)?t.isGeographic?function(e,t,r,n){const o=x(r),a=1+Math.max(0,n)/(o.radius+e.center[2]);d(t.center,e.center[0],e.center[1],e.center[2]+n),F(t.center,r,0,t.center,S(r),0,1),C(t.quaternion,e.quaternion),O(ze,e.quaternion),d(Ce,0,0,1),b(Ce,Ce,ze),d(Ce,e.halfSize[0]*Math.abs(Ce[0]),e.halfSize[1]*Math.abs(Ce[1]),e.halfSize[2]*Math.abs(Ce[2])),w(Ce,Ce,o.inverseFlattening),M(t.halfSize,e.halfSize,Ce),w(t.halfSize,t.halfSize,a)}(e,r,t,o):function(e,t,r,n){D(e,Fe),d(t.center,e.center[0],e.center[1],e.center[2]+n),I(r,t.center,Ie,S(r)),d(t.center,Ie[12],Ie[13],Ie[14]);const o=2*Math.sqrt(1+Ie[0]+Ie[5]+Ie[10]);ze[0]=(Ie[6]-Ie[9])/o,ze[1]=(Ie[8]-Ie[2])/o,ze[2]=(Ie[1]-Ie[4])/o,ze[3]=.25*o,K(t.quaternion,ze,e.quaternion),O(ze,t.quaternion);let a=0,s=0,i=0;for(const e of Fe)e[2]+=n,F(e,r,0,e,S(r),0,1),y(Ce,e,t.center),b(Ce,Ce,ze),a=Math.max(a,Math.abs(Ce[0])),s=Math.max(s,Math.abs(Ce[1])),i=Math.max(i,Math.abs(Ce[2]));d(t.halfSize,a,s,i)}(e,r,t,o):e===r?(r.center[2]+=o,F(r.center,t,0,r.center,n,0,1)):(d(r.center,e.center[0],e.center[1],e.center[2]+o),F(r.center,t,0,r.center,n,0,1),C(r.quaternion,e.quaternion),g(r.halfSize,e.halfSize))}function ke(e,t,r,a,s,i){if(!i||0===i.length||o(t))return null;const c=H(e.mbs,s,r,t);let l;j(Oe,c);let u=1/0,f=-1/0;const h=o=>{if("replace"!==o.type)return;const i=o.geometry;if(!i.hasZ)return;R(Ae);const c=i.spatialReference||a,h=i.rings.reduce(((e,r)=>r.reduce(((e,r)=>(A(r,c,Ce,t),v(Ce,Ce,Oe),T(Ae,Ce),Math.min(Ce[2],e))),e)),1/0);(()=>{if(!l)if(l=Fe,R(Le),n(e.serviceObb)){Te(e.serviceObb,r,Ge,t,s),D(Ge,l);for(const e of l)v(e,e,Oe),T(Le,e)}else{const n=e.mbs,o=n[3];A(n,r,Ce,t),v(Ce,Ce,Oe),Ce[2]+=s;for(let e=0;e<8;++e){const t=1&e?o:-o,r=2&e?o:-o,n=4&e?o:-o,a=l[e];g(a,[Ce[0]+t,Ce[1]+r,Ce[2]+n]),T(Le,a)}}})(),k(Le,Ae)&&(u=Math.min(u,h),f=Math.max(f,h))};if(i.forEach((e=>h(e))),u===1/0)return null;for(let e=0;e<8;++e)p=Ke.data,m=3*e,d=l[e],v(Ce,d,c),p[m+0]=Ce[0],p[m+1]=Ce[1],p[m+2]=Ce[2],m+=24,d[2]=u,v(Ce,d,c),p[m+0]=Ce[0],p[m+1]=Ce[1],p[m+2]=Ce[2],m+=24,d[2]=f,v(Ce,d,c),p[m+0]=Ce[0],p[m+1]=Ce[1],p[m+2]=Ce[2];var p,m,d;return Q(Ke)}const Ie=G(),ze=V(),Fe=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],Ae=q(),Le=q(),Ge=E(),Ce=[0,0,0],Ke={data:new Array(72),size:3,offsetIdx:0,strideIdx:3},Oe=G();export{ee as A,N as D,ye as a,be as b,de as c,me as d,H as e,ce as f,he as g,ke as h,J as i,re as j,ie as k,Re as l,qe as m,fe as n,ae as o,ne as p,Te as q,xe as r,_ as s,Se as t,pe as u,te as v,le as w,we as x,Me as y,ge as z};
