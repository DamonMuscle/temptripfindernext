//>>built
define("dojo/_base/lang dojo/_base/array ../Theme ./gradientGenerator ./PrimaryColors dojo/colors ./common".split(" "),function(g,h,f,k,l,b){var m={type:"linear",space:"shape",x1:0,y1:0,x2:100,y2:0},n=[{o:0,i:174},{o:.08,i:231},{o:.18,i:237},{o:.3,i:231},{o:.39,i:221},{o:.49,i:206},{o:.58,i:187},{o:.68,i:165},{o:.8,i:128},{o:.9,i:102},{o:1,i:174}],p=h.map("#f00 #0f0 #00f #ff0 #0ff #f0f ./common".split(" "),function(a){var d=g.delegate(m);a=(d.colors=k.generateGradientByIntensity(a,n))[2].color;a.r+=
100;a.g+=100;a.b+=100;a.sanitize();return d});b.ThreeD=l.clone();b.ThreeD.series.shadow={dx:1,dy:1,width:3,color:[0,0,0,.15]};b.ThreeD.next=function(a,d,r){if("bar"==a||"column"==a){var c=this._current%this.seriesThemes.length,e=this.seriesThemes[c],q=e.fill;e.fill=p[c];c=f.prototype.next.apply(this,arguments);e.fill=q;return c}return f.prototype.next.apply(this,arguments)};return b.ThreeD});