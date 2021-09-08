//>>built
define(["dojo/_base/lang","dojo/_base/array","dojo/_base/json","../_base","dojox/string/tokenize"],function(g,l,n,k,p){var e=g.getObject("tag.loop",!0,k);e.CycleNode=g.extend(function(a,b,c,d){this.cyclevars=a;this.name=b;this.contents=c;this.shared=d||{counter:-1,map:{}}},{render:function(a,b){a.forloop&&!a.forloop.counter0&&(this.shared.counter=-1);++this.shared.counter;var c=this.cyclevars[this.shared.counter%this.cyclevars.length],d=this.shared.map;d[c]||(d[c]=new k._Filter(c));c=d[c].resolve(a,
b);this.name&&(a[this.name]=c);this.contents.set(c);return this.contents.render(a,b)},unrender:function(a,b){return this.contents.unrender(a,b)},clone:function(a){return new this.constructor(this.cyclevars,this.name,this.contents.clone(a),this.shared)}});e.IfChangedNode=g.extend(function(a,b,c){this.nodes=a;this._vars=b;this.shared=c||{last:null,counter:0};this.vars=l.map(b,function(d){return new dojox.dtl._Filter(d)})},{render:function(a,b){a.forloop&&(a.forloop.counter<=this.shared.counter&&(this.shared.last=
null),this.shared.counter=a.forloop.counter);var c=this.vars.length?n.toJson(l.map(this.vars,function(f){return f.resolve(a)})):this.nodes.dummyRender(a,b);if(c!=this.shared.last){var d=null===this.shared.last;this.shared.last=c;a=a.push();a.ifchanged={firstloop:d};b=this.nodes.render(a,b);a=a.pop()}else b=this.nodes.unrender(a,b);return b},unrender:function(a,b){return this.nodes.unrender(a,b)},clone:function(a){return new this.constructor(this.nodes.clone(a),this._vars,this.shared)}});e.RegroupNode=
g.extend(function(a,b,c){this._expression=a;this.expression=new k._Filter(a);this.key=b;this.alias=c},{_push:function(a,b,c){c.length&&a.push({grouper:b,list:c})},render:function(a,b){a[this.alias]=[];var c=this.expression.resolve(a);if(c){for(var d=null,f=[],h=0;h<c.length;h++){var m=c[h][this.key];d!==m?(this._push(a[this.alias],d,f),d=m,f=[c[h]]):f.push(c[h])}this._push(a[this.alias],d,f)}return b},unrender:function(a,b){return b},clone:function(a,b){return this}});g.mixin(e,{cycle:function(a,
b){b=b.split_contents();if(2>b.length)throw Error("'cycle' tag requires at least two arguments");if(-1!=b[1].indexOf(",")){var c=b[1].split(",");b=[b[0]];for(var d=0;d<c.length;d++)b.push('"'+c[d]+'"')}if(2==b.length){c=b[b.length-1];if(!a._namedCycleNodes)throw Error("No named cycles in template: '"+c+"' is not defined");if(!a._namedCycleNodes[c])throw Error("Named cycle '"+c+"' does not exist");return a._namedCycleNodes[c]}4<b.length&&"as"==b[b.length-2]?(c=b[b.length-1],b=new e.CycleNode(b.slice(1,
b.length-2),c,a.create_text_node()),a._namedCycleNodes||(a._namedCycleNodes={}),a._namedCycleNodes[c]=b):b=new e.CycleNode(b.slice(1),null,a.create_text_node());return b},ifchanged:function(a,b){b=b.contents.split();var c=a.parse(["endifchanged"]);a.delete_first_token();return new e.IfChangedNode(c,b.slice(1))},regroup:function(a,b){a=p(b.contents,/(\s+)/g,function(c){return c});if(11>a.length||"as"!=a[a.length-3]||"by"!=a[a.length-7])throw Error("Expected the format: regroup list by key as newList");
b=a.slice(2,-8).join("");return new e.RegroupNode(b,a[a.length-5],a[a.length-1])}});return e});