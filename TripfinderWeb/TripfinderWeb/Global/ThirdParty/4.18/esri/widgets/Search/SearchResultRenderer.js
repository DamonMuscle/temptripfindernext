// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../support/widgetUtils ../support/decorators/accessibleHandler ../support/decorators/messageBundle ../support/decorators/renderable ../../chunks/index ../Widget ./SearchViewModel".split(" "),
function(t,g,f,B,C,k,D,u,E,F,G,H,q,v,l,c,w,x){f=function(r){function m(a,b){a=r.call(this,a,b)||this;a.messages=null;a.showMoreResultsOpen=!1;a.viewModel=null;return a}t._inheritsLoose(m,r);var d=m.prototype;d.render=function(){return c.jsx("div",{class:"esri-search-result-renderer esri-widget"},c.jsx("div",{key:"esri-search-renderer__container",class:this.classes("esri-search-result-renderer__more-results",{["esri-search-result-renderer__more-results--show-more-results"]:this.showMoreResultsOpen})},
this.renderSearchResultName(),this.renderMoreResults()))};d.renderMoreResults=function(){return c.jsx("div",{key:"esri-search-renderer__more-results"},this.renderMoreResultsButton(),this.renderMoreResultsLists())};d.renderSearchResultName=function(){var a;const b=null==(a=this.viewModel)?void 0:a.selectedResult;return c.jsx("div",{key:"esri-search-renderer__result-name",class:"esri-search-result-renderer__more-results-item"},b&&b.name||"")};d.renderMoreResultsLists=function(){var a,b=null==(a=this.viewModel)?
void 0:a.results;({resultCount:a}=this.viewModel);if(2>a)return null;b=b.map(e=>this.renderMoreResultsList(e));return c.jsx("div",{key:"esri-search-renderer__more-results-container",class:"esri-search-result-renderer__more-results-list"},b)};d.renderMoreResultsButton=function(){const {messages:a}=this,{resultCount:b}=this.viewModel;return 2>b?null:c.jsx("div",{key:"esri-search-renderer__more-results-button",class:"esri-search-result-renderer__more-results-item"},c.jsx("a",{class:"esri-widget__anchor",
href:"#",bind:this,onclick:this._showMoreResultsClick,onkeydown:this._showMoreResultsClick},this.showMoreResultsOpen?a.hideMoreResults:a.showMoreResults))};d.renderMoreResultsHeader=function(a,b){return c.jsx("div",{key:`esri-search-result-renderer__header-${b}`,class:"esri-search-result-renderer__more-results-list-header"},a)};d.renderMoreResultsList=function(a){var b,e;const {results:n}=a;var h=n.length;const p=!!h,y=null==(b=this.viewModel)?void 0:b.selectedResult;b=1===h&&n[0]===y;h=this._getSourceName(a.source,
a.sourceIndex);h=1<(null==(e=this.viewModel)?void 0:e.results.length)&&!b?this.renderMoreResultsHeader(h,a.sourceIndex):null;e=p&&n.map((z,A)=>this.renderMoreResultsListItem(z,A));e=p&&!b?c.jsx("ul",{key:`esri-search-result-renderer__list-${a.sourceIndex}`},e):null;return p?c.jsx("div",{key:`esri-search-result-renderer__results-${a.sourceIndex}`},h,e):null};d.renderMoreResultsListItem=function(a,b){const e=this.get("viewModel.selectedResult");return a!==e?c.jsx("li",{key:`esri-search-result-renderer__list-item-${b}`},
c.jsx("a",{class:"esri-widget__anchor",href:"#",tabindex:"0",bind:this,"data-result":a,onclick:this._selectResultClick,onkeydown:this._selectResultClick},a.name)):null};d._showMoreResultsClick=function(a){a.preventDefault();this.showMoreResultsOpen=!this.showMoreResultsOpen;(a=this.get("viewModel.view.popup"))&&a.reposition()};d._selectResultClick=function(a){a.preventDefault();a=a.currentTarget["data-result"];this.viewModel&&this.viewModel.select(a)};d._getSourceName=function(a,b){return b===x.ALL_INDEX?
this.messages.all:a.name};return m}(w);g.__decorate([k.property(),l.renderable(),v.messageBundle("esri/widgets/Search/t9n/Search")],f.prototype,"messages",void 0);g.__decorate([l.renderable(),k.property()],f.prototype,"showMoreResultsOpen",void 0);g.__decorate([k.property(),l.renderable(["viewModel.results","viewModel.selectedResult","viewModel.resultCount"])],f.prototype,"viewModel",void 0);g.__decorate([q.accessibleHandler()],f.prototype,"_showMoreResultsClick",null);g.__decorate([q.accessibleHandler()],
f.prototype,"_selectResultClick",null);return f=g.__decorate([u.subclass("esri.widgets.Search.SearchResultRenderer")],f)});