// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("../../../../chunks/_rollupPluginBabelHelpers ../../../../core/ObjectPool ../../../../core/PooledArray ../../../../chunks/vec3f64 ../../../../chunks/vec3 ../../support/geometryUtils ./Util".split(" "),function(aa,ba,D,l,t,A,R){function J(h,e,a){a=a||h;a[0]=h[0]+e;a[1]=h[1]+e;a[2]=h[2]+e;return a}function K(h,e,a){return!A.frustum.intersectsSphere(a.planes,A.sphere.wrap(e,h))}function ca(h,e,a){if(!B.length)for(var b=0;8>b;++b)B.push({index:0,distance:0});for(b=0;8>b;++b){const c=S[b];B.data[b].index=
b;B.data[b].distance=z(h,e,c)}B.sort((c,d)=>c.distance-d.distance);a.clear();for(h=0;8>h;++h)a.push(B.data[h].index)}function M(h,e){let a=Infinity,b=null;for(let c=0;8>c;++c){const d=z(h,e,T[c]);d<a&&(a=d,b=T[c])}return b}function z(h,e,a){return e*(h[0]*a[0]+h[1]*a[1]+h[2]*a[2])}function U(h){if(Array.isArray(h))return h;N[0]=h;return N}let ea=function(){function h(a,b){this._objectToBoundingSphere=a;this._maximumObjectsPerNode=10;this._maximumDepth=20;this._degenerateObjects=new Set;this._objectCount=
0;b&&(void 0!==b.maximumObjectsPerNode&&(this._maximumObjectsPerNode=b.maximumObjectsPerNode),void 0!==b.maximumDepth&&(this._maximumDepth=b.maximumDepth));this._root=new n(null,l.fromValues(0,0,0),0)}var e=h.prototype;e.destroy=function(){this._degenerateObjects.clear();this._root=null;n.clearPool();N[0]=null;C.prune();B.prune();O.prune()};e.add=function(a,b){a=U(a);b=null==b?a.length:b;this._objectCount+=b;this._grow(a,b);const c=n.acquire();for(let d=0;d<b;d++){const g=a[d];this._isDegenerate(g)?
this._degenerateObjects.add(g):(c.init(this._root),this._add(g,c))}n.release(c)};e.remove=function(a,b){var c=U(a);this._objectCount-=c.length;a=n.acquire();for(const d of c)c=b||this._boundingSphereFromObject(d,V),this._isValidRadius(c.radius)?(a.init(this._root),this._remove(d,c,a)):this._degenerateObjects.delete(d);n.release(a);this._shrink()};e.update=function(a,b){if(this._isValidRadius(b.radius)||!this._isDegenerate(a))this.remove(a,b),this.add(a)};e.forEachAlongRay=function(a,b,c){const d=
A.ray.wrap(a,b);this._forEachNode(this._root,g=>{if(!this._intersectsNode(d,g))return!1;g=g.node;g.terminals.forAll(f=>{this._intersectsObject(d,f)&&c(f)});null!==g.residents&&g.residents.forAll(f=>{this._intersectsObject(d,f)&&c(f)});return!0})};e.forEachAlongRayWithVerticalOffset=function(a,b,c,d){const g=A.ray.wrap(a,b);this._forEachNode(this._root,f=>{if(!this._intersectsNodeWithOffset(g,f,d))return!1;f=f.node;f.terminals.forAll(k=>{this._intersectsObjectWithOffset(g,k,d)&&c(k)});null!==f.residents&&
f.residents.forAll(k=>{this._intersectsObjectWithOffset(g,k,d)&&c(k)});return!0})};e.forEach=function(a){this._forEachNode(this._root,b=>{b=b.node;b.terminals.forAll(a);null!==b.residents&&b.residents.forAll(a);return!0});this._degenerateObjects.forEach(a)};e.forEachDegenerateObject=function(a){this._degenerateObjects.forEach(a)};e.findClosest=function(a,b,c,d,g){return this._findClosest(a,"front-to-back"===b?1:-1,c,d,g)};e.forEachInDepthRange=function(a,b,c,d,g,f,k,q){this._forEachInDepthRange(a,
b,"front-to-back"===c?1:-1,d,g,f,k,q)};e.forEachNode=function(a){this._forEachNode(this._root,b=>a(b.node,b.center,2*b.halfSize))};e._intersectsNode=function(a,b){J(b.center,2*-b.halfSize,u);J(b.center,2*b.halfSize,v);return R.rayBoxTest(a.origin,a.direction,u,v)};e._intersectsNodeWithOffset=function(a,b,c){J(b.center,2*-b.halfSize,u);J(b.center,2*b.halfSize,v);c.applyToMinMax(u,v);return R.rayBoxTest(a.origin,a.direction,u,v)};e._intersectsObject=function(a,b){const c=this._objectToBoundingSphere.getRadius(b);
return 0<c?A.sphere.intersectsRay(A.sphere.wrap(c,this._objectToBoundingSphere.getCenter(b)),a):!0};e._intersectsObjectWithOffset=function(a,b,c){const d=this._objectToBoundingSphere.getRadius(b);return 0<d?A.sphere.intersectsRay(c.applyToBoundingSphere(d,this._objectToBoundingSphere.getCenter(b)),a):!0};e._forEachNode=function(a,b){a=n.acquire().init(a);const c=[a];for(;0!==c.length;){a=c.pop();if(b(a)&&!a.isLeaf())for(let d=0;d<a.node.children.length;d++)a.node.children[d]&&c.push(n.acquire().init(a).advance(d));
n.release(a)}};e._forEachNodeDepthOrdered=function(a,b,c,d=1){a=n.acquire().init(a);const g=[a];for(ca(c,d,O);0!==g.length;){a=g.pop();if(b(a)&&!a.isLeaf())for(c=7;0<=c;--c)d=O.data[c],d>=a.node.children.length||a.node.children[d]&&g.push(n.acquire().init(a).advance(d));n.release(a)}};e._findClosest=function(a,b,c,d,g){let f=Infinity,k=Infinity,q=null;const r=M(a,b);let y=0;const I=p=>{++y;if(!d||d(p)){var x=this._objectToBoundingSphere.getCenter(p),G=this._objectToBoundingSphere.getRadius(p);if(!c||
!K(x,G,c)){x=z(a,b,x);var H=x-G;H<f&&(f=H,k=x+G,q=p)}}};this._forEachNodeDepthOrdered(this._root,p=>{if(null!=g&&y>=g||c&&K(p.center,p.halfSize*W,c))return!1;t.scale(w,r,p.halfSize);t.add(w,w,p.center);if(z(a,b,w)>k)return!1;p=p.node;p.terminals.forAll(x=>{I(x)});null!==p.residents&&p.residents.forAll(x=>{I(x)});return!0},a,b);return q};e._forEachInDepthRange=function(a,b,c,d,g,f,k,q){let r=-Infinity,y=Infinity;const I={setRange:m=>{1===c?(r=Math.max(r,m.near),y=Math.min(y,m.far)):(r=Math.max(r,-m.far),
y=Math.min(y,-m.near))}};I.setRange(d);const p=z(b,c,a),x=M(b,c),G=M(b,-1*c);let H=0;const Y=m=>{++H;if(!k||k(m)){var E=this._objectToBoundingSphere.getCenter(m),P=this._objectToBoundingSphere.getRadius(m),X=z(b,c,E)-p;X-P>y||X+P<r||f&&K(E,P,f)||g(m,I)}};this._forEachNodeDepthOrdered(this._root,m=>{if(null!=q&&H>=q||f&&K(m.center,m.halfSize*W,f))return!1;t.scale(w,x,m.halfSize);t.add(w,w,m.center);if(z(b,c,w)-p>y)return!1;t.scale(w,G,m.halfSize);t.add(w,w,m.center);if(z(b,c,w)-p<r)return!1;m=m.node;
m.terminals.forAll(E=>{Y(E)});null!==m.residents&&m.residents.forAll(E=>{Y(E)});return!0},b,c)};e._remove=function(a,b,c){C.clear();b=c.advanceTo(b,(d,g)=>{C.push(d.node);C.push(g)})?c.node.terminals:c.node.residents;b.removeUnordered(a);if(0===b.length)for(a=C.length-2;0<=a&&this._purge(C.data[a],C.data[a+1]);a-=2);};e._nodeIsEmpty=function(a){if(0!==a.terminals.length)return!1;if(null!==a.residents)return 0===a.residents.length;for(let b=0;b<a.children.length;b++)if(a.children[b])return!1;return!0};
e._purge=function(a,b){0<=b&&(a.children[b]=null);return this._nodeIsEmpty(a)?(null===a.residents&&(a.residents=new D({shrink:!0})),!0):!1};e._add=function(a,b){b.advanceTo(this._boundingSphereFromObject(a,V))?b.node.terminals.push(a):(b.node.residents.push(a),b.node.residents.length>this._maximumObjectsPerNode&&b.depth<this._maximumDepth&&this._split(b))};e._split=function(a){const b=a.node.residents;a.node.residents=null;for(let c=0;c<b.length;c++){const d=n.acquire().init(a);this._add(b.data[c],
d);n.release(d)}};e._grow=function(a,b){0!==b&&(a=this._boundingSphereFromObjects(a,b,(c,d)=>this._boundingSphereFromObject(c,d),F),this._isValidRadius(a.radius)&&!this._fitsInsideTree(a)&&(this._nodeIsEmpty(this._root.node)?(t.copy(this._root.center,a.center),this._root.halfSize=1.25*a.radius):(b=n.acquire(),this._rootBoundsForRootAsSubNode(a,b),this._placingRootViolatesMaxDepth(b)?this._rebuildTree(a,b):this._growRootAsSubNode(b),n.release(b))))};e._rebuildTree=function(a,b){t.copy(Q.center,b.center);
Q.radius=b.halfSize;a=this._boundingSphereFromObjects([a,Q],2,c=>c,da);b=n.acquire().init(this._root);this._root.initFrom(null,a.center,1.25*a.radius);this._forEachNode(b,c=>{this.add(c.node.terminals.data,c.node.terminals.length);null!==c.node.residents&&this.add(c.node.residents.data,c.node.residents.length);return!0});n.release(b)};e._placingRootViolatesMaxDepth=function(a){let b=0;this._forEachNode(this._root,c=>{b=Math.max(b,c.depth);return!0});return b+Math.log(a.halfSize/this._root.halfSize)*
Math.LOG2E>this._maximumDepth};e._rootBoundsForRootAsSubNode=function(a,b){var c=a.radius,d=a.center;a=-Infinity;const g=this._root.center,f=this._root.halfSize;for(var k=0;3>k;k++){var q=Math.max(0,Math.ceil((g[k]-f-(d[k]-c))/(2*f)));const r=Math.max(0,Math.ceil((d[k]+c-(g[k]+f))/(2*f)))+1;a=Math.max(a,Math.pow(2,Math.ceil(Math.log(q+r)*Math.LOG2E)));L[k].min=q;L[k].max=r}for(c=0;3>c;c++)d=L[c].min,k=L[c].max,q=(a-(d+k))/2,d+=Math.ceil(q),k+=Math.floor(q),Z[c]=g[c]-f-d*f*2+(k+d)*f;return b.initFrom(null,
Z,a*f,0)};e._growRootAsSubNode=function(a){const b=this._root.node;t.copy(F.center,this._root.center);F.radius=this._root.halfSize;this._root.init(a);a.advanceTo(F,null,!0);a.node.children=b.children;a.node.residents=b.residents;a.node.terminals=b.terminals};e._shrink=function(){for(;;){const a=this._findShrinkIndex();if(-1===a)break;this._root.advance(a);this._root.depth=0}};e._findShrinkIndex=function(){if(0!==this._root.node.terminals.length||this._root.isLeaf())return-1;let a=null;const b=this._root.node.children;
let c=0,d=0;for(;d<b.length&&null==a;)c=d++,a=b[c];for(;d<b.length;)if(b[d++])return-1;return c};e._isDegenerate=function(a){a=this._objectToBoundingSphere.getRadius(a);return!this._isValidRadius(a)};e._isValidRadius=function(a){return!isNaN(a)&&-Infinity!==a&&Infinity!==a&&0<a};e._fitsInsideTree=function(a){const b=this._root.center,c=this._root.halfSize,d=a.center;return a.radius<=c&&d[0]>=b[0]-c&&d[0]<=b[0]+c&&d[1]>=b[1]-c&&d[1]<=b[1]+c&&d[2]>=b[2]-c&&d[2]<=b[2]+c};e._boundingSphereFromObject=
function(a,b){t.copy(b.center,this._objectToBoundingSphere.getCenter(a));b.radius=this._objectToBoundingSphere.getRadius(a);return b};e._boundingSphereFromObjects=function(a,b,c,d){if(1===b)a=c(a[0],F),t.copy(d.center,a.center),d.radius=a.radius;else{u[0]=Infinity;u[1]=Infinity;u[2]=Infinity;v[0]=-Infinity;v[1]=-Infinity;v[2]=-Infinity;for(let r=0;r<b;r++){var g=c(a[r],F);if(this._isValidRadius(g.radius)){var f=u,k=g.center,q=g.radius;f[0]=Math.min(f[0],k[0]-q);f[1]=Math.min(f[1],k[1]-q);f[2]=Math.min(f[2],
k[2]-q);f=v;k=g.center;g=g.radius;f[0]=Math.max(f[0],k[0]+g);f[1]=Math.max(f[1],k[1]+g);f[2]=Math.max(f[2],k[2]+g)}}t.lerp(d.center,u,v,.5);d.radius=Math.max(v[0]-u[0],v[1]-u[1],v[2]-u[2])/2}return d};aa._createClass(h,[{key:"center",get:function(){return this._root.center}},{key:"size",get:function(){return 2*this._root.halfSize}},{key:"root",get:function(){return this._root.node}},{key:"maximumObjectsPerNode",get:function(){return this._maximumObjectsPerNode}},{key:"maximumDepth",get:function(){return this._maximumDepth}},
{key:"objectCount",get:function(){return this._objectCount}}]);return h}(),n=function(){function h(a,b,c=0){this.center=l.create();this.initFrom(a,b,c,0)}var e=h.prototype;e.init=function(a){return this.initFrom(a.node,a.center,a.halfSize,a.depth)};e.initFrom=function(a=null,b,c=this.halfSize,d=this.depth){this.node=a||h.createEmptyNode();b&&t.copy(this.center,b);this.halfSize=c;this.depth=d;return this};e.advance=function(a){let b=this.node.children[a];b||(b=h.createEmptyNode(),this.node.children[a]=
b);this.node=b;this.halfSize/=2;this.depth++;a=S[a];this.center[0]+=a[0]*this.halfSize;this.center[1]+=a[1]*this.halfSize;this.center[2]+=a[2]*this.halfSize;return this};e.advanceTo=function(a,b,c=!1){for(;;){if(this.isTerminalFor(a))return b&&b(this,-1),!0;if(this.isLeaf()&&!c)return b&&b(this,-1),!1;this.isLeaf()&&(this.node.residents=null);const d=this._childIndex(a);b&&b(this,d);this.advance(d)}};e.isLeaf=function(){return null!=this.node.residents};e.isTerminalFor=function(a){return a.radius>
this.halfSize/2};e._childIndex=function(a){a=a.center;const b=this.center;let c=0;for(let d=0;3>d;d++)b[d]<a[d]&&(c|=1<<d);return c};h.createEmptyNode=function(){return{children:[null,null,null,null,null,null,null,null],terminals:new D({shrink:!0}),residents:new D({shrink:!0})}};h.acquire=function(){return h._pool.acquire()};h.release=function(a){h._pool.release(a)};h.clearPool=function(){h._pool.prune()};return h}();n._pool=new ba(n);const S=[l.fromValues(-1,-1,-1),l.fromValues(1,-1,-1),l.fromValues(-1,
1,-1),l.fromValues(1,1,-1),l.fromValues(-1,-1,1),l.fromValues(1,-1,1),l.fromValues(-1,1,1),l.fromValues(1,1,1)],T=[l.fromValues(-1,-1,-1),l.fromValues(-1,-1,1),l.fromValues(-1,1,-1),l.fromValues(-1,1,1),l.fromValues(1,-1,-1),l.fromValues(1,-1,1),l.fromValues(1,1,-1),l.fromValues(1,1,1)],W=Math.sqrt(3),N=[null],Z=l.create(),w=l.create(),u=l.create(),v=l.create(),C=new D,V={center:l.create(),radius:0},F={center:l.create(),radius:0},Q={center:l.create(),radius:0},da={center:l.create(),radius:0},L=[{min:0,
max:0},{min:0,max:0},{min:0,max:0}],B=new D,O=new D;return ea});