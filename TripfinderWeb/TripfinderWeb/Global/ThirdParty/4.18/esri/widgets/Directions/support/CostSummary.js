// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../../../core/Accessor ./directionsUtils".split(" "),function(k,c,b,p,q,e,r,m,t,u,v,n,d){b=function(l){function g(){var a=l.apply(this,arguments)||
this;a.messages=null;a.messagesUnits=null;return a}k._inheritsLoose(g,l);k._createClass(g,[{key:"primary",get:function(){const a=this.get("directionsViewModel.lastRoute.routeResults.0.directions"),f=this.directionsViewModel.impedanceAttribute,h=this.get("directionsViewModel.routeParameters.directionsLengthUnits");return d.isTimeUnits(f.units)?d.formatTime(a.totalTime,{unit:f.units.replace("esriNAU","")}):d.formatDistance(this.messages,this.messagesUnits,a.totalLength,{toUnits:h})}},{key:"secondary",
get:function(){const a=this.get("directionsViewModel.lastRoute.routeResults.0.directions"),f=this.get("directionsViewModel.routeParameters.directionsLengthUnits"),{impedanceAttribute:h}=this.directionsViewModel;return d.isTimeUnits(h.units)?d.formatDistance(this.messages,this.messagesUnits,a.totalLength,{toUnits:f}):d.formatTime(a.totalTime)}}]);return g}(n);c.__decorate([e.property()],b.prototype,"directionsViewModel",void 0);c.__decorate([e.property()],b.prototype,"messages",void 0);c.__decorate([e.property()],
b.prototype,"messagesUnits",void 0);c.__decorate([e.property({dependsOn:["directionsViewModel.lastRoute"],readOnly:!0})],b.prototype,"primary",null);c.__decorate([e.property({dependsOn:["directionsViewModel.lastRoute"],readOnly:!0})],b.prototype,"secondary",null);return b=c.__decorate([m.subclass("esri.widgets.Directions.support.CostSummary")],b)});