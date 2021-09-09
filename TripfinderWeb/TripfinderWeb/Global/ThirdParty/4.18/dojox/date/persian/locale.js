//>>built
define("dojox/main dojo/_base/lang dojo/_base/array dojo/date dojo/i18n dojo/regexp dojo/string ./Date dojo/i18n!dojo/cldr/nls/persian".split(" "),function(y,r,p,z,q,A,t,B,E){function C(c,d,e,k,l){return l.replace(/([a-z])\1*/ig,function(a){var g=a.charAt(0);a=a.length;var h=["abbr","wide","narrow"];switch(g){case "G":var b=d.eraAbbr[0];break;case "y":b=String(c.getFullYear());break;case "M":b=c.getMonth();if(3>a){b+=1;var f=!0}else g=["months-format",h[a-3]].join("-"),b=d[g][b];break;case "d":b=
c.getDate(!0);f=!0;break;case "E":b=c.getDay();3>a?(b+=1,f=!0):(g=["days-format",h[a-3]].join("-"),b=d[g][b]);break;case "a":b=12>c.getHours()?"am":"pm";b=d["dayPeriods-format-wide-"+b];break;case "h":case "H":case "K":case "k":f=c.getHours();switch(g){case "h":b=f%12||12;break;case "H":b=f;break;case "K":b=f%12;break;case "k":b=f||24}f=!0;break;case "m":b=c.getMinutes();f=!0;break;case "s":b=c.getSeconds();f=!0;break;case "S":b=Math.round(c.getMilliseconds()*Math.pow(10,a-3));f=!0;break;case "z":if(b=
z.getTimezoneName(c.toGregorian()))break;a=4;case "Z":b=c.toGregorian().getTimezoneOffset();b=[0>=b?"+":"-",t.pad(Math.floor(Math.abs(b)/60),2),t.pad(Math.abs(b)%60,2)];4==a&&(b.splice(0,0,"GMT"),b.splice(3,0,":"));b=b.join("");break;default:throw Error("dojox.date.persian.locale.formatPattern: invalid pattern char: "+l);}f&&(b=t.pad(b,a));return b})}function u(c,d,e,k){var l=function(h){return h};d=d||l;e=e||l;k=k||l;var a=c.match(/(''|[^'])+/g),g="'"==c.charAt(0);p.forEach(a,function(h,b){h?(a[b]=
(g?e:d)(h),g=!g):a[b]=""});return k(a.join(""))}function D(c,d,e,k){k=A.escapeString(k);q.normalizeLocale(e.locale);return k.replace(/([a-z])\1*/ig,function(l){var a=l.charAt(0);var g=l.length,h="";e.strict?1<g&&(h="0{"+(g-1)+"}"):h="0?";switch(a){case "y":a="\\d+";break;case "M":a=2<g?"\\S+ ?\\S+":h+"[1-9]|1[0-2]";break;case "d":a="[12]\\d|"+h+"[1-9]|3[01]";break;case "E":a="\\S+";break;case "h":a=h+"[1-9]|1[0-2]";break;case "k":a=h+"\\d|1[01]";break;case "H":a=h+"\\d|1\\d|2[0-3]";break;case "K":a=
h+"[1-9]|1\\d|2[0-4]";break;case "m":case "s":a=h+"\\d|[0-5]\\d";break;case "S":a="\\d{"+g+"}";break;case "a":g=e.am||d["dayPeriods-format-wide-am"];h=e.pm||d["dayPeriods-format-wide-pm"];e.strict?a=g+"|"+h:(a=g+"|"+h,g!=g.toLowerCase()&&(a+="|"+g.toLowerCase()),h!=h.toLowerCase()&&(a+="|"+h.toLowerCase()));break;default:a=".*"}c&&c.push(l);return"("+a+")"}).replace(/[\xa0 ]/g,"[\\s\\xa0]")}var m=r.getObject("date.persian.locale",!0,y);m.format=function(c,d){d=d||{};var e=q.normalizeLocale(d.locale),
k=d.formatLength||"short",l=m._getPersianBundle(e),a=[];e=r.hitch(this,C,c,l,e,d.fullYear);if("year"==d.selector)return c.getFullYear();"time"!=d.selector&&(c=d.datePattern||l["dateFormat-"+k])&&a.push(u(c,e));"date"!=d.selector&&(d=d.timePattern||l["timeFormat-"+k])&&a.push(u(d,e));return a.join(" ")};m.regexp=function(c){return m._parseInfo(c).regexp};m._parseInfo=function(c){c=c||{};var d=q.normalizeLocale(c.locale);d=m._getPersianBundle(d);var e=c.formatLength||"short",k=c.datePattern||d["dateFormat-"+
e];e=c.timePattern||d["timeFormat-"+e];var l=[];return{regexp:u("date"==c.selector?k:"time"==c.selector?e:"undefined"==typeof e?k:k+" "+e,r.hitch(this,D,l,d,c)),tokens:l,bundle:d}};m.parse=function(c,d){c=c.replace(/[\u200E\u200F\u202A\u202E]/g,"");d||(d={});var e=m._parseInfo(d),k=e.tokens,l=e.bundle;e=e.regexp.replace(/[\u200E\u200F\u202A\u202E]/g,"");c=(new RegExp("^"+e+"$")).exec(c);q.normalizeLocale(d.locale);if(!c)return null;var a=[1389,0,1,0,0,0,0],g="",h=["abbr","wide","narrow"];p.every(c,
function(b,f){if(!f)return!0;f=k[f-1];var n=f.length;switch(f.charAt(0)){case "y":a[0]=Number(b);break;case "M":if(2<n){if(f=l["months-format-"+h[n-3]].concat(),d.strict||(b=b.replace(".","").toLowerCase(),f=p.map(f,function(v){return v?v.replace(".","").toLowerCase():v})),b=p.indexOf(f,b),-1==b)return!1}else b--;a[1]=Number(b);break;case "D":a[1]=0;case "d":a[2]=Number(b);break;case "a":f=d.am||l["dayPeriods-format-wide-am"];n=d.pm||l["dayPeriods-format-wide-pm"];if(!d.strict){var w=/\./g;b=b.replace(w,
"").toLowerCase();f=f.replace(w,"").toLowerCase();n=n.replace(w,"").toLowerCase()}if(d.strict&&b!=f&&b!=n)return!1;g=b==n?"p":b==f?"a":"";break;case "K":24==b&&(b=0);case "h":case "H":case "k":a[3]=Number(b);break;case "m":a[4]=Number(b);break;case "s":a[5]=Number(b);break;case "S":a[6]=Number(b)}return!0});c=+a[3];"p"===g&&12>c?a[3]=c+12:"a"===g&&12==c&&(a[3]=0);return new B(a[0],a[1],a[2],a[3],a[4],a[5],a[6])};var x=[];m.addCustomFormats=function(c,d){x.push({pkg:c,name:d})};m._getPersianBundle=
function(c){var d={};p.forEach(x,function(e){e=q.getLocalization(e.pkg,e.name,c);d=r.mixin(d,e)},this);return d};m.addCustomFormats("dojo.cldr","persian");m.getNames=function(c,d,e,k,l){k=m._getPersianBundle(k);c=[c,e,d];if("standAlone"==e){e=c.join("-");var a=k[e];1==a[0]&&(a=void 0)}c[1]="format";return(a||k[c.join("-")]).concat()};m.weekDays=m.getNames("days","wide","format");m.months=m.getNames("months","wide","format");return m});