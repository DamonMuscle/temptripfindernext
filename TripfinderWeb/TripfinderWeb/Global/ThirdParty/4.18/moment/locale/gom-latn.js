//>>built
(function(d,b){"object"===typeof exports&&"undefined"!==typeof module&&"function"===typeof require?b(require("../moment")):"function"===typeof define&&define.amd?define(["../moment"],b):b(d.moment)})(this,function(d){function b(a,c,e,f){a={s:["thoddea sekondamni","thodde sekond"],ss:[a+" sekondamni",a+" sekond"],m:["eka mintan","ek minut"],mm:[a+" mintamni",a+" mintam"],h:["eka voran","ek vor"],hh:[a+" voramni",a+" voram"],d:["eka disan","ek dis"],dd:[a+" disamni",a+" dis"],M:["eka mhoinean","ek mhoino"],
MM:[a+" mhoineamni",a+" mhoine"],y:["eka vorsan","ek voros"],yy:[a+" vorsamni",a+" vorsam"]};return f?a[e][0]:a[e][1]}return d.defineLocale("gom-latn",{months:{standalone:"Janer Febrer Mars Abril Mai Jun Julai Agost Setembr Otubr Novembr Dezembr".split(" "),format:"Janerachea Febrerachea Marsachea Abrilachea Maiachea Junachea Julaiachea Agostachea Setembrachea Otubrachea Novembrachea Dezembrachea".split(" "),isFormat:/MMMM(\s)+D[oD]?/},monthsShort:"Jan. Feb. Mars Abr. Mai Jun Jul. Ago. Set. Otu. Nov. Dez.".split(" "),
monthsParseExact:!0,weekdays:"Aitar Somar Mongllar Budhvar Birestar Sukrar Son'var".split(" "),weekdaysShort:"Ait. Som. Mon. Bud. Bre. Suk. Son.".split(" "),weekdaysMin:"Ai Sm Mo Bu Br Su Sn".split(" "),weekdaysParseExact:!0,longDateFormat:{LT:"A h:mm [vazta]",LTS:"A h:mm:ss [vazta]",L:"DD-MM-YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY A h:mm [vazta]",LLLL:"dddd, MMMM Do, YYYY, A h:mm [vazta]",llll:"ddd, D MMM YYYY, A h:mm [vazta]"},calendar:{sameDay:"[Aiz] LT",nextDay:"[Faleam] LT",nextWeek:"[Fuddlo] dddd[,] LT",
lastDay:"[Kal] LT",lastWeek:"[Fattlo] dddd[,] LT",sameElse:"L"},relativeTime:{future:"%s",past:"%s adim",s:b,ss:b,m:b,mm:b,h:b,hh:b,d:b,dd:b,M:b,MM:b,y:b,yy:b},dayOfMonthOrdinalParse:/\d{1,2}(er)/,ordinal:function(a,c){switch(c){case "D":return a+"er";default:case "M":case "Q":case "DDD":case "d":case "w":case "W":return a}},week:{dow:0,doy:3},meridiemParse:/rati|sokallim|donparam|sanje/,meridiemHour:function(a,c){12===a&&(a=0);if("rati"===c)return 4>a?a:a+12;if("sokallim"===c)return a;if("donparam"===
c)return 12<a?a:a+12;if("sanje"===c)return a+12},meridiem:function(a,c,e){return 4>a?"rati":12>a?"sokallim":16>a?"donparam":20>a?"sanje":"rati"}})});