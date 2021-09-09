// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../chunks/_rollupPluginBabelHelpers ../../../chunks/tslib.es6 ../../../core/has ../../../core/maybe ../../../core/Logger ../../../core/accessorSupport/ensureType ../../../core/accessorSupport/decorators/property ../../../core/jsonMap ../../../core/accessorSupport/decorators/subclass ../../../core/urlUtils ../../../core/uuid ../../../portal/support/resourceExtension ../SmartMappingSliderViewModel".split(" "),function(p,f,e,m,y,z,g,A,u,B,C,D,v){e=function(q){function k(a){a=q.call(this,
a)||this;a.zoomingEnabled=!1;return a}p._inheritsLoose(k,q);var h=k.prototype;h.setValue=function(a,b){const {max:c,min:d}=this;b>c||b<d||(this._updateBreakInfos(b,a),this.notifyChange("values"),this.notifyChange("labels"))};h.getStopInfo=function(){const {breaks:a,max:b,min:c}=this,d=b-c;if(!a||!a.length||!d)return[];const r=[];a.forEach(l=>{const {color:t,max:w,min:x}=l;let n;b===c?l=n=0:(l=(b-x)/d,n=(b-w)/d);r.push({offset:l,color:t},{offset:n,color:t})});return r};h._updateBreakMax=function(a){const {breaks:b,
max:c,min:d}=this;!isNaN(a)&&c!==a&&m.isSome(d)&&a>d&&b&&b.length&&(b[b.length-1].max=a)};h._updateBreakMin=function(a){const {breaks:b,max:c,min:d}=this;!isNaN(a)&&d!==a&&m.isSome(c)&&a<c&&b&&b.length&&(b[0].min=a)};h._updateBreakInfos=function(a,b){const {breaks:c}=this;c[b].max=a;c[b].min>c[b].max&&(c[b].min=a);m.isSome(c[b+1])&&(c[b+1].min=a)};p._createClass(k,[{key:"breaks",set:function(a){this._set("breaks",a);this.notifyChange("max");this.notifyChange("min")}},{key:"max",set:function(a){this._updateBreakMax(a);
this.setMax(a)},get:function(){const {breaks:a}=this;return a&&a.length?a[a.length-1].max:null}},{key:"min",set:function(a){this._updateBreakMin(a);this.setMin(a)},get:function(){const {breaks:a}=this;return a&&a.length?a[0].min:null}},{key:"values",get:function(){var {breaks:a}=this;if(!a||!a.length)return[];a=a.map(b=>b.max);a.pop();return a}}]);return k}(v);f.__decorate([g.property()],e.prototype,"breaks",null);f.__decorate([g.property({dependsOn:["breaks"]})],e.prototype,"max",null);f.__decorate([g.property({dependsOn:["breaks"]})],
e.prototype,"min",null);f.__decorate([g.property({dependsOn:["breaks"],readOnly:!0})],e.prototype,"values",null);f.__decorate([g.property({readOnly:!0})],e.prototype,"zoomingEnabled",void 0);return e=f.__decorate([u.subclass("esri.widgets.smartMapping.ClassedColorSlider.ClassedColorSliderViewModel")],e)});