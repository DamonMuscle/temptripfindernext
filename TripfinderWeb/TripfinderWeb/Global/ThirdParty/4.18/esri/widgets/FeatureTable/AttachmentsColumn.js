// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ./Grid/Column".split(" "),function(k,c,a,p,q,d,r,l,t,u,v,m){a=function(h){function f(e){var b=h.call(this,e)||this;b.header="";b.path="EsriFeatureTableAttachmentsColumn";b.renderFunction=
({root:n,rowData:g})=>{g=b._countFromItem(g.item).toString();n.innerHTML=`<div class="${"esri-feature-table__column--attachments"}">${g}</div>`};b.sortable=!1;b.textAlign="center";return b}k._inheritsLoose(f,h);f.prototype._countFromItem=function(e){return e.attachments&&e.attachments.length||0};return f}(m);c.__decorate([d.property({constructOnly:!0})],a.prototype,"header",void 0);c.__decorate([d.property({readOnly:!0})],a.prototype,"path",void 0);c.__decorate([d.property()],a.prototype,"renderFunction",
void 0);c.__decorate([d.property({readOnly:!0})],a.prototype,"sortable",void 0);c.__decorate([d.property({readOnly:!0})],a.prototype,"textAlign",void 0);return a=c.__decorate([l.subclass("esri.widgets.FeatureTable.AttachmentsColumn")],a)});