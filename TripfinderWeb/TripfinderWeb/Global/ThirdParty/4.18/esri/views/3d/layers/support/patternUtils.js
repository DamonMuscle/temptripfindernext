// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../core/has ../../../../core/maybe ../../../../chunks/vec4f64 ../../webgl-engine/materials/PatternMaterial ../../webgl-engine/materials/ColorMaterial".split(" "),function(d,m,h,k,l,e){function f(a,b,c){if(h.isSome(a)){if("none"===a.style||"solid"===a.style)return"none"===a.style&&(b.color=k.fromValues(0,0,0,0),b.transparent=!0),new e.ColorMaterial(b,c.idHint+"_colormat");b.style=g(a.style);b.draped=c.isDraped;return new l.PatternMaterial(b,c.idHint+"_patternmat")}return new e.ColorMaterial(b,
c.idHint+"_colormat")}function g(a){switch(a){case "horizontal":return 0;case "vertical":return 1;case "cross":return 2;case "forward-diagonal":return 3;case "backward-diagonal":return 4;case "diagonal-cross":return 5}}d.createMaterial=function(a,b,c){return f(a&&a.pattern||null,b,c)};d.createMaterialFromPattern=f;d.parsePatternStyle=g;Object.defineProperty(d,"__esModule",{value:!0})});