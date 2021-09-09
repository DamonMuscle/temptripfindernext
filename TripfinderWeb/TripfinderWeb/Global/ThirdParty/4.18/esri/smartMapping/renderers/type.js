// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../core/lang ../../core/maybe ../../core/Error ../../core/promiseUtils ../../intl/messages ../../renderers/PointCloudRenderer ../../renderers/support/LegendOptions ../../renderers/PointCloudClassBreaksRenderer ../../renderers/PointCloudRGBRenderer ../../renderers/PointCloudStretchRenderer ../../renderers/PointCloudUniqueValueRenderer ../../renderers/Renderer ../../renderers/ClassBreaksRenderer ../../renderers/UniqueValueRenderer ../../renderers/DictionaryRenderer ../../renderers/DotDensityRenderer ../../renderers/HeatmapRenderer ../../renderers/SimpleRenderer ../../renderers/support/jsonUtils ../support/utils ../../renderers/support/utils ../support/adapters/support/layerUtils ../heuristics/outline ../heuristics/sizeRange ./support/utils ../statistics/uniqueValues ../../chunks/type".split(" "),
function(z,F,v,n,M,N,Z,O,aa,ba,ca,P,da,ea,Q,fa,ha,ia,ja,ka,G,A,w,R,S,g,H,B){async function T(a){if(!a||!a.layer||!a.field&&!a.valueExpression)throw new n("type-renderer:missing-parameters","'layer' and 'field' or 'valueExpression' parameters are required");if(a.valueExpression&&!a.view)throw new n("type-renderer:missing-parameters","View is required when 'valueExpression' is specified");a={...a};a.symbolType=a.symbolType||"2d";a.numTypes=null==a.numTypes?10:a.numTypes;a.defaultSymbolEnabled=null==
a.defaultSymbolEnabled?!0:a.defaultSymbolEnabled;a.sortBy=null==a.sortBy?"count":a.sortBy;a.sortEnabled=null==a.sortEnabled?!0:a.sortEnabled;a.statistics=F.clone(a.statistics);var b=[0,2,1,3],c=w.createLayerAdapter(a.layer,b);a.layer=c;if(!c)throw new n("type-renderer:invalid-parameters","'layer' must be one of these types: "+w.getLayerTypeLabels(b).join(", "));b=v.isSome(a.signal)?{signal:a.signal}:null;await c.load(b);b=c.geometryType;a.outlineOptimizationEnabled="polygon"===b?a.outlineOptimizationEnabled:
!1;a.sizeOptimizationEnabled="point"===b||"multipoint"===b||"polyline"===b?a.sizeOptimizationEnabled:!1;if("mesh"===b)a.symbolType="3d-volumetric",a.colorMixMode=a.colorMixMode||"replace",a.edgesType=a.edgesType||"none";else{if("3d-volumetric-uniform"===a.symbolType&&"point"!==b)throw new n("type-renderer:not-supported","3d-volumetric-uniform symbols are supported for point layers only");if(-1<a.symbolType.indexOf("3d-volumetric")&&(!a.view||"3d"!==a.view.type))throw new n("type-renderer:invalid-parameters",
"'view' parameter should be an instance of SceneView when 'symbolType' parameter is '3d-volumetric' or '3d-volumetric-uniform'");}b=await G.getFieldsList({field:a.field,valueExpression:a.valueExpression});if(c=g.verifyBasicFieldValidity(c,b,"type-renderer:invalid-parameters"))throw c;return a}async function U(a){if(!(a&&a.layer&&a.field))throw new n("type-point-cloud-class-renderer:missing-parameters","'layer' and 'field' parameters are required");a={...a};a.statistics=F.clone(a.statistics);var b=
[4],c=w.createLayerAdapter(a.layer,b);a.layer=c;a.density=a.density||25;a.size=a.size||"100%";if(!g.isValidPointSize(a.size))throw new n("type-point-cloud-class-renderer:invalid-parameters","Invalid 'size' parameter. It should be a string of the form '100%'");if(!c)throw new n("type-point-cloud-class-renderer:invalid-parameters","'layer' must be one of these types: "+w.getLayerTypeLabels(b).join(", "));b=v.isSome(a.signal)?{signal:a.signal}:null;await c.load(b);b=await G.getFieldsList({field:a.field});
if(c=g.verifyBasicFieldValidity(c,b,"type-point-cloud-class-renderer:invalid-parameters"))throw c;return a}async function I(a){let b=a.typeScheme,c=null;var d=null;d=await g.getBasemapInfo(a.basemap,a.view);c=v.isSome(d.basemapId)?d.basemapId:null;d=v.isSome(d.basemapTheme)?d.basemapTheme:null;if(b)return{scheme:B.cloneScheme(b),basemapId:c,basemapTheme:d};if(a=B.getSchemes({basemap:c,basemapTheme:d,geometryType:a.geometryType,theme:a.theme,worldScale:a.worldScale,view:a.view}))b=a.primaryScheme,
c=a.basemapId,d=a.basemapTheme;return{scheme:b,basemapId:c,basemapTheme:d}}function J(a,b){return a.label<b.label?-1:a.label>b.label?1:0}function K(a,b){return a.value<b.value?-1:a.value>b.value?1:0}function V(a,b){let c=b.count-a.count;0===c&&(c=J(a,b));return c}function W(a,b){let c=b.count-a.count;0===c&&(c=K(a,b));return c}function L(a,b,c){let d;"count"===b?(d=W,c&&c.codedValues&&(d=V)):"value"===b&&(d=K,c&&c.codedValues&&(d=J));d&&a.sort(d)}async function X(a,b,c,d){var l=await N.fetchMessageBundle("esri/smartMapping/t9n/smartMapping");
a=a.uniqueValueInfos;var k=b.layer,e=b.field,f=e?k.getField(e):null,r=f?k.getFieldDomain(f.name):null;const C=-1===b.numTypes?a.length:b.numTypes,p=k.geometryType;k=await I({basemap:b.basemap,geometryType:p,typeScheme:b.typeScheme,worldScale:-1<b.symbolType.indexOf("3d-volumetric"),view:b.view});const q=k.scheme;e=new Q({field:e});let D=-1;var m;const t={value:null,domain:r,fieldInfo:f};a.forEach((h,u)=>{t.value=h.value;h.label=A.createUniqueValueLabel(t);null===h.value&&(D=u)});-1<D&&(m=a.splice(D,
1)[0]);!1!==b.sortEnabled&&L(a,b.sortBy,r);f&&"date"===f.type&&(f=a.filter((h,u)=>u<C).map(h=>h.value),t.dateFormatInterval=A.calculateDateFormatInterval(f));f=c&&c.opacity;let E=g.createColors(q.colors,a.length);const x=g.getSymbolSizeFromScheme(q,p),y=g.getSymbolOutlineFromScheme(q,p,f);a.forEach((h,u)=>{t.value=h.value;h.label=A.createUniqueValueLabel(t);h.symbol=g.createSymbol(p,{type:b.symbolType,color:E[u],size:x,outline:y,meshInfo:{colorMixMode:b.colorMixMode,edgesType:b.edgesType}})});b.valueExpression&&
(e.valueExpression=b.valueExpression,e.valueExpressionTitle=b.valueExpressionTitle);b.legendOptions&&(e.legendOptions=new O.LegendOptions(b.legendOptions));E=g.createColors(q.colors,C);for(f=0;f<C;f++)(r=a[f])&&e.addUniqueValueInfo({value:r.value,label:r.label,symbol:g.createSymbol(p,{type:b.symbolType,color:E[f],size:x,outline:y,meshInfo:{colorMixMode:b.colorMixMode,edgesType:b.edgesType}})});b.defaultSymbolEnabled&&(e.defaultSymbol=g.createSymbol(p,{type:b.symbolType,color:q.noDataColor,size:x,
outline:y,meshInfo:{colorMixMode:b.colorMixMode,edgesType:b.edgesType}}),e.defaultLabel=l.other);m&&(m.symbol=g.createSymbol(p,{type:b.symbolType,color:q.noDataColor,size:x,outline:y,meshInfo:{colorMixMode:b.colorMixMode,edgesType:b.edgesType}}),a.push(m));l=[];m=e.uniqueValueInfos.length===a.length?-1:e.uniqueValueInfos.length;if(-1<m)for(;m<a.length;m++)l.push({...a[m]});c&&c.visualVariables&&c.visualVariables.length&&(e.visualVariables=c.visualVariables.map(h=>h.clone()));d&&d.minSize&&(e.visualVariables?
e.visualVariables.push(d.minSize):e.visualVariables=[d.minSize]);return{renderer:e,uniqueValueInfos:a,excludedUniqueValueInfos:l,typeScheme:B.cloneScheme(q),basemapId:k.basemapId,basemapTheme:k.basemapTheme}}async function Y(a,b){a=a.uniqueValueInfos;b=(b=await I({basemap:"gray",theme:"point-cloud-class",geometryType:"point",typeScheme:b}))&&b.scheme;const c="point-cloud-class"===b.theme,d=c?b.colors:g.createColors(b.colors,a.length);L(a,"value");return a.map((l,k)=>{const e=l.value;let f=null;c?
(f=d[e])||(f=d[d.length-1]):f=d[k];return{values:[e],color:f,label:l.label}})}z.createPCClassRenderer=async function(a){a=await U(a);const b=null!=a.statistics?a.statistics:await H({layer:a.layer,field:a.field,signal:a.signal});return{renderer:new P({field:a.field,pointsPerInch:a.density,pointSizeAlgorithm:g.getPointSizeAlgorithm(a.size),colorUniqueValueInfos:await Y(b,a.typeScheme)})}};z.createRenderer=async function(a){a=await T(a);const {layer:b,view:c,signal:d}=a,l={layer:b,field:a.field,valueExpression:a.valueExpression,
returnAllCodedValues:a.returnAllCodedValues,view:c,signal:d},[k,e,f]=await M.all([null!=a.statistics?a.statistics:H(l),a.outlineOptimizationEnabled?R({layer:b,view:c,signal:d}):null,a.sizeOptimizationEnabled?S({layer:b,view:c,signal:d}):null]);return X(k,a,e,f)};Object.defineProperty(z,"__esModule",{value:!0})});