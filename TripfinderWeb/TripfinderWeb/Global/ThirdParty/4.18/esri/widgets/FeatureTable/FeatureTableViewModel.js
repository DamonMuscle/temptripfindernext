// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../../core/Collection ../../intl/locale ../../intl/messages ../../intl ../../Graphic ../../core/Handles ../../core/watchUtils ../../layers/FeatureLayer ../../core/HandleOwner ../../views/support/layerViewUtils ./AttachmentsColumn ./FieldColumn ./Grid/Grid ./Grid/GridViewModel ./support/FeatureStore".split(" "),
function(r,f,e,P,Q,g,R,B,S,T,U,C,D,v,V,w,E,p,F,G,H,I,x,J,K,y){e=function(z){function u(b){var a=z.call(this,b)||this;a._defaultHiddenFields=["CreationDate","Creator","EditDate","Editor","GlobalID"];a._highlights=new E;a.attachmentsEnabled=!1;a.cellClassNameGenerator=(h,l)=>h.path||null;a.dataProvider=async(h,l)=>{const {store:m}=r._assertThisInitialized(a),{page:q,pageSize:t,sortOrders:n}=h;h=a._sortOrdersToLayerOrderByFields(n);l&&(m?(await m.set({orderByFields:h}),"loaded"!==m.state&&"loading"!==
m.state&&await m.load(),l&&l(await m.fetchItems({page:q,pageSize:t}))):l&&l([]))};a.editingEnabled=!1;a.grid=null;a.hiddenFields=new C;a.highlightOnRowSelectEnabled=!0;a.itemIdPath="objectId";a.messagesCommon=null;a.relatedRecordsEnabled=!1;a.store=null;a.view=null;const {hiddenFields:c,itemIdPath:k}=r._assertThisInitialized(a);c.addMany(a._defaultHiddenFields);a._set("store",new y);a._set("grid",new J({itemIdPath:k,viewModel:r._assertThisInitialized(a)}));return a}r._inheritsLoose(u,z);var d=u.prototype;
d.initialize=function(){const b=async()=>{this.messages=await v.fetchMessageBundle("esri/widgets/FeatureTable/t9n/FeatureTable");this.messagesCommon=await v.fetchMessageBundle("esri/t9n/common")};b();this.handles.add([D.onLocaleChange(b),p.on(this,"grid.selectedItems","change",a=>this._onSelectionChange(a)),p.watch(this,"relatedRecordsEnabled",a=>this.store.relatedRecordsEnabled=a),p.watch(this,["layer.loaded"],()=>{var a;null!=(a=this.layer)&&a.loaded&&((a=this.layer.capabilities.query.maxRecordCount)&&
a<this.pageSize&&this.grid.set({pageSize:a}),this._generateColumns())}),p.watch(this,["editingEnabled","messages"],()=>{var a;return(null==(a=this.layer)?void 0:a.loaded)&&this._generateColumns()}),p.watch(this,"layer.definitionExpression",(a,c)=>(a||c)&&"loaded"===this.store.state&&this.refresh()),p.watch(this,"attachmentsEnabled",(a,c)=>{(a||c)&&"loaded"===this.store.state&&(this.store.attachmentsEnabled=!0,this.refresh(),this._generateColumns())})])};d.destroy=function(){this._resetColumns();this.columns.destroy();
this.handles.removeAll();this._highlights.removeAll();this._highlights.destroy();this.view=this.layer=null};d.clearHighlights=function(){this._highlights.removeAll()};d.clearSelection=function(){var b;null==(b=this.grid)?void 0:b.clearSelection()};d.deselectRows=function(b){b=b instanceof Array?b:[b];b.forEach(a=>this._deselectRow(a))};d.getObjectIdIndex=function(b){var a;return null==(a=this.store)?void 0:a.getObjectIdIndex(b)};d.getValue=function(b,a){var c;b=this.store.getItemByObjectId(b);return null==
b?void 0:null==(c=b.feature)?void 0:c.attributes[a]};d.refresh=function(){var b;null==(b=this.grid)?void 0:b.refresh()};d.selectRows=function(b){b=b instanceof Array?b:[b];b.forEach(a=>this._selectRow(a))};d._generateColumns=function(){this._resetColumns();this.columns.addMany([...this._createFieldColumns()]);this.attachmentsEnabled&&this.columns.push(this._createAttachmentsColumn())};d._createFieldColumns=function(){return this.fieldConfigs&&this.fieldConfigs.length?this._createColumnsFromConfigs():
this._createColumnsFromFields()};d._createColumnsFromConfigs=function(){const {editingEnabled:b,fieldConfigs:a,grid:c,hiddenFields:k,layer:h,messages:l,messagesCommon:m,store:q}=this,t=this.get("layer.fields")||[];return a.map(n=>{const L=n.direction||null,M=n.formatFunction||null,A=(t||[]).find(N=>n.name===N.name),O=!1===n.visible||!0!==n.visible&&-1<k.indexOf(A.name);return new x({config:n,direction:L,editingEnabled:b,field:A,formatFunction:M,grid:c,hidden:O,layer:h,store:q,messages:l,messagesCommon:m})})};
d._createColumnsFromFields=function(){const {editingEnabled:b,grid:a,hiddenFields:c,layer:k,messages:h,messagesCommon:l,store:m}=this;return(this.get("layer.fields")||[]).map(q=>{const t=-1<c.indexOf(q.name);return new x({editingEnabled:b,field:q,grid:a,hidden:t,layer:k,store:m,messages:h,messagesCommon:l})})};d._createAttachmentsColumn=function(){var b;return new I({header:null==(b=this.messages)?void 0:b.attachments})};d._sortOrdersToLayerOrderByFields=function(b){return b&&b.length?b.filter((a,
c,k)=>k.map(h=>h.path).indexOf(a.path)===c).map(({direction:a,path:c})=>c+" "+a.toUpperCase()):[]};d._highlight=function(b){var {view:a}=this;a=a&&b&&a.allLayerViews.items.find(({layer:c})=>c===b.layer);H.highlightsSupported(a)&&this._highlights.add(a.highlight(b),`feature-${b.getObjectId()}`)};d._unhighlight=function(b){b&&this._highlights.remove(`feature-${b.getObjectId()}`)};d._selectRow=function(b){const {grid:a}=this,c=b instanceof w?b:null;b=c?c.getObjectId():b;const k=this.getObjectIdIndex(b);
-1===k?null==a?void 0:a.selectItem({objectId:b,feature:c}):null==a?void 0:a.selectRow(k)};d._deselectRow=function(b){const {grid:a}=this;b=b instanceof w?b.getObjectId():b;const c=this.getObjectIdIndex(b);-1===c?null==a?void 0:a.deselectItem({objectId:b}):null==a?void 0:a.deselectRow(c)};d._onSelectionChange=function(b){const {highlightOnRowSelectEnabled:a}=this,{added:c,removed:k}=b;a&&c.forEach(h=>this._highlight(h.feature));a&&k.forEach(h=>this._unhighlight(h.feature))};d._resetColumns=function(){this.columns.items.forEach(b=>
b.destroy());this.columns.removeAll()};r._createClass(u,[{key:"fieldConfigs",set:function(b){var a;this._set("fieldConfigs",b);(null==(a=this.layer)?0:a.loaded)&&this._generateColumns()}},{key:"layer",set:function(b){this._set("layer",b);this._resetColumns();this.store.set({layer:b});b&&b.load();this.notifyChange("state")}},{key:"messages",set:function(b){var a;null==(a=this.grid)?void 0:a.set("messages",b);this._set("messages",b)}}]);return u}(G.HandleOwnerMixin(K));f.__decorate([g.property()],e.prototype,
"attachmentsEnabled",void 0);f.__decorate([g.property()],e.prototype,"cellClassNameGenerator",void 0);f.__decorate([g.property()],e.prototype,"dataProvider",void 0);f.__decorate([g.property()],e.prototype,"editingEnabled",void 0);f.__decorate([g.property({dependsOn:["messages","layer.loaded"]})],e.prototype,"fieldConfigs",null);f.__decorate([g.property({readOnly:!0})],e.prototype,"grid",void 0);f.__decorate([g.property()],e.prototype,"hiddenFields",void 0);f.__decorate([g.property()],e.prototype,
"highlightOnRowSelectEnabled",void 0);f.__decorate([g.property({readOnly:!0})],e.prototype,"itemIdPath",void 0);f.__decorate([g.property({type:F})],e.prototype,"layer",null);f.__decorate([g.property()],e.prototype,"messages",null);f.__decorate([g.property()],e.prototype,"messagesCommon",void 0);f.__decorate([g.property()],e.prototype,"relatedRecordsEnabled",void 0);f.__decorate([g.property({readOnly:!0,type:y})],e.prototype,"store",void 0);f.__decorate([g.property()],e.prototype,"view",void 0);return e=
f.__decorate([B.subclass("esri.widgets.FeatureTable.FeatureTableViewModel")],e)});