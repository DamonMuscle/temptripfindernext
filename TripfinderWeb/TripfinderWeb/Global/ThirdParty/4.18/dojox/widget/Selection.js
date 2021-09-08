//>>built
define(["dojo/_base/declare","dojo/_base/array","dojo/sniff","dojo/_base/lang","dojo/Stateful"],function(k,h,l,m,n){return k("dojox.widget.Selection",n,{constructor:function(){this.selectedItems=[]},selectionMode:"single",_setSelectionModeAttr:function(a){"none"!=a&&"single"!=a&&"multiple"!=a&&(a="single");a!=this.selectionMode&&(this.selectionMode=a,"none"==a?this.set("selectedItems",null):"single"==a&&this.set("selectedItem",this.selectedItem))},selectedItem:null,_setSelectedItemAttr:function(a){this.selectedItem!=
a&&(this._set("selectedItem",a),this.set("selectedItems",a?[a]:null))},selectedItems:null,_setSelectedItemsAttr:function(a){var b=this.selectedItems;this.selectedItems=a;this.selectedItem=null;null!=b&&0<b.length&&this.updateRenderers(b,!0);this.selectedItems&&0<this.selectedItems.length&&(this.selectedItem=this.selectedItems[0],this.updateRenderers(this.selectedItems,!0))},_getSelectedItemsAttr:function(){return null==this.selectedItems?[]:this.selectedItems.concat()},isItemSelected:function(a){return null==
this.selectedItems||0==this.selectedItems.length?!1:h.some(this.selectedItems,m.hitch(this,function(b){return this.getIdentity(b)==this.getIdentity(a)}))},getIdentity:function(a){},setItemSelected:function(a,b){if("none"!=this.selectionMode&&null!=a){var c=this.get("selectedItems");"single"==this.selectionMode?b?this.set("selectedItem",a):this.isItemSelected(a)&&this.set("selectedItems",null):b?this.isItemSelected(a)||(null==c?c=[a]:c.unshift(a),this.set("selectedItems",c)):(b=h.filter(c,function(d){return d.id!=
a.id}),null!=b&&b.length!=c.length&&this.set("selectedItems",b))}},selectFromEvent:function(a,b,c,d){if("none"==this.selectionMode)return!1;var p=this.get("selectedItem"),f=b?this.isItemSelected(b):!1,g=l("mac")?a.metaKey:a.ctrlKey;if(null==b){if(!g&&null!=this.selectedItem){this.set("selectedItem",null);var e=!0}}else"multiple"==this.selectionMode?(g?this.setItemSelected(b,!f):this.set("selectedItem",b),e=!0):g?(this.set("selectedItem",f?null:b),e=!0):f||(this.set("selectedItem",b),e=!0);d&&e&&this.dispatchChange(p,
this.get("selectedItem"),c,a);return e},dispatchChange:function(a,b,c,d){this.onChange({oldValue:a,newValue:b,renderer:c,triggerEvent:d})},onChange:function(){}})});