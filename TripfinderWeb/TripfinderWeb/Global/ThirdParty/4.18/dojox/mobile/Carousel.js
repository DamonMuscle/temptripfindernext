//>>built
define("dojo/_base/array dojo/_base/connect dojo/_base/declare dojo/_base/event dojo/_base/lang dojo/sniff dojo/dom-class dojo/dom-construct dojo/dom-style dijit/registry dijit/_Contained dijit/_Container dijit/_WidgetBase ./lazyLoadUtils ./CarouselItem ./PageIndicator ./SwapView require dojo/has!dojo-bidi?dojox/mobile/bidi/Carousel dojo/i18n!dojox/mobile/nls/messages".split(" "),function(k,y,t,z,A,q,r,l,p,u,m,B,C,D,H,E,n,F,G,v){m=t(q("dojo-bidi")?"dojox.mobile.NonBidiCarousel":"dojox.mobile.Carousel",
[C,B,m],{numVisible:2,itemWidth:0,title:"",pageIndicator:!0,navButton:!1,height:"",selectable:!0,baseClass:"mblCarousel",buildRendering:function(){this.containerNode=l.create("div",{className:"mblCarouselPages",id:this.id+"_pages"});this.inherited(arguments);var a;if(this.srcNodeRef){var b=0;for(a=this.srcNodeRef.childNodes.length;b<a;b++)this.containerNode.appendChild(this.srcNodeRef.firstChild)}this.headerNode=l.create("div",{className:"mblCarouselHeaderBar"},this.domNode);this.navButton&&(this.btnContainerNode=
l.create("div",{className:"mblCarouselBtnContainer"},this.headerNode),p.set(this.btnContainerNode,"float","right"),this.prevBtnNode=l.create("button",{className:"mblCarouselBtn",title:v.CarouselPrevious,innerHTML:"\x26lt;","aria-controls":this.containerNode.id},this.btnContainerNode),this.nextBtnNode=l.create("button",{className:"mblCarouselBtn",title:v.CarouselNext,innerHTML:"\x26gt;","aria-controls":this.containerNode.id},this.btnContainerNode),this._prevHandle=this.connect(this.prevBtnNode,"onclick",
"onPrevBtnClick"),this._nextHandle=this.connect(this.nextBtnNode,"onclick","onNextBtnClick"));this.pageIndicator&&(this.title||(this.title="\x26nbsp;"),this.piw=new E,this.headerNode.appendChild(this.piw.domNode));this.titleNode=l.create("div",{className:"mblCarouselTitle"},this.headerNode);this.domNode.appendChild(this.containerNode);this.subscribe("/dojox/mobile/viewChanged","handleViewChanged");this.connect(this.domNode,"onclick","_onClick");this.connect(this.domNode,"onkeydown","_onClick");this._dragstartHandle=
this.connect(this.domNode,"ondragstart",z.stop);this.selectedItemIndex=-1;this.items=[]},startup:function(){if(!this._started){var a;"inherit"===this.height?this.domNode.offsetParent&&(a=this.domNode.offsetParent.offsetHeight+"px"):this.height&&(a=this.height);a&&(this.domNode.style.height=a);if(this.store){if(!this.setStore)throw Error("Use StoreCarousel or DataCarousel instead of Carousel.");a=this.store;this.store=null;this.setStore(a,this.query,this.queryOptions)}else this.resizeItems();this.inherited(arguments);
this.currentView=k.filter(this.getChildren(),function(b){return b.isVisible()})[0]}},resizeItems:function(){var a=0,b,c,f=this.domNode.offsetHeight-(this.headerNode?this.headerNode.offsetHeight:0),d=10>q("ie")?5/this.numVisible-1:5/this.numVisible,e,g;k.forEach(this.getChildren(),function(h){if(h instanceof n)for(h.lazy||(h._instantiated=!0),h=h.containerNode.childNodes,b=0,c=h.length;b<c;b++)e=h[b],1===e.nodeType&&(g=this.items[a]||{},p.set(e,{width:g.width||90/this.numVisible+"%",height:g.height||
f+"px",margin:"0 "+(g.margin||d+"%")}),r.add(e,"mblCarouselSlot"),a++)},this);this.piw&&(this.piw.refId=this.containerNode.firstChild,this.piw.reset())},resize:function(){if(this.itemWidth){var a=Math.floor(this.domNode.offsetWidth/this.itemWidth);a!==this.numVisible&&(this.selectedItemIndex=this.getIndexByItemWidget(this.selectedItem),this.numVisible=a,0<this.items.length&&(this.onComplete(this.items),this.select(this.selectedItemIndex)))}},fillPages:function(){k.forEach(this.getChildren(),function(a,
b){var c="",f;for(f=0;f<this.numVisible;f++){var d="";var e=b*this.numVisible+f;var g={};if(e<this.items.length)if(g=this.items[e],e=this.store.getValue(g,"type")){d=this.store.getValue(g,"props");var h=this.store.getValue(g,"mixins")}else e="dojox.mobile.CarouselItem",k.forEach(["alt","src","headerText","footerText"],function(w){var x=this.store.getValue(g,w);void 0!==x&&(d&&(d+=","),d+=w+':"'+x+'"')},this);else e="dojox.mobile.CarouselItem",d='src:"'+F.toUrl("dojo/resources/blank.gif")+'", className:"mblCarouselItemBlank"';
c+='\x3cdiv data-dojo-type\x3d"'+e+'"';d&&(c+=" data-dojo-props\x3d'"+d+"'");h&&(c+=" data-dojo-mixins\x3d'"+h+"'");c+="\x3e\x3c/div\x3e"}a.containerNode.innerHTML=c},this)},onComplete:function(a){k.forEach(this.getChildren(),function(e){e instanceof n&&e.destroyRecursive()});this.selectedItem=null;this.items=a;var b=Math.ceil(a.length/this.numVisible),c=this.domNode.offsetHeight-this.headerNode.offsetHeight,f=Math.floor((-1===this.selectedItemIndex?0:this.selectedItemIndex)/this.numVisible);for(a=
0;a<b;a++){var d=new n({height:c+"px",lazy:!0});this.addChild(d);a===f?(d.show(),this.currentView=d):d.hide()}this.fillPages();this.resizeItems();c=this.getChildren();b=f+1>b-1?b-1:f+1;for(a=0>f-1?0:f-1;a<=b;a++)this.instantiateView(c[a])},onError:function(){},onUpdate:function(){},onDelete:function(){},onSet:function(a,b,c,f){},onNew:function(a,b){},onStoreClose:function(a){},getParentView:function(a){for(a=u.getEnclosingWidget(a);a;a=a.getParent())if(a.getParent()instanceof n)return a;return null},
getIndexByItemWidget:function(a){if(!a)return-1;var b=a.getParent();return k.indexOf(this.getChildren(),b)*this.numVisible+k.indexOf(b.getChildren(),a)},getItemWidgetByIndex:function(a){return-1===a?null:this.getChildren()[Math.floor(a/this.numVisible)].getChildren()[a%this.numVisible]},onPrevBtnClick:function(){this.currentView&&this.currentView.goTo(-1)},onNextBtnClick:function(){this.currentView&&this.currentView.goTo(1)},_onClick:function(a){if(!1!==this.onClick(a)){if(a&&"keydown"===a.type)if(39===
a.keyCode)this.onNextBtnClick();else if(37===a.keyCode)this.onPrevBtnClick();else if(13!==a.keyCode)return;for(a=u.getEnclosingWidget(a.target);;a=a.getParent()){if(!a)return;if(a.getParent()instanceof n)break}this.select(a);var b=this.getIndexByItemWidget(a);y.publish("/dojox/mobile/carouselSelect",[this,a,this.items[b],b])}},select:function(a){"number"===typeof a&&(a=this.getItemWidgetByIndex(a));this.selectable&&(this.selectedItem&&(this.selectedItem.set("selected",!1),r.remove(this.selectedItem.domNode,
"mblCarouselSlotSelected")),a&&(a.set("selected",!0),r.add(a.domNode,"mblCarouselSlotSelected")),this.selectedItem=a)},onClick:function(){},instantiateView:function(a){if(a&&!a._instantiated){var b="none"===p.get(a.domNode,"display");b&&p.set(a.domNode,{visibility:"hidden",display:""});D.instantiateLazyWidgets(a.containerNode,null,function(c){b&&p.set(a.domNode,{visibility:"visible",display:"none"})});a._instantiated=!0}},handleViewChanged:function(a){a.getParent()===this&&(this.currentView.nextView(this.currentView.domNode)===
a?this.instantiateView(a.nextView(a.domNode)):this.instantiateView(a.previousView(a.domNode)),this.currentView=a)},_setTitleAttr:function(a){this.titleNode.innerHTML=this._cv?this._cv(a):a;this._set("title",a)}});m.ChildSwapViewProperties={lazy:!1};A.extend(n,m.ChildSwapViewProperties);return q("dojo-bidi")?t("dojox.mobile.Carousel",[m,G]):m});