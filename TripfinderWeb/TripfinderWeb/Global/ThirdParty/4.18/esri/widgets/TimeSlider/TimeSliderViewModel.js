// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../chunks/_rollupPluginBabelHelpers ../../chunks/tslib.es6 ../../core/has ../../core/maybe ../../core/Logger ../../core/accessorSupport/ensureType ../../core/accessorSupport/decorators/property ../../core/jsonMap ../../core/accessorSupport/decorators/subclass ../../core/urlUtils ../../core/uuid ../../portal/support/resourceExtension ../../core/promiseUtils ../../core/mathUtils ../../core/CollectionFlattener ../../layers/support/timeUtils ../../TimeExtent ../../TimeInterval ../../core/watchUtils ../../webdoc/widgets/TimeSlider ../../webdoc/Widgets ../../layers/mixins/TemporalLayer ../../core/HandleOwner".split(" "),
function(z,h,g,A,D,B,l,P,E,Q,R,S,v,F,G,H,r,I,w,J,K,L,M){const N=D.getLogger("esri.widgets.TimeSlider.TimeSliderViewModel");g=function(n){function x(a){a=n.call(this,a)||this;a.fullTimeExtent=null;a.loop=!1;a.mode="time-window";a.stops={count:10};a.timerId=null;a.view=null;a._animationController=null;a._updateTimeSliderTask=null;return a}z._inheritsLoose(x,n);var f=x.prototype;f.initialize=function(){this.handles.add([w.init(this,["stops","fullTimeExtent"],()=>this._createDefaultValues()),w.init(this,
"view.map",a=>{A.isSome(this._updateTimeSliderTask)&&(this._updateTimeSliderTask.abort(),this._updateTimeSliderTask=null);this._updateTimeSliderTask=v.createTask(b=>this._updateTimeSliderFromMap(a,b))}),w.init(this,"view",(a,b)=>{this._unregisterWidget(b);this._registerWidget(a)},!0)])};f.destroy=function(){var a;null!=this.timerId&&(clearInterval(this.timerId),this.timerId=null);this._unregisterWidget(this.view);this.view=null;null==(a=this._animationController)?void 0:a.abort();this._animationController=
null;A.isSome(this._updateTimeSliderTask)&&(this._updateTimeSliderTask.abort(),this._updateTimeSliderTask=null)};f.next=function(){this.values&&this.fullTimeExtent&&this._step({forward:!0,allowRestart:!1})};f.play=function(){this._startAnimation()};f.previous=function(){this._step({forward:!1,allowRestart:!1})};f.stop=function(){this._stopAnimation()};f.updateWebDocument=function(a){if("esri.WebMap"===a.declaredClass){const b=new J({currentTimeExtent:this.timeExtent,fullTimeExtent:this.fullTimeExtent,
numStops:void 0!==this.stops.count?this.stops.count:null,numThumbs:"time-window"===this.mode?2:1,stopDelay:this.playRate,stopInterval:void 0!==this.stops.interval?this.stops.interval:null});a.widgets?a.widgets.timeSlider=b:a.widgets=new K({timeSlider:b})}};f._animate=async function(){try{await Promise.all([v.after(this.playRate,null,this._animationController.signal),this.view&&w.whenFalseOnce(this.view,"updating",this._animationController.signal)])}catch(a){v.isAbortError(a)||N.error(a);this._animationController=
null;return}this._step({forward:!0,allowRestart:!1});this._animationController&&this._animate()};f._createDefaultValues=function(){const {fullTimeExtent:a,effectiveStops:b,mode:d,values:c}=this;a&&b&&d&&!c&&(this.values="time-window"===d?1<b.length?[b[0],b[1]]:null:0<b.length?[b[0]]:null)};f._divideTimeExtentByCount=function(a,b=10){if(!a||!b)return[];const {start:d,end:c}=a;if(!d||!c)return[];if(1E4<b)return this._divideTimeExtentByCount(a);a=[];const e=d.getTime(),m=c.getTime()-e;for(let q=0;q<=
b;q++)a.push(new Date(e+q/b*m));return a};f._divideTimeExtentByInterval=function(a,b,d=1E4){if(!a||!b)return[];const {start:c,end:e}=a;if(!c||!e)return[];const m=e.getTime()-c.getTime(),q=b.toMilliseconds();if(m/q>d)return this._divideTimeExtentByCount(a);a=[];const {value:p,unit:y}=b;for(b=c;b.getTime()<=e.getTime();)a.push(new Date(b.getTime())),b=H.offsetDate(b,p,y);return a};f._getFullTimeExtentFromWebDocument=async function(a,b){var {fullTimeExtent:d}=a.widgets.timeSlider;if(d)return d;a=new G({root:a,
rootCollectionNames:["layers"],getChildrenFunction:c=>"group"===(null==c?void 0:c.type)?c.layers:null,itemFilterFunction:c=>L.isTemporalLayer(c)&&c.useViewTime});await Promise.all(a.map(c=>c.load({signal:b})));d=a.map(c=>c.timeInfo);d.some(c=>c.hasLiveData)?(a=a.filter(c=>"feature"===(null==c?void 0:c.type)||"map-image"===(null==c?void 0:c.type)).map(c=>c.fetchRecomputedExtents({signal:b})),a=(await Promise.all(a)).map(c=>c.timeExtent)):a=d.map(c=>c.fullTimeExtent);return a.reduce((c,e)=>c.union(e))};
f._getModeFromTimeSlider=function(a){var b;const d=null!=(b=a.numThumbs)?b:2;if(a=a.currentTimeExtent){const {start:c,end:e}=a;return c&&e&&c.getTime()===e.getTime()?"instant":2===d?"time-window":c&&0!==c.getTime()?"cumulative-from-end":"cumulative-from-start"}return 2===d?"time-window":"cumulative-from-start"};f._getStopsFromTimeSlider=function(a){const {numStops:b,stopInterval:d}=a;return d?{interval:d}:{count:null!=b?b:5}};f._getValuesFromTimeSlider=function(a,b){if(a=a.currentTimeExtent){const {start:d,
end:c}=a;switch(b){case "time-window":return[d,c];case "cumulative-from-start":return[c];case "cumulative-from-end":case "instant":return[d]}}return null};f._registerWidget=function(a){(null==a?0:a.persistableViewModels.some(b=>b===this))||(null==a?void 0:a.persistableViewModels.add(this))};f._startAnimation=function(){this._stopAnimation();this._animationController=v.createAbortController();this._step({forward:!0,allowRestart:!0});this._animate()};f._step=function(a){const {forward:b,allowRestart:d}=
a,{effectiveStops:c,values:e}=this;if(e&&0!==e.length&&!(e.length>c.length)){var m=c.map(k=>k.getTime()).sort((k,t)=>k-t);a=e.map(k=>k.getTime()).map(k=>{var t=m.indexOf(k);if(-1!==t)return t;t=m.reduce((u,C)=>Math.abs(C-k)<Math.abs(u-k)?C:u);return m.indexOf(t)});var q=a.map(k=>k+=b?1:-1),p=q.some(k=>0>k||k>m.length-1),{loop:y,state:O}=this;if(p)if(y||d){const k=Math.min(...a),t=Math.max(...a);this.values=(b?a.map(u=>u-k):a.map(u=>u+(m.length-1-t))).map(u=>new Date(m[u]))}else"playing"===O&&this.stop();
else this.values=q.map(k=>new Date(m[k]))}};f._stopAnimation=function(){var a;null==(a=this._animationController)?void 0:a.abort();this._animationController=null};f._toTimeExtent=function(a){if(!a||0===a.length)return null;const b=a[0];a=1<a.length?a[1]:a[0];switch(this.mode){case "instant":case "time-window":return new r({start:b,end:a});case "cumulative-from-start":return new r({start:null,end:b});case "cumulative-from-end":return new r({start:b,end:null});default:return null}};f._unregisterWidget=
function(a){null==a?void 0:a.persistableViewModels.remove(this)};f._updateTimeSliderFromMap=async function(a,b){var d;if(a&&"esri.WebMap"===a.declaredClass){await a.load({signal:b});var c=null==a?void 0:null==(d=a.widgets)?void 0:d.timeSlider;if(c){d=this._getModeFromTimeSlider(c);this._isOverridden("mode")||(this.mode=d);this._isOverridden("fullTimeExtent")||(this.fullTimeExtent=await this._getFullTimeExtentFromWebDocument(a,b));if(!this._isOverridden("playRate")){var e;this.playRate=null!=(e=c.stopDelay)?
e:2E3}this._isOverridden("stops")||(this.stops=this._getStopsFromTimeSlider(c));this._isOverridden("values")||(this.values=this._getValuesFromTimeSlider(c,d))}}};z._createClass(x,[{key:"effectiveStops",get:function(){const {fullTimeExtent:a,stops:b}=this;if(!b)return[];if("dates"in b){var {dates:d}=b;if(null==d||0===d.length)return null;d=d.sort((c,e)=>c.getTime()-e.getTime());return a?d.filter(c=>{const {start:e,end:m}=a;return!(c.getTime()<e.getTime()||c.getTime()>m.getTime())}):d}return void 0!==
b.count?this._divideTimeExtentByCount(b.timeExtent||a,b.count):void 0!==b.interval?this._divideTimeExtentByInterval(b.timeExtent||a,b.interval):[]}},{key:"playRate",set:function(a){0>=a||36E5<a||("playing"===this.state&&this._startAnimation(),this._set("playRate",a))}},{key:"state",get:function(){return this.values&&this.fullTimeExtent?this._animationController?"playing":"ready":"disabled"}},{key:"timeExtent",get:function(){const {mode:a,values:b}=this;if(!b||0===b.length)return null;switch(a){case "instant":return new r({start:b[0],
end:b[0]});case "time-window":return 1<b.length?new r({start:b[0],end:b[1]}):null;case "cumulative-from-start":return new r({start:null,end:b[0]});case "cumulative-from-end":return new r({start:b[0],end:null})}}},{key:"values",set:function(a){const {fullTimeExtent:b,view:d}=this;if(b){const {start:c,end:e}=b,m=c.getTime(),q=e.getTime();a=a&&a.filter(p=>p).map(p=>{p=p.getTime();p=F.clamp(p,m,q);return new Date(p)})}d&&(d.timeExtent=this._toTimeExtent(a));this._set("values",a)}}]);return x}(M.HandleOwner);
h.__decorate([l.property({dependsOn:["stops","fullTimeExtent"],readOnly:!0})],g.prototype,"effectiveStops",null);h.__decorate([l.property({type:r})],g.prototype,"fullTimeExtent",void 0);h.__decorate([l.property({nonNullable:!0})],g.prototype,"loop",void 0);h.__decorate([l.property({nonNullable:!0})],g.prototype,"mode",void 0);h.__decorate([l.property({nonNullable:!0,value:1E3})],g.prototype,"playRate",null);h.__decorate([l.property({dependsOn:["fullTimeExtent","_animationController","values"],readOnly:!0})],
g.prototype,"state",null);h.__decorate([l.property({cast:n=>{if(!n)return null;void 0!==n.interval&&(n.interval=B.ensureType(I,n.interval));if(void 0!==n.interval||void 0!==n.count)n.timeExtent=B.ensureType(r,n.timeExtent);return n}})],g.prototype,"stops",void 0);h.__decorate([l.property({dependsOn:["values"],readOnly:!0})],g.prototype,"timeExtent",null);h.__decorate([l.property()],g.prototype,"timerId",void 0);h.__decorate([l.property({value:null})],g.prototype,"values",null);h.__decorate([l.property()],
g.prototype,"view",void 0);h.__decorate([l.property()],g.prototype,"_animationController",void 0);h.__decorate([l.property()],g.prototype,"next",null);h.__decorate([l.property()],g.prototype,"play",null);h.__decorate([l.property()],g.prototype,"previous",null);h.__decorate([l.property()],g.prototype,"stop",null);h.__decorate([l.property()],g.prototype,"updateWebDocument",null);return g=h.__decorate([E.subclass("esri.widgets.TimeSlider.TimeSliderViewModel")],g)});