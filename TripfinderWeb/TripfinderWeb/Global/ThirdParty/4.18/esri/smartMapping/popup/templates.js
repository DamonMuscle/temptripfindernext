// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../core/Error ./classBreaks ./dotDensity ./heatmap ./predominance ./relationship ./simple ./uniqueValues".split(" "),function(e,f,g,h,k,l,m,n,p){e.getTemplates=async function(d){({layer:b}=d);d=d.renderer||b.renderer;if(!d)throw new f("getTemplates:invalid-parameters","'renderer' or 'layer.renderer' must be provided");var b={layer:b,renderer:d};const {renderer:a,layer:c}=b;return"simple"===a.type?n.getTemplates({renderer:a,layer:c}):"class-breaks"===a.type?g.getTemplates({renderer:a,
layer:c}):"dot-density"===a.type?h.getTemplates({renderer:a,layer:c}):"heatmap"===a.type?k.getTemplates({renderer:a,layer:c}):"unique-value"===a.type?(b=a.authoringInfo&&a.authoringInfo.type,"predominance"===b?l.getTemplates({renderer:a,layer:c}):"relationship"===b?m.getTemplates({renderer:a,layer:c}):p.getTemplates({renderer:a,layer:c})):null};Object.defineProperty(e,"__esModule",{value:!0})});