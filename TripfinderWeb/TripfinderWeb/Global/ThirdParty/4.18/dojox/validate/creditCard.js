//>>built
define(["dojo/_base/lang","./_base"],function(g,b){b._cardInfo={mc:"((5[1-5][0-9]{2})|2(22[1-9]|2[3-9][0-9]|[3-6][0-9][0-9]|7[0-1][0-9]|720))[0-9]{12}",ec:"5[1-5][0-9]{14}",vi:"4(?:[0-9]{12}|[0-9]{15})",ax:"3[47][0-9]{13}",dc:"3(?:0[0-5][0-9]{11}|[68][0-9]{12})",bl:"3(?:0[0-5][0-9]{11}|[68][0-9]{12})",di:"6011[0-9]{12}",jcb:"(?:3[0-9]{15}|(2131|1800)[0-9]{11})",er:"2(?:014|149)[0-9]{11}"};b.isValidCreditCard=function(a,c){return("er"==c.toLowerCase()||b.isValidLuhn(a))&&b.isValidCreditCardNumber(a,
c.toLowerCase())};b.isValidCreditCardNumber=function(a,c){a=String(a).replace(/[- ]/g,"");var d=b._cardInfo,e=[];if(c)return(c="^"+d[c.toLowerCase()]+"$")?!!a.match(c):!1;for(var f in d)a.match("^"+d[f]+"$")&&e.push(f);return e.length?e.join("|"):!1};b.isValidCvv=function(a,c){g.isString(a)||(a=String(a));switch(c.toLowerCase()){case "mc":case "ec":case "vi":case "di":var d="###";break;case "ax":d="####"}return!!d&&a.length&&b.isNumberFormat(a,{format:d})};return b});