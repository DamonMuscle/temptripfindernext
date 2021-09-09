// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["../chunks/_rollupPluginBabelHelpers","./has","../config","./maybe","./string"],function(n,g,h,l,p){const m={info:0,warn:1,error:2,none:3};g=function(){function b(a){this.level=null;this._module="";this.writer=this._parent=null;this._loggedMessages={error:new Map,warn:new Map,info:new Map};null!=a.level&&(this.level=a.level);null!=a.writer&&(this.writer=a.writer);this._module=a.module;b._loggers[this.module]=this;a=this.module.lastIndexOf(".");-1!==a&&(this._parent=b.getLogger(this.module.slice(0,
a)))}var c=b.prototype;c.error=function(...a){this._log("error","always",...a)};c.warn=function(...a){this._log("warn","always",...a)};c.info=function(...a){this._log("info","always",...a)};c.errorOnce=function(...a){this._log("error","once",...a)};c.warnOnce=function(...a){this._log("warn","once",...a)};c.infoOnce=function(...a){this._log("info","once",...a)};c.errorOncePerTick=function(...a){this._log("error","oncePerTick",...a)};c.warnOncePerTick=function(...a){this._log("warn","oncePerTick",...a)};
c.infoOncePerTick=function(...a){this._log("info","oncePerTick",...a)};b.getLogger=function(a){let d=b._loggers[a];d||(d=new b({module:a}));return d};c._log=function(a,d,...e){if(this._matchLevel(a)){if("always"!==d&&!b._throttlingDisabled){const f=this._argsToKey(e),k=this._loggedMessages[a].get(f);if("once"===d&&null!=k||"oncePerTick"===d&&k&&k>=b._tickCounter)return;this._loggedMessages[a].set(f,b._tickCounter);b._scheduleTickCounterIncrement()}for(const f of h.log.interceptors)if(f(a,this.module,
...e))return;this._inheritedWriter()(a,this.module,...e)}};c._parentWithMember=function(a,d){let e=this;for(;l.isSome(e);){const f=e[a];if(l.isSome(f))return f;e=e.parent}return d};c._inheritedWriter=function(){return this._parentWithMember("writer",this._consoleWriter)};c._consoleWriter=function(a,d,...e){console[a](`[${d}]`,...e)};c._matchLevel=function(a){return m[this._parentWithMember("level",h.log.level?h.log.level:"warn")]<=m[a]};c._argsToKey=function(...a){return p.numericHash(JSON.stringify(a,
(d,e)=>"object"!==typeof e||Array.isArray(e)?e:"[Object]"))};b._scheduleTickCounterIncrement=function(){b._tickCounterScheduled||(b._tickCounterScheduled=!0,Promise.resolve().then(()=>{b._tickCounter++;b._tickCounterScheduled=!1}))};n._createClass(b,[{key:"module",get:function(){return this._module}},{key:"parent",get:function(){return this._parent}}],[{key:"test",get:function(){return{resetLoggers(a={}){const d=b._loggers;b._loggers=a;return d},set throttlingDisabled(a){b._throttlingDisabled=a}}}}]);
return b}();g._loggers={};g._tickCounter=0;g._tickCounterScheduled=!1;g._throttlingDisabled=!1;return g});