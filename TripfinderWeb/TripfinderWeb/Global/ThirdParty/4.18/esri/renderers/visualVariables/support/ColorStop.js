// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/accessorSupport/decorators/writer ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../../../core/JSONSupport ../../../Color".split(" "),function(k,c,b,u,l,d,v,m,n,w,x,y,p,q){var e;
b=e=function(g){function f(a){a=g.call(this,a)||this;a.color=null;a.label=null;a.value=null;return a}k._inheritsLoose(f,g);var h=f.prototype;h.writeValue=function(a,r,t){r[t]=null==a?0:a};h.clone=function(){return new e({color:this.color&&this.color.clone(),label:this.label,value:this.value})};return f}(p.JSONSupport);c.__decorate([d.property({type:q,json:{type:[l.Integer],write:!0}})],b.prototype,"color",void 0);c.__decorate([d.property({type:String,json:{write:!0}})],b.prototype,"label",void 0);
c.__decorate([d.property({type:Number,json:{write:{allowNull:!0}}})],b.prototype,"value",void 0);c.__decorate([n.writer("value")],b.prototype,"writeValue",null);return b=e=c.__decorate([m.subclass("esri.renderers.visualVariables.support.ColorStop")],b)});