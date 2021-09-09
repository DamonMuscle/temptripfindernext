// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("require exports ../../core/Logger ../../core/Error ../../support/arcadeOnDemand ./fieldUtils ../../intl/date ../../intl/number ./FieldsIndex ./labelUtils".split(" "),function(r,k,t,u,v,l,m,w,x,n){function p(b,f){if(null==b)return"";const a=f.domain;if(a)if("codedValue"===a.type||"coded-value"===a.type)for(var g of a.codedValues){if(g.code===b)return g.name}else if("range"===a.type){g=+b;const h="range"in a?a.range[1]:a.maxValue;if(("range"in a?a.range[0]:a.minValue)<=g&&g<=h)return a.name}"date"===
f.type||"esriFieldTypeDate"===f.type?b=m.formatDate(b,m.convertDateFormatToIntlOptions("short-date")):l.isNumericField(f)&&(b=w.formatNumber(+b));return b?b:""}const y=t.getLogger("esri.layers.support.labelFormatUtils"),q={type:"simple",evaluate(){return null}},z={getAttribute(b,f){return b.field(f)}};k.createLabelFunction=async function(b,f,a){if(!b||!b.symbol)return q;const g=b.where,h=n.getLabelExpression(b);b=g?await new Promise(function(e,c){r(["../../core/sql/WhereClause"],e,c)}):null;if("arcade"===
h.type){const e=await v.createLabelExpression(h.expression,a,f);a={type:"arcade",evaluate(c){try{const d=e.evaluate({$feature:"attributes"in c?e.repurposeFeature(c):e.repurposeAdapter(c)});if(null!=d)return d.toString()}catch(d){y.error(new u("bad-arcade-expression","Encountered an error when evaluating label expression for feature",{feature:c,expression:h}))}return null},needsHydrationToEvaluate(){return null==n.getSingleFieldArcadeExpression(h.expression)}}}else a={type:"simple",evaluate(e){return h.expression.replace(/{[^}]*}/g,
c=>{var d=c.slice(1,-1);d=l.getField(f,d);if(!d)return c;c=null;"attributes"in e?e&&e.attributes&&(c=e.attributes[d.name]):c=e.field(d.name);return null==c?"":p(c,d)})}};if(g){let e;try{e=b.WhereClause.create(g,new x(f))}catch(d){return q}const c=a.evaluate;a.evaluate=d=>e.testFeature(d,"attributes"in d?void 0:z)?c(d):null}return a};k.formatField=p;Object.defineProperty(k,"__esModule",{value:!0})});