// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../core/screenUtils ../../../support/widgetUtils ../../../../libs/maquette/projection ../../../../libs/maquette/projector ../../../../chunks/index ../../../../symbols/support/symbolUtils ../../../../symbols/support/svgUtils".split(" "),function(m,t,u,M,D,f,E,l){function y(a,b,d){const c=`${d}_arrowStart`;d=`${d}_arrowEnd`;a="left"===a;const e={markerStart:null,markerEnd:null};switch(b){case "HL":a?e.markerStart=`url(#${d})`:e.markerEnd=`url(#${c})`;break;case "LL":e.markerStart=
`url(#${d})`;break;case "LH":a?e.markerEnd=`url(#${c})`:e.markerStart=`url(#${d})`;break;default:e.markerEnd=`url(#${c})`}return e}function F(a,b,d,c=60){const {focus:e,numClasses:h,colors:n,rotation:G}=a;a=!!e;const r=Math.sqrt(Math.pow(c,2)+Math.pow(c,2))+(a?0:5);let z=null;null!=d&&(z=`opacity: ${d}`);d=[];const A=[];var v=[],p=(c||75)/h;for(var q=0;q<h;q++){var w=q*p;for(var k=0;k<h;k++){var x=k*p;const B=l.generateFillAttributes(n[q][k]),H=l.generateStrokeAttributes(null);x={type:"rect",x,y:w,
width:p,height:p};d.push(l.renderDef(B));A.push(l.renderShape(x,B.fill,H,null));v.push(l.getBoundingBox(x))}}p=null;a||(p="margin: -15px -15px -18px -15px");q=y("left",e,b);w=y("right",e,b);k=l.computeBBox(v);v=l.getTransformMatrix(k,r,r,0,!1,G);k=l.getTransformMatrix(k,r,r,0,!1,a?-45:null);return f.jsx("div",{style:z,class:a?g.diamondMidColRamp:g.squareTableCell},f.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:r,height:r,style:p},f.jsx("defs",null,f.jsx("marker",{id:`${b}_arrowStart`,markerWidth:"10",
markerHeight:"10",refX:"5",refY:"5",markerUnits:"strokeWidth",orient:"auto"},f.jsx("polyline",{points:"0,0 5,5 0,10",fill:"none",stroke:"#555555","stroke-width":"1"})),f.jsx("marker",{id:`${b}_arrowEnd`,markerWidth:"10",markerHeight:"10",refX:"0",refY:"5",markerUnits:"strokeWidth",orient:"auto"},f.jsx("polyline",{points:"5,0 0,5 5,10",fill:"none",stroke:"#555555","stroke-width":"1"})),d),f.jsx("g",{transform:v},A),f.jsx("g",{transform:k},f.jsx("line",{fill:"none",stroke:"#555555","stroke-width":"1",
"marker-start":q.markerStart,"marker-end":q.markerEnd,x1:-10,y1:c-15,x2:-10,y2:15}),f.jsx("line",{fill:"none",stroke:"#555555","stroke-width":"1","marker-start":w.markerStart,"marker-end":w.markerEnd,x1:15,y1:c+10,x2:c-15,y2:c+10}))))}function I(a="vertical"){return"vertical"===a?f.jsx("svg",{height:"4",width:"10"},f.jsx("line",{x1:"0",y1:"2",x2:"10",y2:"2",style:"stroke:rgb(200, 200, 200);stroke-width:1"})):f.jsx("svg",{height:"10",width:"10"},f.jsx("line",{x1:"5",y1:"0",x2:"5",y2:"10",style:"stroke:rgb(200, 200, 200);stroke-width:1"}))}
function J(a,b="vertical"){const d=document.createElement("div");d.style.height="20px";d.className=g.univariateAboveAndBelowSymbol;null!=a&&(d.style.opacity=a.toString());K.append(d,I.bind(null,b));return d}function L(a,b,d="vertical"){a.infos.forEach((c,e)=>{if(2===e)c.preview=J(b,d);else{e=t.pt2px(c.size)+("horizontal"===d?20:10);const h="div"===c.preview.tagName.toLowerCase(),n=h?c.preview:document.createElement("div");n.className=g.univariateAboveAndBelowSymbol;"horizontal"===d?n.style.width=
`${e}px`:n.style.height=`${e}px`;h||n.appendChild(c.preview);c.preview=n}})}function C(a,b,d="vertical"){let c=0;a=a.infos;var e="full"===b||"above"===b?0:2;for(b="full"===b||"below"===b?4:2;e<=b;e++)if(2===e)c+="horizontal"===d?10:20;else{const h=t.pt2px(a[e].size)+("horizontal"===d?20:10);c+=h}return c}const K=D.createProjector(),g={diamondContainer:"esri-relationship-ramp--diamond__container",diamondLeftCol:"esri-relationship-ramp--diamond__left-column",diamondRightCol:"esri-relationship-ramp--diamond__right-column",
diamondMidCol:"esri-relationship-ramp--diamond__middle-column",diamondMidColLabel:"esri-relationship-ramp--diamond__middle-column--label",diamondMidColRamp:"esri-relationship-ramp--diamond__middle-column--ramp",squareTable:"esri-relationship-ramp--square__table",squareTableRow:"esri-relationship-ramp--square__table-row",squareTableCell:"esri-relationship-ramp--square__table-cell",squareTableLabel:"esri-relationship-ramp--square__table-label",squareTableLabelLeftBottom:"esri-relationship-ramp--square__table-label--left-bottom",
squareTableLabelRightBottom:"esri-relationship-ramp--square__table-label--right-bottom",squareTableLabelLeftTop:"esri-relationship-ramp--square__table-label--left-top",squareTableLabelRightTop:"esri-relationship-ramp--square__table-label--right-top",univariateAboveAndBelowSymbol:"esri-univariate-above-and-below-ramp__symbol",colorRamp:"esri-legend__color-ramp"};m.getUnivariateAboveAndBelowColorRampMargin=function(a,b="classic"){a=a.infos;return"classic"===b?(t.pt2px(a[0].size)+10)/2:(a[0].size-a[a.length-
1].size)/2};m.getUnivariateAboveAndBelowColorRampPreview=function(a,b){if(!a)return null;a=a.infos.map(d=>d.color);a=E.renderColorRampPreviewHTML("full"===b.type?a:"above"===b.type?a.slice(0,3):a.slice(2,5),{width:b.width,height:b.height,align:b.rampAlignment});a.className=g.colorRamp;null!=b.opacity&&(a.style.opacity=b.opacity.toString());return a};m.getUnivariateAboveAndBelowColorRampSize=function(a,b,d="vertical"){d=C(a,b,d);a=a.infos;const c="full"===b||"above"===b?0:2,e="full"===b||"below"===
b?4:2;return d-(t.pt2px(("full"===b?a[c].size+a[e].size:"above"===b?a[c].size:a[e].size)/2)+15)};m.getUnivariateAboveAndBelowRampElements=function(a,b,d="vertical"){var c=a.infos;a=c.filter(({type:h})=>"size-ramp"===h)[0];c=c.filter(({type:h})=>"color-ramp"===h)[0];a&&(a={...a},a.infos=[...a.infos]);c&&(c={...c},c.infos=[...c.infos]);L(a,b,d);if("horizontal"===d){var e;a.infos.reverse();null==(e=c)?void 0:e.infos.reverse()}return{sizeRampElement:a,colorRampElement:c}};m.getUnivariateAboveAndBelowSizeRampSize=
C;m.renderRelationshipRamp=function(a,b,d){const {focus:c,labels:e}=a,h=!!c;a=F(a,b,d);return h?f.jsx("div",{class:g.diamondContainer},f.jsx("div",{class:g.diamondLeftCol},e.left),f.jsx("div",{class:g.diamondMidCol},f.jsx("div",{class:g.diamondMidColLabel},e.top),a,f.jsx("div",{class:g.diamondMidColLabel},e.bottom)),f.jsx("div",{class:g.diamondRightCol},e.right)):f.jsx("div",{class:g.squareTable},f.jsx("div",{class:g.squareTableRow},f.jsx("div",{class:u.classes(g.squareTableCell,g.squareTableLabel,
g.squareTableLabelRightBottom)},e.left),f.jsx("div",{class:g.squareTableCell}),f.jsx("div",{class:u.classes(g.squareTableCell,g.squareTableLabel,g.squareTableLabelLeftBottom)},e.top)),f.jsx("div",{class:g.squareTableRow},f.jsx("div",{class:g.squareTableCell}),a,f.jsx("div",{class:g.squareTableCell})),f.jsx("div",{class:g.squareTableRow},f.jsx("div",{class:u.classes(g.squareTableCell,g.squareTableLabel,g.squareTableLabelRightTop)},e.bottom),f.jsx("div",{class:g.squareTableCell}),f.jsx("div",{class:u.classes(g.squareTableCell,
g.squareTableLabel,g.squareTableLabelLeftTop)},e.right)))};Object.defineProperty(m,"__esModule",{value:!0})});