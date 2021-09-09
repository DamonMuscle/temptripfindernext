// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../core/Error ../../core/promiseUtils ../../core/screenUtils ./gfxUtils ./previewUtils ./renderUtils".split(" "),function(w,y,x,p,t,r,z){function A(f,a){const b=B.getContext("2d"),g=[];a&&(a.weight&&g.push(a.weight),a.size&&g.push(a.size+"px"),a.family&&g.push(a.family));b.font=g.join(" ");return b.measureText(f).width}function C(f){if(0===f.length)return 0;if(2<f.length){const a=p.px2pt(1),b=parseFloat(f);switch(f.slice(-2)){case "px":return b;case "pt":return b*a;case "in":return 72*
b*a;case "pc":return 12*b*a;case "mm":return b*D*a;case "cm":return b*E*a}}return parseFloat(f)}const B=document.createElement("canvas"),D=7.2/2.54,E=72/2.54;w.previewSymbol2D=function(f,a){var b=null!=(null==a?void 0:a.size)?p.pt2px(a.size):null,g=null!=(null==a?void 0:a.maxSize)?p.pt2px(a.maxSize):null;const F=null!=(null==a?void 0:a.opacity)?a.opacity:null,G=null!=(null==a?void 0:a.rotation)?a.rotation:null;var h=t.getStroke(f);const k={shape:null,fill:null,stroke:h,offset:[0,0]};null!=h&&h.width&&
(h.width=Math.min(h.width,80));var c=(null==h?void 0:h.width)||0;let m=null==b?!1:null!=(null==a?void 0:a.scale)?null==a?void 0:a.scale:!0,d=0,e=0;switch(f.type){case "simple-marker":h=f.style;e=d=b=Math.min(null!=b?b:p.pt2px(f.size),g||120);switch(h){case "circle":k.shape={type:"circle",cx:0,cy:0,r:.5*b};m||(d+=c,e+=c);break;case "cross":k.shape={type:"path",path:[{command:"M",values:[0,.5*e]},{command:"L",values:[d,.5*e]},{command:"M",values:[.5*d,0]},{command:"L",values:[.5*d,e]}]};break;case "diamond":k.shape=
{type:"path",path:[{command:"M",values:[0,.5*e]},{command:"L",values:[.5*d,0]},{command:"L",values:[d,.5*e]},{command:"L",values:[.5*d,e]},{command:"Z",values:[]}]};m||(d+=c,e+=c);break;case "square":k.shape={type:"path",path:[{command:"M",values:[0,0]},{command:"L",values:[d,0]},{command:"L",values:[d,e]},{command:"L",values:[0,e]},{command:"Z",values:[]}]};m||(d+=c,e+=c);break;case "triangle":k.shape={type:"path",path:[{command:"M",values:[.5*d,0]},{command:"L",values:[d,e]},{command:"L",values:[0,
e]},{command:"Z",values:[]}]};m||(d+=c,e+=c);break;case "x":k.shape={type:"path",path:[{command:"M",values:[0,0]},{command:"L",values:[d,e]},{command:"M",values:[d,0]},{command:"L",values:[0,e]}]};break;case "path":k.shape={type:"path",path:f.path||""},m||(d+=c,e+=c),m=!0}break;case "simple-line":b=Math.min(null!=b?b:c,g||80);g=22<b?2*b:40;h.width=b;d=g;e=b;k.shape={type:"path",path:[{command:"M",values:[0,e]},{command:"L",values:[d,e]}]};break;case "picture-fill":case "simple-fill":e=d=Math.min(null!=
b?b:22,g||120)+c;m=!0;k.shape="object"===typeof(null==a?void 0:a.symbolConfig)&&null!=a&&a.symbolConfig.isSquareFill?r.shapes.squareFill[0]:r.shapes.fill[0];break;case "picture-marker":h=p.pt2px(f.width);var l=p.pt2px(f.height);c=Math.max(h,l);l=h/l;h=1>=l?Math.ceil(c*l):c;l=1>=l?c:Math.ceil(c/l);d=Math.min(null!=b?b:h,g||120);e=Math.min(null!=b?b:l,g||120);k.shape={type:"image",x:-Math.round(d/2),y:-Math.round(e/2),width:d,height:e,src:f.url||""};break;case "text":h=f.text||"Aa",c=f.font,b=Math.min(null!=
b?b:p.pt2px(c.size),g||120),l=A(h,{weight:c.weight,size:b,family:c.family}),d=(g=/[\uE600-\uE6FF]/.test(h))?b:l,e=b,l=.25*C((c?b:0).toString()),g&&(l+=5),k.shape={type:"text",text:h,x:0,y:l,align:"middle",decoration:c&&c.decoration,rotated:f.rotated,kerning:f.kerning},k.font=c&&{size:b,style:c.style,decoration:c.decoration,weight:c.weight,family:c.family}}if(!k.shape)return x.reject(new y("symbolPreview: renderPreviewHTML2D","symbol not supported."));const n=t.getFill(f);b=f.color;g=null;n&&"pattern"===
n.type&&b&&"picture-fill"!==f.type?g=t.getPatternUrlWithColor(n.src,b.toCss(!0)).then(q=>{n.src=q;k.fill=n;return k}):(k.fill=n,g=x.resolve(k));return g.then(q=>{const u=[[q]];if("object"===typeof(null==a?void 0:a.symbolConfig)&&null!=a&&a.symbolConfig.applyColorModulation){const v=.6*d;u.unshift([{...q,offset:[-v,0],fill:r.adjustColorBrightness(n,-.3)}]);u.push([{...q,offset:[v,0],fill:r.adjustColorBrightness(n,.3)}]);d+=2*v}return z.renderSymbol(u,[d,e],{node:a&&a.node,scale:m,opacity:F,rotation:G})})};
Object.defineProperty(w,"__esModule",{value:!0})});