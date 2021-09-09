// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../chunks/_rollupPluginBabelHelpers ../chunks/tslib.es6 ../core/has ../core/Logger ../core/accessorSupport/decorators/property ../core/accessorSupport/decorators/aliasOf ../core/accessorSupport/decorators/cast ../core/deprecate ../core/jsonMap ../core/accessorSupport/decorators/subclass ../core/urlUtils ../core/uuid ../portal/support/resourceExtension ../core/events ../core/Collection ../core/watchUtils ../core/HandleOwner ./support/widgetUtils ./support/decorators/accessibleHandler ./support/decorators/messageBundle ./support/decorators/renderable ./support/decorators/vmEvent ../chunks/index ./Widget ../chunks/sortable.esm ./LayerList/support/layerListUtils ./LayerList/ListItem ./BasemapLayerList/BasemapLayerListViewModel".split(" "),
function(I,l,P,k,t,y,Q,R,ba,S,ca,da,ea,T,U,w,V,fa,z,J,r,W,g,X,K,G,Y,L){function H(B){const {actionsOpen:A,children:e}=B;A&&(B.actionsOpen=!1);e.forEach(a=>H(a))}const Z=U.ofType(Y),C={exclusive:"exclusive",inherited:"inherited",independent:"independent"},aa=k.getLogger("esri.widgets.BasemapLayerList"),M={baseLayers:!0,referenceLayers:!0,statusIndicators:!0};k=function(B){function A(a,b){a=B.call(this,a,b)||this;a._editingTitle=!1;a._editTitleInput=null;a._editTitleButton=null;a._focusOnElement=null;
a._sortableBaseLayers=null;a._sortableReferenceLayers=null;a._sortableBaseLayersNode=null;a._sortableReferenceLayersNode=null;a._focusSortUid=null;a._newUI=P("esri-basemaplayerlist-new-ui");a.basemapTitle=null;a.baseListItemCreatedFunction=null;a.editingEnabled=!1;a.iconClass="esri-icon-layers";a.label=void 0;a.messages=null;a.messagesCommon=null;a.multipleSelectionEnabled=!1;a.referenceListItemCreatedFunction=null;a.baseItems=null;a.referenceItems=null;a.selectedItems=new Z;a.view=null;a.viewModel=
new L;a.visibleElements={...M};return a}I._inheritsLoose(A,B);var e=A.prototype;e.initialize=function(){const {baseItems:a,referenceItems:b}=this;this.own([w.on(this,"baseItems","change",()=>{this._itemsChanged(a,"base-items");this._toggleSortingBaseLayers()}),w.on(this,"referenceItems","change",()=>this._itemsChanged(b,"reference-items")),w.init(this,"editingEnabled",()=>this._toggleSorting())])};e.destroy=function(){this._destroyBaseSortable();this._destroyReferenceSortable()};e.castVisibleElements=
function(a){return{...M,...a}};e.triggerAction=function(a,b){this.viewModel.triggerAction(a,b)};e.render=function(){var {state:a}=this.viewModel;a={["esri-basemap-layer-list--new-ui"]:this._newUI,["esri-hidden"]:"loading"===a,["esri-disabled"]:"disabled"===a};const b=this.renderReferenceSection(),c=this.renderBaseSection(),d=b&&c?g.jsx("hr",{class:"esri-basemap-layer-list__hr"}):null;return g.jsx("div",{class:this.classes("esri-basemap-layer-list esri-widget esri-widget--panel",a)},this.renderTitleContainer(),
b,d,c)};e.renderEditingInput=function(){const {messages:a}=this,{basemapTitle:b}=this.viewModel;return g.jsx("label",{class:"esri-basemap-layer-list__editing-input"},a.basemapTitle,g.jsx("input",{bind:this,class:"esri-input",title:a.basemapTitle,"aria-label":a.basemapTitle,placeholder:a.basemapTitle,type:"text",role:"textbox",value:b,afterCreate:this._storeEditTitleInput,afterUpdate:this._focusEditElement}))};e.renderCancelButton=function(){const {messagesCommon:a}=this;return g.jsx("button",{title:a.cancel,
"aria-label":a.cancel,type:"button",bind:this,class:this.classes("esri-button","esri-button--tertiary"),onclick:this._toggleEditingTitle},a.cancel)};e.renderSubmitButton=function(){const {messagesCommon:a}=this;return g.jsx("button",{title:a.form.submit,"aria-label":a.form.submit,type:"button",bind:this,class:"esri-button",onclick:this._formSubmit},a.form.ok)};e.renderEditingForm=function(){return g.jsx("div",{class:"esri-basemap-layer-list__editing-card"},g.jsx("form",{bind:this,onsubmit:this._formSubmit},
this.renderEditingInput(),g.jsx("div",{class:"esri-basemap-layer-list__editing-actions"},this.renderCancelButton(),this.renderSubmitButton())))};e.renderBasemapTitle=function(){const {basemapTitle:a}=this.viewModel;return g.jsx("h2",{class:this.classes("esri-widget__heading","esri-basemap-layer-list__main-heading")},a)};e.renderEditTitleButton=function(){const {_editingTitle:a,editingEnabled:b,messagesCommon:c}=this;return b&&!a?g.jsx("button",{bind:this,class:"esri-basemap-layer-list__edit-button",
title:c.edit,"aria-label":c.edit,onclick:this._toggleEditingTitle,afterCreate:this._storeEditTitleButton,afterUpdate:this._focusEditElement,"data-node-ref":"_editButtonNode"},g.jsx("span",{"aria-hidden":"true",class:this.classes("esri-icon-edit","esri-basemap-layer-list__edit-button-icon")})):null};e.renderTitleContainer=function(){return g.jsx("div",{class:"esri-basemap-layer-list__title-container"},this._editingTitle?this.renderEditingForm():this.renderBasemapTitle(),this.renderEditTitleButton())};
e.renderNoLayersInfo=function(a,b){return g.jsx("div",{key:b,class:"esri-basemap-layer-list__no-items"},a)};e.renderList=function(a,b){const {messages:c}=this;return g.jsx("ul",{key:b,"aria-label":c.widgetLabel,role:this.editingEnabled&&a.length?"listbox":void 0,afterCreate:this._sortNodeCreated,afterRemoved:"reference"===b?this._destroyReferenceSortable:this._destroyBaseSortable,"data-node-ref":b,bind:this,class:this.classes("esri-basemap-layer-list__list","esri-basemap-layer-list__list--root","esri-basemap-layer-list__list--independent")},
a.map(d=>this.renderItem({item:d,parent:null,itemType:b,isOnlyChild:1===a.length})))};e.renderBaseHeader=function(){return g.jsx("h3",{key:"base-heading",class:this.classes("esri-widget__heading","esri-basemap-layer-list__list-heading")},this.messages.baseHeading)};e.renderBaseSection=function(){const {baseItems:a,messages:b,visibleElements:c}=this;if(!c.baseLayers)return null;const d=this._getItems(a);return[this.renderBaseHeader(),[0===d.length?this.renderNoLayersInfo(b.noBaseLayers,"base"):null,
this.renderList(d,"base")]]};e.renderReferenceHeader=function(){return g.jsx("h3",{key:"reference-heading",class:this.classes("esri-widget__heading","esri-basemap-layer-list__list-heading")},this.messages.referenceHeading)};e.renderReferenceSection=function(){const {referenceItems:a,messages:b,visibleElements:c}=this;if(!c.referenceLayers)return null;const d=this._getItems(a);return[this.renderReferenceHeader(),[0===d.length?this.renderNoLayersInfo(b.noReferenceLayers,"reference"):null,this.renderList(d,
"reference")]]};e.renderChildrenToggle=function(a,b){var {messagesCommon:c}=this;const {children:d}=a,f=!!a.error,h={["esri-basemap-layer-list__child-toggle--open"]:a.open};c=a.open?c.collapse:c.expand;return d.length&&!f?g.jsx("span",{onclick:this._toggleChildrenClick,onkeydown:this._toggleChildrenClick,"data-item":a,key:"toggle-children",class:this.classes("esri-basemap-layer-list__child-toggle",h),tabindex:"0",role:"button","aria-controls":b,"aria-label":c,title:c},g.jsx("span",{"aria-hidden":"true",
class:this.classes("esri-basemap-layer-list__child-toggle-icon--closed","esri-icon-right-triangle-arrow")}),g.jsx("span",{"aria-hidden":"true",class:this.classes("esri-basemap-layer-list__child-toggle-icon--opened","esri-icon-down-arrow")}),g.jsx("span",{"aria-hidden":"true",class:this.classes("esri-basemap-layer-list__child-toggle-icon--closed-rtl","esri-icon-left-triangle-arrow")})):null};e.renderError=function(a){return a.error?g.jsx("div",{key:"error",class:"esri-basemap-layer-list__item-error-message",
role:"alert"},g.jsx("span",null,this.messages.layerError)):null};e.renderActionsMenuIcon=function(a,b){var {messagesCommon:c}=this;c=a.actionsOpen?c.close:c.open;return g.jsx("div",{key:"actions-menu-toggle","data-item":a,bind:this,onclick:this._toggleActionsOpen,onkeydown:this._toggleActionsOpen,class:this.classes("esri-basemap-layer-list__item-actions-menu-item",{["esri-basemap-layer-list__item-actions-menu-item--active"]:a.actionsOpen}),tabindex:"0",role:"button","aria-controls":b,"aria-label":c,
title:c},g.jsx("span",{"aria-hidden":"true",class:"esri-icon-handle-horizontal"}))};e.renderActionsMenu=function(a,b,c,d){var {panel:f}=a;f=f&&f.visible?this.renderPanelButton(f):null;const h=(b=1===c&&this._getSingleActionButton(b))?this.renderAction({item:a,action:b,singleAction:!0}):null;return(a=!b&&c?this.renderActionsMenuIcon(a,d):null)||f||b?g.jsx("div",{key:"actions-menu",class:"esri-basemap-layer-list__item-actions-menu"},f,h,a):null};e.renderChildList=function(a,b){const {editingEnabled:c}=
this,{visibilityMode:d,children:f}=a;var h=!!a.error;h=!!f.length&&!h;const {exclusive:m,inherited:n}=C,p={["esri-basemap-layer-list__list--exclusive"]:d===m,["esri-basemap-layer-list__list--inherited"]:d===n,["esri-basemap-layer-list__list--independent"]:d!==n&&d!==m};return h?g.jsx("ul",{bind:this,key:"list-items",id:b,"data-group":a.uid,"data-item":a,afterCreate:this._sortNodeCreated,afterUpdate:this._sortNodeCreated,class:this.classes("esri-basemap-layer-list__list",p),"aria-expanded":a.open?
"true":"false",role:c?"listbox":d===m?"radiogroup":"group",hidden:a.open?null:!0},null==f?void 0:f.map(q=>this.renderItem({item:q,parent:a})).toArray()):null};e.renderItemContent=function(a,b,c){var {id:d}=this,f=`${d}_${a.uid}`;d=`${f}_actions`;f=`${f}__list`;const {panel:h}=a,m=this._filterActions(a.actionsSections),n=this._countActions(m);return[g.jsx("div",{key:"list-item-container",class:"esri-basemap-layer-list__item-container"},this.renderChildrenToggle(a,f),this.renderLabel(a,b,c),this.renderActionsMenu(a,
m,n,d)),this.renderError(a),n?this.renderActionsSections(a,m,d):null,h&&h.open?h.render():null,this.renderChildList(a,f)]};e.renderItem=function({item:a,parent:b,itemType:c,isOnlyChild:d}){const {_newUI:f,id:h,editingEnabled:m,selectedItems:n,visibleElements:p}=this;var {children:q}=a;const u=`${`${h}_${a.uid}`}__title`;var x=!!a.error;q={["esri-basemap-layer-list__item--has-children"]:!!q.length&&!x,["esri-basemap-layer-list__item--error"]:!!x,["esri-basemap-layer-list__item--updating"]:a.updating&&
!b&&p.statusIndicators,["esri-basemap-layer-list__item--invisible"]:f&&!a.visible,["esri-basemap-layer-list__item--invisible-at-scale"]:!a.visibleAtCurrentScale,["esri-basemap-layer-list__item--selectable"]:m};if(m){var v;x={["data-layer-uid"]:null==(v=a.layer)?void 0:v.uid};return g.jsx("li",Object.assign({key:`item-with-selection-${a.uid}`,bind:this,afterCreate:this._focusListItem,afterUpdate:this._focusListItem,class:this.classes("esri-basemap-layer-list__item",q,{["esri-basemap-layer-list__item--only-child"]:d}),
"aria-labelledby":u,onclick:this._toggleSelection,onkeydown:this._selectionKeydown,"data-item-type":c,"data-item":a,tabIndex:0,"aria-selected":G.findSelectedItem(a,n)?"true":"false",role:"option"},x),this.renderItemContent(a,b,u))}return g.jsx("li",{key:`item-no-selection-${a.uid}`,bind:this,afterCreate:this._focusListItem,afterUpdate:this._focusListItem,class:this.classes("esri-basemap-layer-list__item",q),"aria-labelledby":u},this.renderItemContent(a,b,u))};e.renderItemTitle=function(a,b){const {messages:c}=
this,d=a.title||c.untitledLayer;a=a.visibleAtCurrentScale?d:`${d} (${c.layerInvisibleAtScale})`;return g.jsx("span",{key:"layer-title-container",id:b,title:a,"aria-label":a,class:"esri-basemap-layer-list__item-title"},d)};e.renderItemToggleIcon=function(a,b){const {_newUI:c}=this,{exclusive:d}=C;b=b&&b.visibilityMode;return g.jsx("span",{key:"item-toggle-icon",class:this.classes({["esri-basemap-layer-list__item-toggle-icon"]:c,["esri-basemap-layer-list__item-toggle-icon"]:c&&b!==d,["esri-basemap-layer-list__item-radio-icon"]:c&&
b===d,["esri-icon-radio-checked"]:b===d&&a.visible,["esri-icon-radio-unchecked"]:b===d&&!a.visible,["esri-icon-visible"]:b!==d&&a.visible,["esri-icon-non-visible"]:b!==d&&!a.visible}),"aria-hidden":"true"})};e.renderItemToggle=function(a,b,c){const {editingEnabled:d}=this,{exclusive:f}=C,h=b&&b.visibilityMode;return d?g.jsx("span",{key:"item-toggle-selection-enabled",class:"esri-basemap-layer-list__item-toggle",bind:this,onclick:this._toggleVisibility,onkeydown:this._toggleVisibility,"data-item":a,
"data-parent-visibility":h,tabIndex:0,"aria-checked":a.visible?"true":"false",role:h===f?"radio":"switch","aria-labelledby":c},this.renderItemToggleIcon(a,b)):g.jsx("span",{key:"item-toggle",class:"esri-basemap-layer-list__item-toggle"},this.renderItemToggleIcon(a,b))};e.renderItemError=function(a){return a.error?g.jsx("span",{key:"notice-triangle","aria-hidden":"true",class:"esri-icon-notice-triangle"}):null};e.renderLabel=function(a,b,c){const {editingEnabled:d,_newUI:f}=this,{inherited:h,exclusive:m}=
C,n=null==b?void 0:b.visibilityMode;var p=n===m?"radio":"switch";b=[this.renderItemToggle(a,b,c),this.renderItemTitle(a,c)];f&&b.reverse();p=d?g.jsx("div",{key:`item-label-no-selection-${a.uid}`,class:"esri-basemap-layer-list__item-label"},b):g.jsx("div",{key:`item-label-with-selection-${a.uid}`,class:"esri-basemap-layer-list__item-label",bind:this,onclick:this._toggleVisibility,onkeydown:this._toggleVisibility,"data-item":a,"data-parent-visibility":n,tabIndex:0,"aria-checked":a.visible?"true":"false",
role:p,"aria-labelledby":c},b);return n===h||a.error?g.jsx("div",{key:`item-label-container-${a.uid}`,class:"esri-basemap-layer-list__item-label"},this.renderItemError(a),this.renderItemTitle(a,c)):p};e.renderPanelButton=function(a){const {className:b,open:c,title:d,image:f}=a,h=f||b?b:"esri-icon-default-action",m=this._getIconImageStyles(a),n={["esri-basemap-layer-list__item-actions-menu-item--active"]:c},p={["esri-basemap-layer-list__item-action-image"]:!!m["background-image"]};h&&(p[h]=!!h);return g.jsx("div",
{key:`panel-${a.uid}`,bind:this,"data-panel":a,onclick:this._triggerPanel,onkeydown:this._triggerPanel,class:this.classes("esri-basemap-layer-list__item-actions-menu-item",n),role:"button",tabindex:"0",title:d,"aria-label":d},g.jsx("span",{class:this.classes(p),styles:m}))};e.renderActionsSections=function(a,b,c){b=b.toArray().map((d,f)=>g.jsx("ul",{key:`${a}-action-section-${f}`,class:"esri-basemap-layer-list__item-actions-list"},this.renderActionSection(a,d)));return g.jsx("div",{role:"group","aria-expanded":a.actionsOpen?
"true":"false",key:"actions-section",id:c,class:"esri-basemap-layer-list__item-actions",hidden:a.actionsOpen?null:!0},b)};e.renderActionSection=function(a,b){return(b&&b.toArray()).map(c=>this.renderAction({item:a,action:c}))};e.renderActionIcon=function(a){const {active:b,className:c}=a,d=this._getIconImageStyles(a);a="button"!==a.type||a.image||c?c:"esri-icon-default-action";const f={["esri-basemap-layer-list__item-action-image"]:!b&&!!d["background-image"],["esri-icon-loading-indicator"]:b,["esri-rotating"]:b};
a&&!b&&(f[a]=!0);return g.jsx("span",{key:"action-icon","aria-hidden":"true",class:this.classes("esri-basemap-layer-list__item-action-icon",f),styles:d})};e.renderActionTitle=function(a,b){return b?null:g.jsx("span",{key:"action-title",class:"esri-basemap-layer-list__item-action-title"},a)};e.renderAction=function(a){const {item:b,action:c,singleAction:d}=a,{active:f,disabled:h,title:m}=c;a={["esri-basemap-layer-list__item-actions-menu-item"]:d&&"button"===c.type,["esri-basemap-layer-list__item-action"]:f||
!d&&"toggle"!==c.type,["esri-basemap-layer-list__action-toggle"]:!f&&"toggle"===c.type,["esri-basemap-layer-list__action-toggle--on"]:!f&&"toggle"===c.type&&c.value,["esri-disabled-element"]:h};const n=[this.renderActionIcon(c),this.renderActionTitle(m,d)];return d?g.jsx("div",{bind:this,"data-item":b,"data-action":c,role:"button",key:`single-action-${c.uid}`,onclick:this._triggerAction,onkeydown:this._triggerAction,classes:a,tabindex:"0",title:m,"aria-label":m},n):g.jsx("li",{bind:this,"data-item":b,
"data-action":c,key:`action-${c.uid}`,onclick:this._triggerAction,onkeydown:this._triggerAction,classes:a,tabindex:"0",role:"button",title:m,"aria-label":m},n)};e._filterActions=function(a){return a.map(b=>b.filter(c=>c.visible))};e._destroyReferenceSortable=function(){const {_sortableReferenceLayers:a}=this;(null==a?0:a.el)&&a.destroy();this._sortableReferenceLayersNode=null};e._destroyBaseSortable=function(){const {_sortableBaseLayers:a}=this;(null==a?0:a.el)&&a.destroy();this._sortableBaseLayersNode=
null};e._toggleEditingTitle=function(){var {_editingTitle:a}=this;this._focusOnElement=(this._editingTitle=a=!a)?"edit-input":"edit-button";this.scheduleRender()};e._storeEditTitleInput=function(a){this._editTitleInput=a;this._focusEditElement()};e._focusEditElement=function(){this._editTitleInput&&"edit-input"===this._focusOnElement&&(this._focusOnElement=null,this._editTitleInput.focus());this._editTitleButton&&"edit-button"===this._focusOnElement&&(this._focusOnElement=null,this._editTitleButton.focus())};
e._storeEditTitleButton=function(a){this._editTitleButton=a;this._focusEditElement()};e._formSubmit=function(a){a.preventDefault();({_editTitleInput:a}=this);a&&(this.basemapTitle=a.value);this._toggleEditingTitle()};e._itemMovedList=function(a){const b=a.item["data-item"],c=a.to.dataset.nodeRef,d=a.from.dataset.nodeRef;({newIndex:a}=a);this.viewModel.transferListItem({listItem:b,from:d,to:c,newIndex:a})};e._toggleSortingBaseLayers=function(){const {_sortableBaseLayers:a,_sortableBaseLayersNode:b,
editingEnabled:c}=this;if(b){var d=!c;if(a)a.option("disabled",d);else{const f=K.Sortable.create(b,{dataIdAttr:"data-layer-uid",group:"root-layers",filter:".esri-basemap-layer-list__item--only-child",fallbackTolerance:4,disabled:d,onSort:()=>this._sortLayersToItems({type:"base",itemIds:f.toArray()}),onAdd:h=>this._itemMovedList(h),chosenClass:"esri-basemap-layer-list--chosen"});this._sortableBaseLayers=f}}};e._toggleSortingReferenceLayers=function(){const {_sortableReferenceLayers:a,_sortableReferenceLayersNode:b,
editingEnabled:c}=this;if(b){var d=!c;if(a)a.option("disabled",d);else{const f=K.Sortable.create(b,{dataIdAttr:"data-layer-uid",group:"root-layers",disabled:d,fallbackTolerance:4,onSort:()=>this._sortLayersToItems({type:"reference",itemIds:f.toArray()}),onAdd:h=>this._itemMovedList(h),chosenClass:"esri-basemap-layer-list--chosen"});this._sortableReferenceLayers=f}}};e._toggleSorting=function(){this._toggleSortingBaseLayers();this._toggleSortingReferenceLayers()};e._sortNodeCreated=function(a){const b=
a.getAttribute("data-node-ref");"base"===b&&(this._sortableBaseLayersNode=a);"reference"===b&&(this._sortableReferenceLayersNode=a);this._toggleSorting()};e._getItems=function(a){return a.toArray().filter(b=>this.errorsVisible||!b.error)};e._getSingleActionButton=function(a){return a.reduce(b=>b).filter(b=>b&&"button"===b.type).getItemAt(0)};e._sortLayersToItems=function({type:a,itemIds:b}){(a="base"===a?this.get("view.map.basemap.baseLayers"):"reference"===a?this.get("view.map.basemap.referenceLayers"):
null)&&a.sort((c,d)=>{c=b.indexOf(c.uid);d=b.indexOf(d.uid);return c>d?-1:c<d?1:0})};e._focusListItem=function(a){var b;const {_focusSortUid:c}=this;a&&c&&(null==(b=a["data-item"].layer)?void 0:b.uid)===c&&(a.focus(),this._focusSortUid=null)};e._selectionKeydown=function(a){const b=T.eventKey(a);if(-1===["ArrowDown","ArrowUp"].indexOf(b))this._toggleSelection(a);else{a.stopPropagation();var c=a.currentTarget,d=c["data-item"];c=c.dataset.itemType;var {_sortableBaseLayers:f,_sortableReferenceLayers:h,
selectedItems:m}=this,n="base"===c?f:"reference"===c?h:null;if(n){var p=G.findSelectedItem(d,m),q=n.toArray();a=q.indexOf(a.target.dataset.layerUid);var {baseItems:u,referenceItems:x}=this.viewModel;if(-1!==a)if("ArrowDown"===b){var v,F=a+1,D=F>=q.length;if(D&&"reference"===c&&p){var N;this.viewModel.transferListItem({listItem:d,from:"reference",to:"base",newIndex:u.length});this._focusSortUid=null==(N=d.layer)?void 0:N.uid;this.scheduleRender()}else if(D&&"reference"===c){var E;d=u.getItemAt(0);
this._focusSortUid=null==d?void 0:null==(E=d.layer)?void 0:E.uid;this.scheduleRender()}else D||(p&&(q.splice(F,0,q.splice(a,1)[0]),n.sort(q),this._sortLayersToItems({type:c,itemIds:n.toArray()})),this._focusSortUid=null==(v=d.layer)?void 0:v.uid,this.scheduleRender())}else if("ArrowUp"===b)if(E=a-1,(v=0>E)&&"base"===c&&p){var O;1!==u.length&&(this.viewModel.transferListItem({listItem:d,from:"base",to:"reference",newIndex:0}),this._focusSortUid=null==(O=d.layer)?void 0:O.uid,this.scheduleRender())}else v&&
"base"===c?(d=x.getItemAt(x.length-1),this._focusSortUid=null==d?void 0:null==(F=d.layer)?void 0:F.uid,this.scheduleRender()):v||(p&&(q.splice(E,0,q.splice(a,1)[0]),n.sort(q),this._sortLayersToItems({type:c,itemIds:n.toArray()})),this._focusSortUid=null==(D=d.layer)?void 0:D.uid,this.scheduleRender())}}};e._watchActionSectionChanges=function(a,b){this.handles.add(a.on("change",()=>this.scheduleRender()),b);a.forEach(c=>this._renderOnActionChanges(c,b))};e._renderOnActionChanges=function(a,b){"toggle"===
a.type?this.handles.add([w.init(a,"className image id title visible value".split(" "),()=>this.scheduleRender())],b):"slider"===a.type?this.handles.add([w.init(a,"className id title visible value displayValueEnabled max min step".split(" "),()=>this.scheduleRender())],b):this.handles.add([w.init(a,["className","image","id","title","visible"],()=>this.scheduleRender())],b)};e._renderOnItemChanges=function(a,b){this.handles.add([w.init(a,"actionsOpen visible open updating title visibleAtCurrentScale error visibilityMode panel panel.title panel.content panel.className".split(" "),
()=>this.scheduleRender()),a.actionsSections.on("change",()=>this.scheduleRender()),a.children.on("change",()=>this.scheduleRender())],b);a.children.forEach(c=>this._renderOnItemChanges(c,b));a.actionsSections.forEach(c=>this._watchActionSectionChanges(c,b))};e._itemsChanged=function(a,b){this.handles.remove(b);a.forEach(c=>this._renderOnItemChanges(c,b));this.scheduleRender()};e._countActions=function(a){return a.reduce((b,c)=>b+c.length,0)};e._getIconImageStyles=function(a){a="esri.widgets.LayerList.ListItemPanel"===
a.declaredClass||"esri.support.Action.ActionButton"===a.declaredClass||"esri.support.Action.ActionToggle"===a.declaredClass?a.image:null;return{"background-image":a?`url("${a}")`:null}};e._toggleActionsOpen=function(a){a.stopPropagation();a=a.currentTarget["data-item"];var {actionsOpen:b}=a;b=!b;const {baseItems:c,referenceItems:d}=this;b&&(c.forEach(f=>H(f)),d.forEach(f=>H(f)));a.actionsOpen=b};e._triggerPanel=function(a){a.stopPropagation();if(a=a.currentTarget["data-panel"])a.open=!a.open};e._triggerAction=
function(a){a.stopPropagation();var b=a.currentTarget;a=b["data-action"];b=b["data-item"];"toggle"===a.type&&(a.value=!a.value);this.triggerAction(a,b)};e._toggleVisibility=function(a){a.stopPropagation();var b=a.currentTarget;a=b.getAttribute("data-parent-visibility");b=b["data-item"];a===C.exclusive&&b.visible||(b.visible=!b.visible)};e._toggleChildrenClick=function(a){a.stopPropagation();a=a.currentTarget["data-item"];a.open=!a.open};e._toggleSelection=function(a){a.stopPropagation();const {multipleSelectionEnabled:b,
selectedItems:c}=this,d=b&&(a.metaKey||a.ctrlKey);a=a.currentTarget["data-item"];const f=G.findSelectedItem(a,c),{length:h}=c,m=f&&1===h;d?f?c.remove(f):c.add(a):h&&!m?(c.removeAll(),c.add(a)):f?c.remove(f):c.add(a)};I._createClass(A,[{key:"statusIndicatorsVisible",set:function(a){R.deprecatedProperty(aa,"statusIndicatorsVisible",{replacement:"visibleElements.statusIndicators",version:"4.15"});this.visibleElements={...this.visibleElements,statusIndicators:a}}}]);return A}(V.HandleOwnerMixin(X));l.__decorate([y.aliasOf("viewModel.basemapTitle")],
k.prototype,"basemapTitle",void 0);l.__decorate([y.aliasOf("viewModel.baseListItemCreatedFunction"),r.renderable()],k.prototype,"baseListItemCreatedFunction",void 0);l.__decorate([t.property(),r.renderable()],k.prototype,"editingEnabled",void 0);l.__decorate([t.property(),r.renderable()],k.prototype,"errorsVisible",void 0);l.__decorate([t.property()],k.prototype,"iconClass",void 0);l.__decorate([t.property({aliasOf:{source:"messages.widgetLabel",overridable:!0}})],k.prototype,"label",void 0);l.__decorate([t.property(),
r.renderable(),J.messageBundle("esri/widgets/BasemapLayerList/t9n/BasemapLayerList")],k.prototype,"messages",void 0);l.__decorate([t.property(),r.renderable(),J.messageBundle("esri/t9n/common")],k.prototype,"messagesCommon",void 0);l.__decorate([t.property()],k.prototype,"multipleSelectionEnabled",void 0);l.__decorate([y.aliasOf("viewModel.referenceListItemCreatedFunction"),r.renderable()],k.prototype,"referenceListItemCreatedFunction",void 0);l.__decorate([y.aliasOf("viewModel.baseItems"),r.renderable()],
k.prototype,"baseItems",void 0);l.__decorate([y.aliasOf("viewModel.referenceItems"),r.renderable()],k.prototype,"referenceItems",void 0);l.__decorate([t.property(),r.renderable()],k.prototype,"selectedItems",void 0);l.__decorate([t.property(),r.renderable()],k.prototype,"statusIndicatorsVisible",null);l.__decorate([y.aliasOf("viewModel.view"),r.renderable()],k.prototype,"view",void 0);l.__decorate([W.vmEvent("trigger-action"),t.property({type:L}),r.renderable("viewModel.state")],k.prototype,"viewModel",
void 0);l.__decorate([t.property(),r.renderable()],k.prototype,"visibleElements",void 0);l.__decorate([Q.cast("visibleElements")],k.prototype,"castVisibleElements",null);l.__decorate([z.accessibleHandler()],k.prototype,"_toggleActionsOpen",null);l.__decorate([z.accessibleHandler()],k.prototype,"_triggerPanel",null);l.__decorate([z.accessibleHandler()],k.prototype,"_triggerAction",null);l.__decorate([z.accessibleHandler()],k.prototype,"_toggleVisibility",null);l.__decorate([z.accessibleHandler()],
k.prototype,"_toggleChildrenClick",null);l.__decorate([z.accessibleHandler()],k.prototype,"_toggleSelection",null);return k=l.__decorate([S.subclass("esri.widgets.BasemapLayerList")],k)});