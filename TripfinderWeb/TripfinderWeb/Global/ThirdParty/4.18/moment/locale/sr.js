//>>built
(function(d,a){"object"===typeof exports&&"undefined"!==typeof module&&"function"===typeof require?a(require("../moment")):"function"===typeof define&&define.amd?define(["../moment"],a):a(d.moment)})(this,function(d){var a={words:{ss:["sekunda","sekunde","sekundi"],m:["jedan minut","jedne minute"],mm:["minut","minute","minuta"],h:["jedan sat","jednog sata"],hh:["sat","sata","sati"],dd:["dan","dana","dana"],MM:["mesec","meseca","meseci"],yy:["godina","godine","godina"]},correctGrammaticalCase:function(b,
c){return 1===b?c[0]:2<=b&&4>=b?c[1]:c[2]},translate:function(b,c,f){var e=a.words[f];return 1===f.length?c?e[0]:e[1]:b+" "+a.correctGrammaticalCase(b,e)}};return d.defineLocale("sr",{months:"januar februar mart april maj jun jul avgust septembar oktobar novembar decembar".split(" "),monthsShort:"jan. feb. mar. apr. maj jun jul avg. sep. okt. nov. dec.".split(" "),monthsParseExact:!0,weekdays:"nedelja ponedeljak utorak sreda \u010detvrtak petak subota".split(" "),weekdaysShort:"ned. pon. uto. sre. \u010det. pet. sub.".split(" "),
weekdaysMin:"ne po ut sr \u010de pe su".split(" "),weekdaysParseExact:!0,longDateFormat:{LT:"H:mm",LTS:"H:mm:ss",L:"D. M. YYYY.",LL:"D. MMMM YYYY.",LLL:"D. MMMM YYYY. H:mm",LLLL:"dddd, D. MMMM YYYY. H:mm"},calendar:{sameDay:"[danas u] LT",nextDay:"[sutra u] LT",nextWeek:function(){switch(this.day()){case 0:return"[u] [nedelju] [u] LT";case 3:return"[u] [sredu] [u] LT";case 6:return"[u] [subotu] [u] LT";case 1:case 2:case 4:case 5:return"[u] dddd [u] LT"}},lastDay:"[ju\u010de u] LT",lastWeek:function(){return"[pro\u0161le] [nedelje] [u] LT;[pro\u0161log] [ponedeljka] [u] LT;[pro\u0161log] [utorka] [u] LT;[pro\u0161le] [srede] [u] LT;[pro\u0161log] [\u010detvrtka] [u] LT;[pro\u0161log] [petka] [u] LT;[pro\u0161le] [subote] [u] LT".split(";")[this.day()]},
sameElse:"L"},relativeTime:{future:"za %s",past:"pre %s",s:"nekoliko sekundi",ss:a.translate,m:a.translate,mm:a.translate,h:a.translate,hh:a.translate,d:"dan",dd:a.translate,M:"mesec",MM:a.translate,y:"godinu",yy:a.translate},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:7}})});