//>>built
define(["./kernel","../json"],function(a,e){a.fromJson=function(c){return eval("("+c+")")};a._escapeString=e.stringify;a.toJsonIndentStr="\t";a.toJson=function(c,f){return e.stringify(c,function(d,b){return b&&(d=b.__json__||b.json,"function"==typeof d)?d.call(b):b},f&&a.toJsonIndentStr)};return a});