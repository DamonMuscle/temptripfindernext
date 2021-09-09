// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","./isWebGL2Context"],function(d,g){let f=function(c,e,a,b,h,k,l,m){this.createQuery=c;this.resultAvailable=e;this.getResult=a;this.disjoint=b;this.beginTimeElapsed=h;this.endTimeElapsed=k;this.createTimestamp=l;this.timestampBits=m};d.DisjointTimerQuery=f;d.createDisjointTimerQuery=function(c,e){if(e.disjointTimerQuery)return null;let a=c.getExtension("EXT_disjoint_timer_query_webgl2");return a&&g(c)?new f(()=>c.createQuery(),b=>c.getQueryParameter(b,c.QUERY_RESULT_AVAILABLE),b=>
c.getQueryParameter(b,c.QUERY_RESULT),()=>c.getParameter(a.GPU_DISJOINT_EXT),b=>c.beginQuery(a.TIME_ELAPSED_EXT,b),()=>c.endQuery(a.TIME_ELAPSED_EXT),b=>a.queryCounterEXT(b,a.TIMESTAMP_EXT),()=>c.getQuery(a.TIMESTAMP_EXT,a.QUERY_COUNTER_BITS_EXT)):(a=c.getExtension("EXT_disjoint_timer_query"))?new f(()=>a.createQueryEXT(),b=>a.getQueryObjectEXT(b,a.QUERY_RESULT_AVAILABLE_EXT),b=>a.getQueryObjectEXT(b,a.QUERY_RESULT_EXT),()=>c.getParameter(a.GPU_DISJOINT_EXT),b=>a.beginQueryEXT(a.TIME_ELAPSED_EXT,
b),()=>a.endQueryEXT(a.TIME_ELAPSED_EXT),b=>a.queryCounterEXT(b,a.TIMESTAMP_EXT),()=>a.getQueryEXT(a.TIMESTAMP_EXT,a.QUERY_COUNTER_BITS_EXT)):null};Object.defineProperty(d,"__esModule",{value:!0})});