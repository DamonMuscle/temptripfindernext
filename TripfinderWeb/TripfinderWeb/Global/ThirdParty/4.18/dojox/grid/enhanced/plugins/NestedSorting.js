//>>built
define("dojo/_base/declare dojo/_base/array dojo/_base/connect dojo/_base/lang dojo/_base/html dojo/_base/event dojo/_base/window dojo/keys dojo/query dojo/string ../_Plugin ../../EnhancedGrid".split(" "),function(t,n,A,m,e,r,w,x,l,p,B,C){t=t("dojox.grid.enhanced.plugins.NestedSorting",B,{name:"nestedSorting",_currMainSort:"none",_currRegionIdx:-1,_a11yText:{dojoxGridDescending:"\x26#9662;",dojoxGridAscending:"\x26#9652;",dojoxGridAscendingTip:"\x26#1784;",dojoxGridDescendingTip:"\x26#1783;",dojoxGridUnsortedTip:"x"},
constructor:function(){this._sortDef=[];this._sortData={};this._headerNodes={};this._excludedColIdx=[];this.nls=this.grid._nls;this.grid.setSortInfo=function(){};this.grid.setSortIndex=m.hitch(this,"_setGridSortIndex");this.grid.getSortIndex=function(){};this.grid.getSortProps=m.hitch(this,"getSortProps");this.grid.sortFields&&this._setGridSortIndex(this.grid.sortFields,null,!0);this.connect(this.grid.views,"render","_initSort");this.initCookieHandler();this.grid.plugin("rearrange")?this.subscribe("dojox/grid/rearrange/move/"+
this.grid.id,m.hitch(this,"_onColumnDnD")):this.connect(this.grid.layout,"moveColumn","_onMoveColumn")},onStartUp:function(){this.inherited(arguments);this.connect(this.grid,"onHeaderCellClick","_onHeaderCellClick");this.connect(this.grid,"onHeaderCellMouseOver","_onHeaderCellMouseOver");this.connect(this.grid,"onHeaderCellMouseOut","_onHeaderCellMouseOut")},_onMoveColumn:function(a,b,d,c,f){b=(a=this._getCurrentRegion())&&this._getRegionHeader(a).getAttribute("idx");var k=this._headerNodes[b];b=
this._sortData;var g={};a&&(this._blurRegion(a),this._currRegionIdx=n.indexOf(this._getRegions(),k.firstChild));if(c<d)for(h in b){var h=parseInt(h,10);(f=b[h])&&(h>=c&&h<d?g[h+1]=f:h==d?g[c]=f:g[h]=f)}else if(c>d+1)for(h in f||c++,b)h=parseInt(h,10),(f=b[h])&&(h>d&&h<c?g[h-1]=f:h==d?g[c-1]=f:g[h]=f);this._sortData=g;this._initSort(!1)},_onColumnDnD:function(a,b){if("col"===a){a={};var d=this._sortData,c,f=this._getCurrentRegion();this._blurRegion(f);f=this._getRegionHeader(f).getAttribute("idx");
for(c in b)d[c]&&(a[b[c]]=d[c],delete d[c]),c===f&&(f=b[c]);for(c in a)d[c]=a[c];b=this._headerNodes[f];this._currRegionIdx=n.indexOf(this._getRegions(),b.firstChild);this._initSort(!1)}},_setGridSortIndex:function(a,b,d){if(m.isArray(a)){for(b=0;b<a.length;b++){var c=a[b];var f=this.grid.getCellByField(c.attribute);if(!f){console.warn("Invalid sorting option, column ",c.attribute," not found.");return}if(f.nosort||!this.grid.canSort(f.index,f.field)){console.warn("Invalid sorting option, column ",
c.attribute," is unsortable.");return}}this.clearSort();n.forEach(a,function(k,g){f=this.grid.getCellByField(k.attribute);this.setSortData(f.index,"index",g);this.setSortData(f.index,"order",k.descending?"desc":"asc")},this)}else{if(isNaN(a)||void 0===b)return;this.setSortData(a,"order",b?"asc":"desc")}this._updateSortDef();d||this.grid.sort()},getSortProps:function(){return this._sortDef.length?this._sortDef:null},_initSort:function(a){var b=this.grid,d=b.domNode,c=this._sortDef.length;e.toggleClass(d,
"dojoxGridSorted",!!c);e.toggleClass(d,"dojoxGridSingleSorted",1===c);e.toggleClass(d,"dojoxGridNestSorted",1<c);0<c&&(this._currMainSort=this._sortDef[0].descending?"desc":"asc");var f,k=this._excludedCoIdx=[];this._headerNodes=l("th",b.viewsHeaderNode).forEach(function(g){f=parseInt(g.getAttribute("idx"),10);("none"===e.style(g,"display")||b.layout.cells[f].nosort||b.canSort&&!b.canSort(f,b.layout.cells[f].field))&&k.push(f)});this._headerNodes.forEach(this._initHeaderNode,this);this._initFocus();
a&&this._focusHeader()},_initHeaderNode:function(a){e.toggleClass(a,"dojoxGridSortNoWrap",!0);var b=l(".dojoxGridSortNode",a)[0];b&&e.toggleClass(b,"dojoxGridSortNoWrap",!0);if(0<=n.indexOf(this._excludedCoIdx,a.getAttribute("idx")))e.addClass(a,"dojoxGridNoSort");else{if(l(".dojoxGridSortBtn",a).length){b=l(".dojoxGridSortBtnSingle",a)[0];var d=l(".dojoxGridSortBtnNested",a)[0];b.className="dojoxGridSortBtn dojoxGridSortBtnSingle";d.className="dojoxGridSortBtn dojoxGridSortBtnNested";d.innerHTML=
"1";e.removeClass(a,"dojoxGridCellShowIndex");e.removeClass(a.firstChild,"dojoxGridSortNodeSorted");e.removeClass(a.firstChild,"dojoxGridSortNodeAsc");e.removeClass(a.firstChild,"dojoxGridSortNodeDesc");e.removeClass(a.firstChild,"dojoxGridSortNodeMain");e.removeClass(a.firstChild,"dojoxGridSortNodeSub")}else this._connects=n.filter(this._connects,function(c){return c._sort?(A.disconnect(c),!1):!0}),b=e.create("a",{className:"dojoxGridSortBtn dojoxGridSortBtnNested",title:p.substitute(this.nls.sortingState,
[this.nls.nestedSort,this.nls.ascending]),innerHTML:"1"},a.firstChild,"last"),b.onmousedown=r.stop,b=e.create("a",{className:"dojoxGridSortBtn dojoxGridSortBtnSingle",title:p.substitute(this.nls.sortingState,[this.nls.singleSort,this.nls.ascending])},a.firstChild,"last"),b.onmousedown=r.stop;this._updateHeaderNodeUI(a)}},_onHeaderCellClick:function(a){this._focusRegion(a.target);e.hasClass(a.target,"dojoxGridSortBtn")&&(this._onSortBtnClick(a),r.stop(a),this._focusRegion(this._getCurrentRegion()))},
_onHeaderCellMouseOver:function(a){if(a.cell&&!(1<this._sortDef.length||this._sortData[a.cellIndex]&&0===this._sortData[a.cellIndex].index)){for(var b in this._sortData)if(this._sortData[b]&&0===this._sortData[b].index){e.addClass(this._headerNodes[b],"dojoxGridCellShowIndex");break}if(e.hasClass(w.body(),"dijit_a11y")){b=a.cell.index;var d=a.cellNode;a=l(".dojoxGridSortBtnSingle",d)[0];d=l(".dojoxGridSortBtnNested",d)[0];e.hasClass(this.grid.domNode,"dojoxGridSingleSorted")||e.hasClass(this.grid.domNode,
"dojoxGridNestSorted");var c=d.getAttribute("orderIndex");if(null===c||void 0===c)d.setAttribute("orderIndex",d.innerHTML),c=d.innerHTML;this.isAsc(b)?d.innerHTML=c+this._a11yText.dojoxGridDescending:this.isDesc(b)?d.innerHTML=c+this._a11yText.dojoxGridUnsortedTip:d.innerHTML=c+this._a11yText.dojoxGridAscending;"none"===this._currMainSort?a.innerHTML=this._a11yText.dojoxGridAscending:"asc"===this._currMainSort?a.innerHTML=this._a11yText.dojoxGridDescending:"desc"===this._currMainSort&&(a.innerHTML=
this._a11yText.dojoxGridUnsortedTip)}}},_onHeaderCellMouseOut:function(a){for(var b in this._sortData)if(this._sortData[b]&&0===this._sortData[b].index){e.removeClass(this._headerNodes[b],"dojoxGridCellShowIndex");break}},_onSortBtnClick:function(a){var b=a.cell.index;if(e.hasClass(a.target,"dojoxGridSortBtnSingle"))this._prepareSingleSort(b);else if(e.hasClass(a.target,"dojoxGridSortBtnNested"))this._prepareNestedSort(b);else return;r.stop(a);this._doSort(b)},_doSort:function(a){this._sortData[a]&&
this._sortData[a].order?this.isAsc(a)?this.setSortData(a,"order","desc"):this.isDesc(a)&&this.removeSortData(a):this.setSortData(a,"order","asc");this._updateSortDef();this.grid.sort();this._initSort(!0)},setSortData:function(a,b,d){var c=this._sortData[a];c||(c=this._sortData[a]={});c[b]=d},removeSortData:function(a){var b=this._sortData,d=b[a].index,c;delete b[a];for(c in b)b[c].index>d&&b[c].index--},_prepareSingleSort:function(a){var b=this._sortData,d;for(d in b)delete b[d];this.setSortData(a,
"index",0);this.setSortData(a,"order","none"===this._currMainSort?null:this._currMainSort);this._sortData[a]&&this._sortData[a].order?this.isAsc(a)?this._currMainSort="desc":this.isDesc(a)&&(this._currMainSort="none"):this._currMainSort="asc"},_prepareNestedSort:function(a){var b=this._sortData[a]?this._sortData[a].index:null;0===b||b||this.setSortData(a,"index",this._sortDef.length)},_updateSortDef:function(){this._sortDef.length=0;var a=this._sortData,b;for(b in a)this._sortDef[a[b].index]={attribute:this.grid.layout.cells[b].field,
descending:"desc"===a[b].order}},_updateHeaderNodeUI:function(a){var b=this._getCellByNode(a),d=b.index,c=this._sortData[d],f=l(".dojoxGridSortNode",a)[0],k=l(".dojoxGridSortBtnSingle",a)[0],g=l(".dojoxGridSortBtnNested",a)[0];e.toggleClass(k,"dojoxGridSortBtnAsc","asc"===this._currMainSort);e.toggleClass(k,"dojoxGridSortBtnDesc","desc"===this._currMainSort);k.title="asc"===this._currMainSort?p.substitute(this.nls.sortingState,[this.nls.singleSort,this.nls.descending]):"desc"===this._currMainSort?
p.substitute(this.nls.sortingState,[this.nls.singleSort,this.nls.unsorted]):p.substitute(this.nls.sortingState,[this.nls.singleSort,this.nls.ascending]);var h=this;(function(){var q="Column "+(b.index+1)+" "+b.field,u="none",v="ascending";c&&(u="asc"===c.order?"ascending":"descending",v="asc"===c.order?"descending":"none");var y=q+" - is sorted by "+u,z=q+" - is nested sorted by "+u,D=q+" - choose to sort by "+v,E=q+" - choose to nested sort by "+v;k.setAttribute("aria-label",y);g.setAttribute("aria-label",
z);q=[h.connect(k,"onmouseover",function(){k.setAttribute("aria-label",D)}),h.connect(k,"onmouseout",function(){k.setAttribute("aria-label",y)}),h.connect(g,"onmouseover",function(){g.setAttribute("aria-label",E)}),h.connect(g,"onmouseout",function(){g.setAttribute("aria-label",z)})];n.forEach(q,function(F){F._sort=!0})})();a=e.hasClass(w.body(),"dijit_a11y");if(c){if(c.index||0===c.index&&1<this._sortDef.length)g.innerHTML=c.index+1;e.addClass(f,"dojoxGridSortNodeSorted");this.isAsc(d)?(e.addClass(f,
"dojoxGridSortNodeAsc"),g.title=p.substitute(this.nls.sortingState,[this.nls.nestedSort,this.nls.descending]),a&&(f.innerHTML=this._a11yText.dojoxGridAscendingTip)):this.isDesc(d)&&(e.addClass(f,"dojoxGridSortNodeDesc"),g.title=p.substitute(this.nls.sortingState,[this.nls.nestedSort,this.nls.unsorted]),a&&(f.innerHTML=this._a11yText.dojoxGridDescendingTip));e.addClass(f,0===c.index?"dojoxGridSortNodeMain":"dojoxGridSortNodeSub")}else g.innerHTML=this._sortDef.length+1,g.title=p.substitute(this.nls.sortingState,
[this.nls.nestedSort,this.nls.ascending]),a&&(f.innerHTML=this._a11yText.dojoxGridUnsortedTip)},isAsc:function(a){return"asc"===this._sortData[a].order},isDesc:function(a){return"desc"===this._sortData[a].order},_getCellByNode:function(a){var b;for(b=0;b<this._headerNodes.length;b++)if(this._headerNodes[b]===a)return this.grid.layout.cells[b];return null},clearSort:function(){this._sortData={};this._sortDef.length=0},initCookieHandler:function(){this.grid.addCookieHandler&&this.grid.addCookieHandler({name:"sortOrder",
onLoad:m.hitch(this,"_loadNestedSortingProps"),onSave:m.hitch(this,"_saveNestedSortingProps")})},_loadNestedSortingProps:function(a,b){this._setGridSortIndex(a)},_saveNestedSortingProps:function(a){return this.getSortProps()},_initFocus:function(){var a=this.focus=this.grid.focus;this._focusRegions=this._getRegions();if(!this._headerArea){var b=this._headerArea=a.getArea("header");b.onFocus=a.focusHeader=m.hitch(this,"_focusHeader");b.onBlur=a.blurHeader=a._blurHeader=m.hitch(this,"_blurHeader");
b.onMove=m.hitch(this,"_onMove");b.onKeyDown=m.hitch(this,"_onKeyDown");b._regions=[];b.getRegions=null;this.connect(this.grid,"onBlur","_blurHeader")}},_focusHeader:function(a){if(-1===this._currRegionIdx)this._onMove(0,1,null);else{var b=this._getCurrentRegion();this._focusRegion(b);b=this._getRegionView(b);b.scrollboxNode.scrollLeft=b.headerNode.scrollLeft}try{a&&r.stop(a)}catch(d){}return!0},_blurHeader:function(a){this._blurRegion(this._getCurrentRegion());return!0},_onMove:function(a,b,d){var c=
this._focusRegions[(this._currRegionIdx||0)+b];c&&("none"===e.style(c,"display")||"hidden"===e.style(c,"visibility")?this._onMove(a,b+(0<b?1:-1),d):(this._focusRegion(c),a=this._getRegionView(c),a.scrollboxNode.scrollLeft=a.headerNode.scrollLeft))},_onKeyDown:function(a,b){if(b)switch(a.keyCode){case x.ENTER:case x.SPACE:(e.hasClass(a.target,"dojoxGridSortBtnSingle")||e.hasClass(a.target,"dojoxGridSortBtnNested"))&&this._onSortBtnClick(a)}},_getRegionView:function(a){for(var b=a;b&&!e.hasClass(b,
"dojoxGridHeader");)b=b.parentNode;return b?n.filter(this.grid.views.views,function(d){return d.headerNode===b})[0]||null:null},_getRegions:function(){var a=[],b=this.grid.layout.cells;this._headerNodes.forEach(function(d,c){"none"!==e.style(d,"display")&&(b[c].isRowSelector?a.push(d):l(".dojoxGridSortNode,.dojoxGridSortBtnNested,.dojoxGridSortBtnSingle",d).forEach(function(f){f.setAttribute("tabindex",0);a.push(f)}))},this);return a},_focusRegion:function(a){if(a){var b=this._getCurrentRegion();
b&&a!==b&&this._blurRegion(b);b=this._getRegionHeader(a);e.addClass(b,"dojoxGridCellSortFocus");e.hasClass(a,"dojoxGridSortNode")?e.addClass(a,"dojoxGridSortNodeFocus"):e.hasClass(a,"dojoxGridSortBtn")&&e.addClass(a,"dojoxGridSortBtnFocus");try{a.focus()}catch(d){}this.focus.currentArea("header");this._currRegionIdx=n.indexOf(this._focusRegions,a)}},_blurRegion:function(a){if(a){var b=this._getRegionHeader(a);e.removeClass(b,"dojoxGridCellSortFocus");e.hasClass(a,"dojoxGridSortNode")?e.removeClass(a,
"dojoxGridSortNodeFocus"):e.hasClass(a,"dojoxGridSortBtn")&&e.removeClass(a,"dojoxGridSortBtnFocus");a.blur()}},_getCurrentRegion:function(){return this._focusRegions?this._focusRegions[this._currRegionIdx]:null},_getRegionHeader:function(a){for(;a&&!e.hasClass(a,"dojoxGridCell");)a=a.parentNode;return a},destroy:function(){this._headerNodes=this._focusRegions=this._sortDef=this._sortData=null;this.inherited(arguments)}});C.registerPlugin(t);return t});