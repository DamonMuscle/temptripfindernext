// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","../has","../urlUtils","../../assets"],function(c,m,d,e){c.DEFAULT_LOADER_URL=null;c.DEFAULT_LOADER_URL=d.makeAbsolute(e.getAssetUrl("esri/core/workers/init.js"));var k=d.makeAbsolute(e.getAssetUrl("dojo/"));var f=[{name:"esri",location:"../esri"}];c.default=function(a){const b={async:a.async,isDebug:a.isDebug,locale:a.locale,baseUrl:a.baseUrl,has:{...a.has},map:{...a.map},packages:a.packages&&a.packages.concat()||[],paths:{...a.paths}};a.hasOwnProperty("async")||(b.async=!0);a.hasOwnProperty("isDebug")||
(b.isDebug=!1);a.baseUrl||(b.baseUrl=k);null==f?void 0:f.forEach(g=>{a:{var h=b.packages;for(const l of h)if(l.name===g.name)break a;h.push(g)}});return b};Object.defineProperty(c,"__esModule",{value:!0})});