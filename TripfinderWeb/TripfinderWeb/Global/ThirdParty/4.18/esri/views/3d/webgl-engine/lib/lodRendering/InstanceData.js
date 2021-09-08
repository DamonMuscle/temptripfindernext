// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../../chunks/_rollupPluginBabelHelpers ../../../../../core/Evented ../../../../../chunks/vec3f64 ../../../../../chunks/vec3 ../../../support/mathUtils ../../../../../chunks/mat4 ../../../../../chunks/mat3f64 ../../../../../chunks/mat4f64 ../../../../../chunks/mat3 ../../../support/buffer/BufferView ../../../support/buffer/InterleavedLayout ../Util".split(" "),function(f,t,p,y,z,A,B,C,u,q,h,D,v){(function(e){e[e.ALLOCATED=1]="ALLOCATED";e[e.ACTIVE=2]="ACTIVE";e[e.VISIBLE=4]=
"VISIBLE";e[e.HIGHLIGHT=8]="HIGHLIGHT";e[e.HIGHLIGHT_ACTIVE=16]="HIGHLIGHT_ACTIVE";e[e.REMOVE=32]="REMOVE";e[e.TRANSFORM_CHANGED=64]="TRANSFORM_CHANGED"})(f.StateFlags||(f.StateFlags={}));let w=function(e){this.localTransform=e.getField("localTransform",h.BufferViewMat4f64);this.globalTransform=e.getField("globalTransform",h.BufferViewMat4f64);this.modelOrigin=e.getField("modelOrigin",h.BufferViewVec3f64);this.model=e.getField("model",h.BufferViewMat3f);this.modelNormal=e.getField("modelNormal",h.BufferViewMat3f);
this.modelScaleFactors=e.getField("modelScaleFactors",h.BufferViewVec2f);this.boundingSphere=e.getField("boundingSphere",h.BufferViewVec4f64);this.color=e.getField("color",h.BufferViewVec4f);this.featureAttribute=e.getField("featureAttribute",h.BufferViewVec4f);this.state=e.getField("state",h.BufferViewUint8);this.lodLevel=e.getField("lodLevel",h.BufferViewUint8)};p=function(e){function n(a,b){var c=e.call(this)||this;c._capacity=0;c._size=0;c._next=0;{let g=D.newLayout().mat4f64("localTransform").mat4f64("globalTransform").vec4f64("boundingSphere").vec3f64("modelOrigin").mat3f("model").mat3f("modelNormal").vec2f("modelScaleFactors");
0<=a.indexOf("color")&&(g=g.vec4f("color"));0<=a.indexOf("featureAttribute")&&(g=g.vec4f("featureAttribute"));a=g=g.u8("state").u8("lodLevel").alignTo(8)}c._layout=a;c._shaderTransformation=b;return c}t._inheritsLoose(n,e);var d=n.prototype;d.addInstance=function(){this._size+1>this._capacity&&this.grow();const a=this.findSlot();this._view.state.set(a,f.StateFlags.ALLOCATED);this._size++;this.emit("instance-added",{index:a});return a};d.removeInstance=function(a){const b=this._view.state;v.assert(0<=
a&&a<this._capacity&&b.get(a)&f.StateFlags.ALLOCATED,"invalid instance handle");this.getStateFlag(a,f.StateFlags.ACTIVE)?this.setStateFlags(a,f.StateFlags.REMOVE):this.freeInstance(a);this.emit("instance-removed",{index:a})};d.freeInstance=function(a){const b=this._view.state;v.assert(0<=a&&a<this._capacity&&b.get(a)&f.StateFlags.ALLOCATED,"invalid instance handle");b.set(a,0);this._size--};d.setLocalTransform=function(a,b,c=!0){this._view.localTransform.setMat(a,b);c&&this.updateModelTransform(a)};
d.getLocalTransform=function(a,b){this._view.localTransform.getMat(a,b)};d.setGlobalTransform=function(a,b,c=!0){this._view.globalTransform.setMat(a,b);c&&this.updateModelTransform(a)};d.getGlobalTransform=function(a,b){this._view.globalTransform.getMat(a,b)};d.updateModelTransform=function(a){const b=this._view;var c=l;const g=k;b.localTransform.getMat(a,x);b.globalTransform.getMat(a,r);const m=B.multiply(r,r,x);z.set(c,m[12],m[13],m[14]);b.modelOrigin.setVec(a,c);q.fromMat4(g,m);b.model.setMat(a,
g);c=A.scaleFromMatrix(l,m);c.sort();b.modelScaleFactors.set(a,0,c[1]);b.modelScaleFactors.set(a,1,c[2]);q.invert(g,g);q.transpose(g,g);b.modelNormal.setMat(a,g);this.setStateFlags(a,f.StateFlags.TRANSFORM_CHANGED);this.emit("instance-transform-changed",{index:a})};d.getModelTransform=function(a,b){const c=this._view;c.model.getMat(a,k);c.modelOrigin.getVec(a,l);b[0]=k[0];b[1]=k[1];b[2]=k[2];b[3]=0;b[4]=k[3];b[5]=k[4];b[6]=k[5];b[7]=0;b[8]=k[6];b[9]=k[7];b[10]=k[8];b[11]=0;b[12]=l[0];b[13]=l[1];b[14]=
l[2];b[15]=1};d.applyShaderTransformation=function(a,b){this._shaderTransformation&&this._shaderTransformation.applyTransform(this,a,b)};d.getCombinedModelTransform=function(a,b){this.getModelTransform(a,b);this._shaderTransformation&&this._shaderTransformation.applyTransform(this,a,b);return b};d.getCombinedLocalTransform=function(a,b){this._view.localTransform.getMat(a,b);this._shaderTransformation&&this._shaderTransformation.applyTransform(this,a,b);return b};d.getCombinedMaxScaleFactor=function(a){let b=
this._view.modelScaleFactors.get(a,1);this._shaderTransformation&&(a=this._shaderTransformation.scaleFactor(l,this,a),b*=Math.max(a[0],a[1],a[2]));return b};d.getCombinedMedianScaleFactor=function(a){let b=this._view.modelScaleFactors.get(a,0);this._shaderTransformation&&(a=this._shaderTransformation.scaleFactor(l,this,a),a.sort(),b*=a[1]);return b};d.getModel=function(a,b){this._view.model.getMat(a,b)};d.setFeatureAttribute=function(a,b){this._view.featureAttribute.setVec(a,b)};d.getFeatureAttribute=
function(a,b){this._view.featureAttribute.getVec(a,b)};d.setColor=function(a,b){this._view.color.setVec(a,b)};d.getColor=function(a,b){this._view.color.getVec(a,b)};d.setVisible=function(a,b){b!==this.getVisible(a)&&(this.setStateFlag(a,f.StateFlags.VISIBLE,b),this.emit("instance-visibility-changed",{index:a}))};d.getVisible=function(a){return this.getStateFlag(a,f.StateFlags.VISIBLE)};d.setHighlight=function(a,b){b!==this.getHighlight(a)&&(this.setStateFlag(a,f.StateFlags.HIGHLIGHT,b),this.emit("instance-highlight-changed",
{index:a}))};d.getHighlight=function(a){return this.getStateFlag(a,f.StateFlags.HIGHLIGHT)};d.getState=function(a){return this._view.state.get(a)};d.getLodLevel=function(a){return this._view.lodLevel.get(a)};d.countFlags=function(a){let b=0;for(let c=0;c<this._capacity;++c)this.getState(c)&a&&++b;return b};d.setStateFlags=function(a,b){const c=this._view.state;b|=c.get(a);c.set(a,b)};d.clearStateFlags=function(a,b){const c=this._view.state;b=c.get(a)&~b;c.set(a,b)};d.setStateFlag=function(a,b,c){c?
this.setStateFlags(a,b):this.clearStateFlags(a,b)};d.getStateFlag=function(a,b){return!!(this._view.state.get(a)&b)};d.grow=function(){const a=Math.max(1024,Math.floor(2*this._capacity)),b=this._layout.createBuffer(a);if(this._buffer){const c=new Uint8Array(this._buffer.buffer);(new Uint8Array(b.buffer)).set(c)}this._capacity=a;this._buffer=b;this._view=new w(this._buffer)};d.findSlot=function(){const a=this._view.state;let b=this._next;for(;a.get(b)&f.StateFlags.ALLOCATED;)b=(b+1)%this._capacity;
this._next=(b+1)%this._capacity;return b};t._createClass(n,[{key:"capacity",get:function(){return this._capacity}},{key:"size",get:function(){return this._size}},{key:"buffer",get:function(){return this._buffer.buffer}},{key:"view",get:function(){return this._view}}]);return n}(p);const l=y.create(),k=C.create(),x=u.create(),r=u.create();f.InstanceData=p;f.View=w;Object.defineProperty(f,"__esModule",{value:!0})});