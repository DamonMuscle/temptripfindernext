//>>built
define(["dojox/main","dojo/_base/lang","dojo/date/locale","dojo/i18n"],function(f,m,h,n){function k(a){a=new Date(a);a.setHours(0,0,0,0);return a}f=m.getObject("date.relative",!0,f);var c=dojo.delegate,p=h._getGregorianBundle,d=h.format;f.format=function(a,b){b=b||{};var l=k(b.relativeDate||new Date),g=l.getTime()-k(a).getTime(),e={locale:b.locale};return 0===g?d(a,c(e,{selector:"time"})):5184E5>=g&&0<g&&!1!==b.weekCheck?d(a,c(e,{selector:"date",datePattern:"EEE"}))+" "+d(a,c(e,{selector:"time",formatLength:"short"})):
a.getFullYear()==l.getFullYear()?(b=p(n.normalizeLocale(b.locale)),d(a,c(e,{selector:"date",datePattern:b["dateFormatItem-MMMd"]}))):d(a,c(e,{selector:"date",formatLength:"medium",locale:b.locale}))};return f});