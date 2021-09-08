// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports","./_commonjsHelpers","./moment"],function(h,d,k){var c=d.createCommonjsModule(function(n,p){(function(e,b){"function"===typeof d.commonjsRequire?b(k.moment$1):b(e.moment)})(d.commonjsGlobal,function(e){var b="jan. feb. mrt. apr. mei jun. jul. aug. sep. okt. nov. dec.".split(" "),l="jan feb mrt apr mei jun jul aug sep okt nov dec".split(" "),f=[/^jan/i,/^feb/i,/^maart|mrt.?$/i,/^apr/i,/^mei$/i,/^jun[i.]?$/i,/^jul[i.]?$/i,/^aug/i,/^sep/i,/^okt/i,/^nov/i,/^dec/i],g=/^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;
return e.defineLocale("nl-be",{months:"januari februari maart april mei juni juli augustus september oktober november december".split(" "),monthsShort:function(a,m){return a?/-MMM-/.test(m)?l[a.month()]:b[a.month()]:b},monthsRegex:g,monthsShortRegex:g,monthsStrictRegex:/^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,monthsShortStrictRegex:/^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,monthsParse:f,longMonthsParse:f,shortMonthsParse:f,
weekdays:"zondag maandag dinsdag woensdag donderdag vrijdag zaterdag".split(" "),weekdaysShort:"zo. ma. di. wo. do. vr. za.".split(" "),weekdaysMin:"zo ma di wo do vr za".split(" "),weekdaysParseExact:!0,longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd D MMMM YYYY HH:mm"},calendar:{sameDay:"[vandaag om] LT",nextDay:"[morgen om] LT",nextWeek:"dddd [om] LT",lastDay:"[gisteren om] LT",lastWeek:"[afgelopen] dddd [om] LT",sameElse:"L"},relativeTime:{future:"over %s",
past:"%s geleden",s:"een paar seconden",ss:"%d seconden",m:"\u00e9\u00e9n minuut",mm:"%d minuten",h:"\u00e9\u00e9n uur",hh:"%d uur",d:"\u00e9\u00e9n dag",dd:"%d dagen",M:"\u00e9\u00e9n maand",MM:"%d maanden",y:"\u00e9\u00e9n jaar",yy:"%d jaar"},dayOfMonthOrdinalParse:/\d{1,2}(ste|de)/,ordinal:function(a){return a+(1===a||8===a||20<=a?"ste":"de")},week:{dow:1,doy:4}})})});c=Object.freeze(Object.assign(Object.create(null),c,{"default":c}));h.nlBe=c});