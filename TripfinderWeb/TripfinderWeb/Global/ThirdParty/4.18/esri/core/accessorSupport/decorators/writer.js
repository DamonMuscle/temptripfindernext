// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../../object","./property"],function(g,h,l){g.writer=function(b,c,f){let d,e;void 0===c?(e=b,d=[void 0]):"string"!==typeof c?(e=b,d=[void 0],f=c):(e=c,d=Array.isArray(b)?b:[b]);return(k,m)=>{const n=k.constructor.prototype;d.forEach(a=>{a=l.propertyJSONMeta(k,a,e);a.write&&"object"!==typeof a.write&&(a.write={});f&&h.setDeepValue("write.target",f,a);h.setDeepValue("write.writer",n[m],a)})}};Object.defineProperty(g,"__esModule",{value:!0})});