//>>built
define(["dojo","dojox"],function(g,n){return g.declare("dojox.data.util.JsonQuery",null,{useFullIdInQueries:!1,_toJsonQuery:function(a,b){function p(d,e){var q=e.__id;if(q){var c={};c[h.idAttribute]=h.useFullIdInQueries?e.__id:e[h.idAttribute];e=c}for(var k in e){c=e[k];var r=d+(/^[a-zA-Z_][\w_]*$/.test(k)?"."+k:"["+g._escapeString(k)+"]");c&&"object"==typeof c?p(r,c):"*"!=c&&(l+=(f?"":"\x26")+r+(!q&&"string"==typeof c&&a.queryOptions&&a.queryOptions.ignoreCase?"~":"\x3d")+(h.simplifiedQuery?encodeURIComponent(c):
g.toJson(c)),f=!1)}}var f=!0,h=this;if(a.query&&"object"==typeof a.query){var l="[?(";p("@",a.query);l=f?"":l+")]";a.queryStr=l.replace(/\\"|"/g,function(d){return'"'==d?"'":d})}else a.query&&"*"!=a.query||(a.query="");var m=a.sort;if(m){a.queryStr=a.queryStr||("string"==typeof a.query?a.query:"");f=!0;for(i=0;i<m.length;i++)a.queryStr+=(f?"[":",")+(m[i].descending?"\\":"/")+"@["+g._escapeString(m[i].attribute)+"]",f=!1;a.queryStr+="]"}b&&(a.start||a.count)&&(a.queryStr=(a.queryStr||("string"==typeof a.query?
a.query:""))+"["+(a.start||"")+":"+(a.count?(a.start||0)+a.count:"")+"]");return"string"==typeof a.queryStr?(a.queryStr=a.queryStr.replace(/\\"|"/g,function(d){return'"'==d?"'":d}),a.queryStr):a.query},jsonQueryPagination:!0,fetch:function(a){this._toJsonQuery(a,this.jsonQueryPagination);return this.inherited(arguments)},isUpdateable:function(){return!0},matchesQuery:function(a,b){b._jsonQuery=b._jsonQuery||n.json.query(this._toJsonQuery(b));return b._jsonQuery([a]).length},clientSideFetch:function(a,
b){a._jsonQuery=a._jsonQuery||n.json.query(this._toJsonQuery(a));return this.clientSidePaging(a,a._jsonQuery(b))},querySuperSet:function(a,b){return a.query?this.inherited(arguments):b.query}})});