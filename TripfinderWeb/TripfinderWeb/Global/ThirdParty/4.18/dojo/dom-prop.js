//>>built
define("exports ./_base/kernel ./sniff ./_base/lang ./dom ./dom-style ./dom-construct ./_base/connect".split(" "),function(f,p,q,r,h,t,k,l){var g={},u=1,m=p._scopeName+"attrid";f.names={"class":"className","for":"htmlFor",tabindex:"tabIndex",readonly:"readOnly",colspan:"colSpan",frameborder:"frameBorder",rowspan:"rowSpan",textcontent:"textContent",valuetype:"valueType"};f.get=function(a,d){a=h.byId(a);var c=d.toLowerCase();return a[f.names[c]||d]};f.set=function(a,d,c){a=h.byId(a);if(2==arguments.length&&
"string"!=typeof d){for(var b in d)f.set(a,b,d[b]);return a}b=d.toLowerCase();b=f.names[b]||d;if("style"==b&&"string"!=typeof c)return t.set(a,c),a;if("innerHTML"==b)return q("ie")&&a.tagName.toLowerCase()in{col:1,colgroup:1,table:1,tbody:1,tfoot:1,thead:1,tr:1,title:1}?(k.empty(a),a.appendChild(k.toDom(c,a.ownerDocument))):a[b]=c,a;if(r.isFunction(c)){var e=a[m];e||(e=u++,a[m]=e);g[e]||(g[e]={});var n=g[e][b];if(n)l.disconnect(n);else try{delete a[b]}catch(v){}c?g[e][b]=l.connect(a,b,c):a[b]=null;
return a}a[b]=c;return a}});