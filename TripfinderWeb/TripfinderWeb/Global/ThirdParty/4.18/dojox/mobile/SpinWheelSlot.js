//>>built
define("dojo/_base/kernel dojo/_base/array dojo/_base/declare dojo/_base/window dojo/dom-class dojo/dom-construct dojo/has dojo/has!dojo-bidi?dojox/mobile/bidi/SpinWheelSlot dojo/touch dojo/on dijit/_Contained dijit/_WidgetBase ./scrollable ./common".split(" "),function(n,p,w,x,g,m,l,A,q,r,B,C,D){n=w(l("dojo-bidi")?"dojox.mobile.NonBidiSpinWheelSlot":"dojox.mobile.SpinWheelSlot",[C,B,D],{items:[],labels:[],labelFrom:0,labelTo:0,zeroPad:0,value:"",step:1,pageSteps:1,baseClass:"mblSpinWheelSlot",maxSpeed:500,
minItems:15,centerPos:0,scrollBar:!1,constraint:!1,propagatable:!1,androidWorkaroud:!1,buildRendering:function(){this.inherited(arguments);this.initLabels();var a,b;if(0<this.labels.length)for(this.items=[],a=0;a<this.labels.length;a++)this.items.push([a,this.labels[a]]);this.containerNode=m.create("div",{className:"mblSpinWheelSlotContainer"});this.containerNode.style.height=2*(x.global.innerHeight||x.doc.documentElement.clientHeight)+"px";this.panelNodes=[];for(var c=0;3>c;c++){this.panelNodes[c]=
m.create("div",{className:"mblSpinWheelSlotPanel"});this.panelNodes[c].setAttribute("aria-hidden","true");var d=this.items.length;if(0<d){var e=Math.ceil(this.minItems/d);for(b=0;b<e;b++)for(a=0;a<d;a++)m.create("div",{className:"mblSpinWheelSlotLabel",name:this.items[a][0],"data-mobile-val":this.items[a][1],innerHTML:this._cv?this._cv(this.items[a][1]):this.items[a][1]},this.panelNodes[c])}this.containerNode.appendChild(this.panelNodes[c])}this.domNode.appendChild(this.containerNode);this.touchNode=
m.create("div",{className:"mblSpinWheelSlotTouch"},this.domNode);this.setSelectable(this.domNode,!1);this.touchNode.setAttribute("tabindex",0);this.touchNode.setAttribute("role","slider");""===this.value&&0<this.items.length&&(this.value=this.items[0][1]);this._initialValue=this.value;if(l("windows-theme")){var f=this,h=this.containerNode;this.own(r(f.touchNode,q.press,function(k){var E=k.pageY;k=f.getParent().getChildren();for(var t=0,F=k.length;t<F;t++){var u=k[t].containerNode;h!==u?(g.remove(u,
"mblSelectedSlot"),u.selected=!1):g.add(h,"mblSelectedSlot")}var y=r(f.touchNode,q.move,function(v){5>Math.abs(v.pageY-E)||(y.remove(),z.remove(),h.selected=!0,(v=f.getCenterItem())&&g.remove(v,"mblSelectedSlotItem"))}),z=r(f.touchNode,q.release,function(){z.remove();y.remove();h.selected?g.remove(h,"mblSelectedSlot"):g.add(h,"mblSelectedSlot");h.selected=!h.selected})}));this.on("flickAnimationEnd",function(){var k=f.getCenterItem();f.previousCenterItem&&g.remove(f.previousCenterItem,"mblSelectedSlotItem");
g.add(k,"mblSelectedSlotItem");f.previousCenterItem=k})}},startup:function(){this._started||(this.inherited(arguments),this.noResize=!0,0<this.items.length&&(this.init(),this.centerPos=this.getParent().centerPos,this._itemHeight=this.panelNodes[1].childNodes[0].offsetHeight,this.adjust(),this.connect(this.touchNode,"onkeydown","_onKeyDown")),l("windows-theme")&&(this.previousCenterItem=this.getCenterItem())&&g.add(this.previousCenterItem,"mblSelectedSlotItem"))},initLabels:function(){if(this.labelFrom!==
this.labelTo)for(var a=this.labels=[],b=this.zeroPad&&Array(this.zeroPad).join("0"),c=this.labelFrom;c<=this.labelTo;c+=this.step)a.push(this.zeroPad?(b+c).slice(-this.zeroPad):c+"")},onTouchStart:function(a){this.touchNode.focus();this.inherited(arguments)},adjust:function(){for(var a=this.panelNodes[1].childNodes,b,c=0,d=a.length;c<d;c++){var e=a[c];if(e.offsetTop<=this.centerPos&&this.centerPos<e.offsetTop+e.offsetHeight){b=this.centerPos-(e.offsetTop+Math.round(e.offsetHeight/2));break}}a=this.panelNodes[0].offsetHeight;
this.panelNodes[0].style.top=-a+b+"px";this.panelNodes[1].style.top=b+"px";this.panelNodes[2].style.top=a+b+"px"},setInitialValue:function(){this.set("value",this._initialValue);this.touchNode.setAttribute("aria-valuetext",this._initialValue)},_onKeyDown:function(a){if(!a||"keydown"!==a.type||a.altKey||a.ctrlKey||a.shiftKey)return!0;switch(a.keyCode){case 38:case 39:return this.spin(1),a.stopPropagation(),!1;case 40:case 37:return this.spin(-1),a.stopPropagation(),!1;case 33:return this.spin(this.pageSteps),
a.stopPropagation(),!1;case 34:return this.spin(-1*this.pageSteps),a.stopPropagation(),!1}return!0},_getCenterPanel:function(){for(var a=this.getPos(),b=0,c=this.panelNodes.length;b<c;b++){var d=a.y+this.panelNodes[b].offsetTop;if(d<=this.centerPos&&this.centerPos<d+this.panelNodes[b].offsetHeight)return this.panelNodes[b]}return null},setColor:function(a,b){p.forEach(this.panelNodes,function(c){p.forEach(c.childNodes,function(d,e){g.toggle(d,b||"mblSpinWheelSlotLabelBlue",d.innerHTML===a)},this)},
this)},disableValues:function(a){p.forEach(this.panelNodes,function(b){for(var c=0;c<b.childNodes.length;c++)g.toggle(b.childNodes[c],"mblSpinWheelSlotLabelGray",c>=a)})},getCenterItem:function(){var a=this.getPos(),b=this._getCenterPanel();if(b){a=a.y+b.offsetTop;b=b.childNodes;for(var c=0,d=b.length;c<d;c++)if(a+b[c].offsetTop<=this.centerPos&&this.centerPos<a+b[c].offsetTop+b[c].offsetHeight)return b[c]}return null},_getKeyAttr:function(){if(!this._started){if(this.items)for(var a=0;a<this.items.length;a++)if(this.items[a][1]==
this.value)return this.items[a][0];return null}return(a=this.getCenterItem())&&a.getAttribute("name")},_getValueAttr:function(){if(!this._started)return this.value;if(0<this.items.length){var a=this.getCenterItem();return a&&a.getAttribute("data-mobile-val")}return this._initialValue},_setValueAttr:function(a){0<this.items.length&&this._spinToValue(a,!0)},_spinToValue:function(a,b){var c,d,e=this.get("value");if(!e)this._pendingValue=a;else if(e!=a){this._pendingValue=void 0;b&&this._set("value",
a);b=this.items.length;for(var f=0;f<b&&(this.items[f][1]===String(e)&&(c=f),this.items[f][1]===String(a)&&(d=f),void 0===c||void 0===d);f++);a=d-(c||0);this.spin(0<a?a<b-a?-a:b-a:-a<b+a?-a:-(b+a))}},onFlickAnimationStart:function(a){this._onFlickAnimationStartCalled=!0;this.inherited(arguments)},onFlickAnimationEnd:function(a){this._onFlickAnimationStartCalled=this._duringSlideTo=!1;this.inherited(arguments);this.touchNode.setAttribute("aria-valuetext",this.get("value"))},spin:function(a){if(this._started&&
!this._duringSlideTo){var b=this.getPos();b.y+=a*this._itemHeight;this.slideTo(b,1)}},getSpeed:function(){var a=0,b=this._time.length,c=(new Date).getTime()-this.startTime-this._time[b-1];2<=b&&200>c&&(a=this.calcSpeed(this._posY[b-1]-this._posY[0<=b-6?b-6:0],this._time[b-1]-this._time[0<=b-6?b-6:0]));return{x:0,y:a}},calcSpeed:function(a,b){var c=this.inherited(arguments);if(!c)return 0;var d=Math.abs(c),e=c;d>this.maxSpeed&&(e=c/d*this.maxSpeed);return e},adjustDestination:function(a,b,c){b=this._itemHeight;
c=a.y+Math.round(b/2);a.y=c-(0<=c?c%b:c%b+b);return!0},resize:function(a){if(this.panelNodes&&0<this.panelNodes.length&&(a=this.panelNodes[1].childNodes,0<a.length&&!l("windows-theme"))){var b=this.getParent();b&&(this._itemHeight=a[0].offsetHeight,this.centerPos=b.centerPos,this.panelNodes[0].style.top||this.adjust())}this._pendingValue&&this.set("value",this._pendingValue)},slideTo:function(a,b,c){this._duringSlideTo=!0;var d=this.getPos(),e=d.y+this.panelNodes[1].offsetTop,f=e+this.panelNodes[1].offsetHeight,
h=this.domNode.parentNode.offsetHeight;d.y<a.y?f>h&&(d=this.panelNodes[2],d.style.top=this.panelNodes[0].offsetTop-this.panelNodes[0].offsetHeight+"px",this.panelNodes[2]=this.panelNodes[1],this.panelNodes[1]=this.panelNodes[0],this.panelNodes[0]=d):d.y>a.y&&0>e&&(d=this.panelNodes[0],d.style.top=this.panelNodes[2].offsetTop+this.panelNodes[2].offsetHeight+"px",this.panelNodes[0]=this.panelNodes[1],this.panelNodes[1]=this.panelNodes[2],this.panelNodes[2]=d);this.getParent()._duringStartup?b=0:40>
Math.abs(this._speed.y)&&(b=.2);b&&0<b?(this.inherited(arguments,[a,b,c]),this._onFlickAnimationStartCalled||(this._duringSlideTo=!1)):(this.onFlickAnimationStart(),this.scrollTo(a,!0),this.onFlickAnimationEnd())}});return l("dojo-bidi")?w("dojox.mobile.SpinWheelSlot",[n,A]):n});