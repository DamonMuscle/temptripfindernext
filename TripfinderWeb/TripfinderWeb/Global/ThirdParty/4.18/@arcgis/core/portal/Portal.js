/*
All material copyright ESRI, All Rights Reserved, unless otherwise specified.
See https://js.arcgis.com/4.18/esri/copyright.txt for details.
*/
import{_ as t}from"../chunks/tslib.es6.js";import"../chunks/ArrayPool.js";import"../chunks/object.js";import"../chunks/deprecate.js";import{mixin as e}from"../core/lang.js";import r from"../config.js";import{i as o}from"../chunks/Logger.js";import"../chunks/string.js";import"../chunks/metadata.js";import{property as s}from"../core/accessorSupport/decorators/property.js";import"../core/Accessor.js";import"../chunks/PropertyOrigin.js";import"../core/scheduling.js";import{throwIfAborted as i,resolve as a,isAborted as n,reject as l,createAbortError as u,all as p,throwIfAbortError as h}from"../core/promiseUtils.js";import"../chunks/Message.js";import d from"../core/Error.js";import{e as c}from"../chunks/ensureType.js";import{subclass as y}from"../core/accessorSupport/decorators/subclass.js";import{J as m}from"../chunks/JSONSupport.js";import"../chunks/Promise.js";import{L as f}from"../chunks/Loadable.js";import"../core/urlUtils.js";import"../core/accessorSupport/decorators/cast.js";import"../chunks/jsonMap.js";import{r as v}from"../chunks/reader.js";import"../chunks/writer.js";import"../chunks/resourceExtension.js";import"../geometry/SpatialReference.js";import{g as S}from"../chunks/locale.js";import"../chunks/number.js";import"../intl.js";import{id as g}from"../kernel.js";import P from"../request.js";import"../chunks/assets.js";import"../geometry/Geometry.js";import"../geometry/Point.js";import"../chunks/Ellipsoid.js";import"../geometry/support/webMercatorUtils.js";import j from"../geometry/Extent.js";import _ from"./PortalQueryParams.js";import O from"./PortalQueryResult.js";import"./PortalFolder.js";import"./PortalGroup.js";import U from"./PortalUser.js";var w;let G;const k={PortalGroup:()=>import("./PortalGroup.js"),PortalItem:()=>import("./PortalItem.js"),PortalUser:()=>import("./PortalUser.js")};let b=w=class extends(m(f)){constructor(t){super(t),this.access=null,this.allSSL=!1,this.authMode="auto",this.authorizedCrossOriginDomains=null,this.basemapGalleryGroupQuery=null,this.bingKey=null,this.canListApps=!1,this.canListData=!1,this.canListPreProvisionedItems=!1,this.canProvisionDirectPurchase=!1,this.canSearchPublic=!0,this.canShareBingPublic=!1,this.canSharePublic=!1,this.canSignInArcGIS=!1,this.canSignInIDP=!1,this.colorSetsGroupQuery=null,this.commentsEnabled=!1,this.created=null,this.culture=null,this.customBaseUrl=null,this.defaultBasemap=null,this.defaultExtent=null,this.defaultVectorBasemap=null,this.description=null,this.eueiEnabled=null,this.featuredGroups=null,this.featuredItemsGroupQuery=null,this.galleryTemplatesGroupQuery=null,this.livingAtlasGroupQuery=null,this.hasCategorySchema=!1,this.helperServices=null,this.homePageFeaturedContent=null,this.homePageFeaturedContentCount=null,this.httpPort=null,this.httpsPort=null,this.id=null,this.ipCntryCode=null,this.isPortal=!1,this.isReadOnly=!1,this.layerTemplatesGroupQuery=null,this.maxTokenExpirationMinutes=null,this.modified=null,this.name=null,this.portalHostname=null,this.portalMode=null,this.portalProperties=null,this.region=null,this.rotatorPanels=null,this.showHomePageDescription=!1,this.sourceJSON=null,this.supportsHostedServices=!1,this.symbolSetsGroupQuery=null,this.templatesGroupQuery=null,this.units=null,this.url=r.portalUrl,this.urlKey=null,this.user=null,this.useStandardizedQuery=!1,this.useVectorBasemaps=!1,this.vectorBasemapGalleryGroupQuery=null}normalizeCtorArgs(t){return"string"==typeof t?{url:t}:t}destroy(){this._esriId_credentialCreateHandle&&(this._esriId_credentialCreateHandle.remove(),this._esriId_credentialCreateHandle=null)}readAuthorizedCrossOriginDomains(t){if(t)for(const e of t)-1===r.request.trustedServers.indexOf(e)&&r.request.trustedServers.push(e);return t}readDefaultBasemap(t){if(t){const e=G.fromJSON(t);return e.portalItem={portal:this},e}return null}readDefaultVectorBasemap(t){if(t){const e=G.fromJSON(t);return e.portalItem={portal:this},e}return null}get extraQuery(){const t=!(this.user&&this.user.orgId)||this.canSearchPublic;return this.id&&!t?` AND orgid:${this.id}`:null}get isOrganization(){return!!this.access}get restUrl(){let t=this.url;if(t){const e=t.indexOf("/sharing");t=e>0?t.substring(0,e):this.url.replace(/\/+$/,""),t+="/sharing/rest"}return t}get thumbnailUrl(){const t=this.restUrl,e=this.thumbnail;return t&&e?this._normalizeSSL(t+"/portals/self/resources/"+e):null}readUrlKey(t){return t?t.toLowerCase():t}readUser(t){let e=null;return t&&(e=U.fromJSON(t),e.portal=this),e}load(t){const e=import("../Basemap.js").then((function(t){return t.B})).then((({default:e})=>{i(t),G=e})).then((()=>this.sourceJSON?this.sourceJSON:this._fetchSelf(this.authMode,!1,t))).then((t=>{if(g){const t=g;this.credential=t.findCredential(this.restUrl),this.credential||this.authMode!==w.AUTH_MODE_AUTO||(this._esriId_credentialCreateHandle=t.on("credential-create",(()=>{t.findCredential(this.restUrl)&&this._signIn()})))}this.sourceJSON=t,this.read(t)}));return this.addResolvingPromise(e),a(this)}async createClosestFacilityTask(){await this.load();const t=this._getHelperServiceUrl("closestFacility");return new(0,(await import("../tasks/ClosestFacilityTask.js")).default)(t)}async createElevationLayers(){await this.load();const t=this._getHelperService("defaultElevationLayers"),e=(await import("../layers/ElevationLayer.js").then((function(t){return t.E}))).default;return t?t.map((t=>new e({id:t.id,url:t.url}))):[]}async createGeometryService(){await this.load();const t=this._getHelperServiceUrl("geometry");return new(0,(await import("../tasks/GeometryService.js")).default)({url:t})}async createPrintTask(){await this.load();const t=this._getHelperServiceUrl("printTask");return new(0,(await import("../tasks/PrintTask.js")).default)(t)}async createRouteTask(){await this.load();const t=this._getHelperServiceUrl("route");return new(0,(await import("../tasks/RouteTask.js")).default)(t)}async createServiceAreaTask(){await this.load();const t=this._getHelperServiceUrl("serviceArea");return new(0,(await import("../tasks/ServiceAreaTask.js")).default)(t)}fetchBasemaps(t,e){const r=new _;return r.query=t||(this.useVectorBasemaps?this.vectorBasemapGalleryGroupQuery:this.basemapGalleryGroupQuery),r.disableExtraQuery=!0,this.queryGroups(r,e).then((t=>{if(r.num=100,r.query='type:"Web Map" -type:"Web Application"',t.total){const o=t.results[0];return r.sortField=o.sortField||"name",r.sortOrder=o.sortOrder||"desc",o.queryItems(r,e)}return null})).then((t=>{let e;return e=t&&t.total?t.results.filter((t=>"Web Map"===t.type)).map((t=>new G({portalItem:t}))):[],e}))}fetchCategorySchema(t){return this.hasCategorySchema?this._request(this.restUrl+"/portals/self/categorySchema",t).then((t=>t.categorySchema)):n(t)?l(u()):a([])}fetchFeaturedGroups(t){const e=this.featuredGroups,r=new _;if(r.num=100,r.sortField="title",e&&e.length){const o=[];for(const t of e)o.push(`(title:"${t.title}" AND owner:${t.owner})`);return r.query=o.join(" OR "),this.queryGroups(r,t).then((t=>t.results))}return n(t)?l(u()):a([])}fetchRegions(t){const e=this.user&&this.user.culture||this.culture||S();return this._request(this.restUrl+"/portals/regions",{...t,query:{culture:e}})}static getDefault(){return w._default&&!w._default.destroyed||(w._default=new w),w._default}queryGroups(t,e){return this._queryPortal("/community/groups",t,"PortalGroup",e)}queryItems(t,e){return this._queryPortal("/search",t,"PortalItem",e)}queryUsers(t,e){return t.sortField||(t.sortField="username"),this._queryPortal("/community/users",t,"PortalUser",e)}toJSON(){throw new d("internal:not-yet-implemented","Portal.toJSON is not yet implemented")}static fromJSON(t){if(!t)return null;if(t.declaredClass)throw new Error("JSON object is already hydrated");return new w({sourceJSON:t})}_getHelperService(t){const e=this.helperServices&&this.helperServices[t];if(!e)throw new d("portal:service-not-found",`The \`helperServices\` do not include an entry named "${t}"`);return e}_getHelperServiceUrl(t){const e=this._getHelperService(t);if(!e.url)throw new d("portal:service-url-not-found",`The \`helperServices\` entry "${t}" does not include a \`url\` value`);return e.url}_fetchSelf(t=this.authMode,e=!1,r){const o=this.restUrl+"/portals/self",s={authMode:t,query:{culture:S().toLowerCase()},...r};return"auto"===s.authMode&&(s.authMode="no-prompt"),e&&(s.query.default=!0),this._request(o,s)}_queryPortal(t,e,r,o){const s=c(_,e),a=e=>this._request(this.restUrl+t,{...s.toRequestOptions(this),...o}).then((t=>{const r=s.clone();return r.start=t.nextStart,new O({nextQueryParams:r,queryParams:s,total:t.total,results:w._resultsToTypedArray(e,{portal:this},t,o)})})).then((t=>p(t.results.map((e=>"function"==typeof e.when?e.when():t))).then((()=>t),(e=>(h(e),t)))));return r&&k[r]?k[r]().then((({default:t})=>(i(o),a(t)))):a()}_signIn(){if(this.authMode===w.AUTH_MODE_ANONYMOUS)return l(new d("portal:invalid-auth-mode",`Current "authMode"' is "${this.authMode}"`));if("failed"===this.loadStatus)return l(this.loadError);const t=t=>a().then((()=>"not-loaded"===this.loadStatus?(t||(this.authMode="immediate"),this.load().then((()=>null))):"loading"===this.loadStatus?this.load().then((()=>this.credential?null:(this.credential=t,this._fetchSelf("immediate")))):this.user&&this.credential===t?null:(this.credential=t,this._fetchSelf("immediate")))).then((t=>{t&&(this.sourceJSON=t,this.read(t))}));return g?g.getCredential(this.restUrl).then((e=>t(e))):t(this.credential)}_normalizeSSL(t){return t.replace(/^http:/i,"https:").replace(":7080",":7443")}_normalizeUrl(t){const e=this.credential&&this.credential.token;return this._normalizeSSL(e?t+(t.indexOf("?")>-1?"&":"?")+"token="+e:t)}_requestToTypedArray(t,e,r){return this._request(t,e).then((t=>{const e=w._resultsToTypedArray(r,{portal:this},t);return p(e.map((e=>"function"==typeof e.when?e.when():t))).then((()=>e),(()=>e))}))}_request(t,e={}){const r={f:"json",...e.query},{authMode:o=(this.authMode===w.AUTH_MODE_ANONYMOUS?"anonymous":"auto"),body:s=null,cacheBust:i=!1,method:a="auto",responseType:n="json",signal:l}=e,u={authMode:o,body:s,cacheBust:i,method:a,query:r,responseType:n,timeout:0,signal:l};return P(this._normalizeSSL(t),u).then((t=>t.data))}static _resultsToTypedArray(t,r,s,i){let a;if(s){const n=o(i)?i.signal:null;a=s.listings||s.notifications||s.userInvitations||s.tags||s.items||s.groups||s.comments||s.provisions||s.results||s.relatedItems||s,(t||r)&&(a=a.map((o=>{const s=e(t?t.fromJSON(o):o,r);return"function"==typeof s.load&&s.load(n),s})))}else a=[];return a}};b.AUTH_MODE_ANONYMOUS="anonymous",b.AUTH_MODE_AUTO="auto",b.AUTH_MODE_IMMEDIATE="immediate",t([s()],b.prototype,"access",void 0),t([s()],b.prototype,"allSSL",void 0),t([s()],b.prototype,"authMode",void 0),t([s()],b.prototype,"authorizedCrossOriginDomains",void 0),t([v("authorizedCrossOriginDomains")],b.prototype,"readAuthorizedCrossOriginDomains",null),t([s()],b.prototype,"basemapGalleryGroupQuery",void 0),t([s()],b.prototype,"bingKey",void 0),t([s()],b.prototype,"canListApps",void 0),t([s()],b.prototype,"canListData",void 0),t([s()],b.prototype,"canListPreProvisionedItems",void 0),t([s()],b.prototype,"canProvisionDirectPurchase",void 0),t([s()],b.prototype,"canSearchPublic",void 0),t([s()],b.prototype,"canShareBingPublic",void 0),t([s()],b.prototype,"canSharePublic",void 0),t([s()],b.prototype,"canSignInArcGIS",void 0),t([s()],b.prototype,"canSignInIDP",void 0),t([s()],b.prototype,"colorSetsGroupQuery",void 0),t([s()],b.prototype,"commentsEnabled",void 0),t([s({type:Date})],b.prototype,"created",void 0),t([s()],b.prototype,"credential",void 0),t([s()],b.prototype,"culture",void 0),t([s()],b.prototype,"currentVersion",void 0),t([s()],b.prototype,"customBaseUrl",void 0),t([s()],b.prototype,"defaultBasemap",void 0),t([v("defaultBasemap")],b.prototype,"readDefaultBasemap",null),t([s({type:j})],b.prototype,"defaultExtent",void 0),t([s()],b.prototype,"defaultVectorBasemap",void 0),t([v("defaultVectorBasemap")],b.prototype,"readDefaultVectorBasemap",null),t([s()],b.prototype,"description",void 0),t([s()],b.prototype,"eueiEnabled",void 0),t([s({dependsOn:["user","id","canSearchPublic"],readOnly:!0})],b.prototype,"extraQuery",null),t([s()],b.prototype,"featuredGroups",void 0),t([s()],b.prototype,"featuredItemsGroupQuery",void 0),t([s()],b.prototype,"galleryTemplatesGroupQuery",void 0),t([s()],b.prototype,"livingAtlasGroupQuery",void 0),t([s()],b.prototype,"hasCategorySchema",void 0),t([s()],b.prototype,"helpBase",void 0),t([s()],b.prototype,"helperServices",void 0),t([s()],b.prototype,"helpMap",void 0),t([s()],b.prototype,"homePageFeaturedContent",void 0),t([s()],b.prototype,"homePageFeaturedContentCount",void 0),t([s()],b.prototype,"httpPort",void 0),t([s()],b.prototype,"httpsPort",void 0),t([s()],b.prototype,"id",void 0),t([s()],b.prototype,"ipCntryCode",void 0),t([s({dependsOn:["access"],readOnly:!0})],b.prototype,"isOrganization",null),t([s()],b.prototype,"isPortal",void 0),t([s()],b.prototype,"isReadOnly",void 0),t([s()],b.prototype,"layerTemplatesGroupQuery",void 0),t([s()],b.prototype,"maxTokenExpirationMinutes",void 0),t([s({type:Date})],b.prototype,"modified",void 0),t([s()],b.prototype,"name",void 0),t([s()],b.prototype,"portalHostname",void 0),t([s()],b.prototype,"portalMode",void 0),t([s()],b.prototype,"portalProperties",void 0),t([s()],b.prototype,"region",void 0),t([s({dependsOn:["url"],readOnly:!0})],b.prototype,"restUrl",null),t([s()],b.prototype,"rotatorPanels",void 0),t([s()],b.prototype,"showHomePageDescription",void 0),t([s()],b.prototype,"sourceJSON",void 0),t([s()],b.prototype,"staticImagesUrl",void 0),t([s()],b.prototype,"stylesGroupQuery",void 0),t([s()],b.prototype,"supportsHostedServices",void 0),t([s()],b.prototype,"symbolSetsGroupQuery",void 0),t([s()],b.prototype,"templatesGroupQuery",void 0),t([s()],b.prototype,"thumbnail",void 0),t([s({dependsOn:["restUrl","thumbnail"],readOnly:!0})],b.prototype,"thumbnailUrl",null),t([s()],b.prototype,"units",void 0),t([s()],b.prototype,"url",void 0),t([s()],b.prototype,"urlKey",void 0),t([v("urlKey")],b.prototype,"readUrlKey",null),t([s()],b.prototype,"user",void 0),t([v("user")],b.prototype,"readUser",null),t([s()],b.prototype,"useStandardizedQuery",void 0),t([s()],b.prototype,"useVectorBasemaps",void 0),t([s()],b.prototype,"vectorBasemapGalleryGroupQuery",void 0),b=w=t([y("esri.portal.Portal")],b);var T=b;export default T;
