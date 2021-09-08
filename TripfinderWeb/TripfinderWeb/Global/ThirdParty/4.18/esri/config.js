// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["module","./core/global","./core/has","./core/object"],function(b,c,a,d){a={apiKey:void 0,applicationUrl:c.location&&c.location.href,assetsPath:"",fontsUrl:"https://static.arcgis.com/fonts",geometryService:null,geometryServiceUrl:"https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer",geoRSSServiceUrl:"https://utility.arcgis.com/sharing/rss",kmlServiceUrl:"https://utility.arcgis.com/sharing/kml",portalUrl:"https://www.arcgis.com",workers:{loaderConfig:{has:{},paths:{},
map:{},packages:[]}},request:{httpsDomains:"arcgis.com arcgisonline.com esrikr.com premiumservices.blackbridge.com esripremium.accuweather.com gbm.digitalglobe.com firstlook.digitalglobe.com msi.digitalglobe.com".split(" "),interceptors:[],maxUrlLength:2E3,proxyRules:[],proxyUrl:null,timeout:6E4,trustedServers:[],useIdentity:!0},log:{interceptors:[],level:null}};c.esriConfig&&(d.deepMerge(a,c.esriConfig,!0),delete a.has);a.assetsPath||(b=(new URL(b.uri,document.baseURI)).href,a.assetsPath=b.slice(0,
b.indexOf("esri/")));a.baseUrl&&console.warn("[esri.config]","baseUrl has been replaced by assetsPath");Object.defineProperty(a,"baseUrl",{set(){console.warn("[esri.config]","baseUrl has been replaced by assetsPath")}});a.request.corsEnabledServers=[];a.request.corsEnabledServers.push=function(){console.warn("[esri.config]","request.corsEnabledServers is not supported and will be removed in a future release. See http://esriurl.com/cors8664");return 0};return a});