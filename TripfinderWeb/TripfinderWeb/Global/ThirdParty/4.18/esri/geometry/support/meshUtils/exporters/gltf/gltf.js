// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../../chunks/vec3f64 ../../../../../chunks/vec3 ../../../../../chunks/quatf64 ../../../MeshMaterialMetallicRoughness ../../georeference ../../../../../chunks/quat ./types ./buffer ./geometry ./imageutils".split(" "),function(y,q,z,A,E,F,G,d,B,C,x){let H=function(){function D(a,b,c){this.params={};this.materialMap=[];this.gltf={asset:{version:"2.0",copyright:a.copyright,generator:a.generator},extras:{options:b,binChunkBuffer:null,promises:[]}};c&&(this.params=c);this.addScenes(a)}
var n=D.prototype;n.addScenes=function(a){this.gltf.scene=a.defaultScene;const b=this.gltf.extras.options.bufferOutputType===d.BufferOutputType.GLB||this.gltf.extras.options.imageOutputType===d.ImageOutputType.GLB;b&&(this.gltf.extras.binChunkBuffer=new B.Buffer(this.gltf));a.forEachScene(c=>{this.addScene(c)});b&&this.gltf.extras.binChunkBuffer.finalize()};n.addScene=function(a){this.gltf.scenes||(this.gltf.scenes=[]);const b={};a.name&&(b.name=a.name);a.forEachNode(c=>{b.nodes||(b.nodes=[]);c=this.addNode(c);
b.nodes.push(c)});this.gltf.scenes.push(b)};n.addNode=function(a){this.gltf.nodes||(this.gltf.nodes=[]);const b={};a.name&&(b.name=a.name);var c=a.translation;z.exactEquals(c,q.ZEROS)||(b.translation=q.clone(c));c=a.rotation;G.exactEquals(c,A.IDENTITY)||(b.rotation=A.clone(c));c=a.scale;z.exactEquals(c,q.ONES)||(b.scale=q.clone(c));a.mesh&&a.mesh.vertexAttributes.position?b.mesh=this.addMesh(a.mesh):a.forEachNode(e=>{b.children||(b.children=[]);e=this.addNode(e);b.children.push(e)});a=this.gltf.nodes.length;
this.gltf.nodes.push(b);return a};n.addMesh=function(a){this.gltf.meshes||(this.gltf.meshes=[]);const b={primitives:[]};var c=this.gltf.extras.options.bufferOutputType===d.BufferOutputType.GLB;let e;e=c?this.gltf.extras.binChunkBuffer:new B.Buffer(this.gltf);a=a.clone();this.params.origin||(this.params.origin=C.computeOrigin(a));a.rotate(-90,0,0,{origin:this.params.origin});C.smoothNormalsMesh(a);var k=F.ungeoreference(a.vertexAttributes,this.params.origin,{geographic:this.params.geographic,unit:"meters"});
a.vertexAttributes.position=k.position;a.vertexAttributes.normal=k.normal;a.vertexAttributes.tangent=k.tangent;k=e.addBufferView(d.ComponentType.FLOAT,d.DataType.VEC3,d.TargetBuffer.ARRAY_BUFFER);let g;a.vertexAttributes.normal&&(g=e.addBufferView(d.ComponentType.FLOAT,d.DataType.VEC3,d.TargetBuffer.ARRAY_BUFFER));let l;a.vertexAttributes.uv&&(l=e.addBufferView(d.ComponentType.FLOAT,d.DataType.VEC2,d.TargetBuffer.ARRAY_BUFFER));let m;a.vertexAttributes.tangent&&(m=e.addBufferView(d.ComponentType.FLOAT,
d.DataType.VEC4,d.TargetBuffer.ARRAY_BUFFER));let f;a.vertexAttributes.color&&(f=e.addBufferView(d.ComponentType.UNSIGNED_BYTE,d.DataType.VEC4,d.TargetBuffer.ARRAY_BUFFER));k.startAccessor("POSITION");g&&g.startAccessor("NORMAL");l&&l.startAccessor("TEXCOORD_0");m&&m.startAccessor("TANGENT");f&&f.startAccessor("COLOR_0");var p=a.vertexAttributes.position.length/3;for(let h=0;h<p;++h)k.push(a.vertexAttributes.position[3*h]),k.push(a.vertexAttributes.position[3*h+1]),k.push(a.vertexAttributes.position[3*
h+2]),g&&(g.push(a.vertexAttributes.normal[3*h]),g.push(a.vertexAttributes.normal[3*h+1]),g.push(a.vertexAttributes.normal[3*h+2])),l&&(l.push(a.vertexAttributes.uv[2*h]),l.push(a.vertexAttributes.uv[2*h+1])),m&&(m.push(a.vertexAttributes.tangent[4*h]),m.push(a.vertexAttributes.tangent[4*h+1]),m.push(a.vertexAttributes.tangent[4*h+2]),m.push(a.vertexAttributes.tangent[4*h+3])),f&&(f.push(a.vertexAttributes.color[4*h]),f.push(a.vertexAttributes.color[4*h+1]),f.push(a.vertexAttributes.color[4*h+2]),
f.push(a.vertexAttributes.color[4*h+3]));p=k.endAccessor();p=this.addAccessor(k.index,p);if(g){var r=g.endAccessor();r=this.addAccessor(g.index,r)}if(l){var t=l.endAccessor();t=this.addAccessor(l.index,t)}if(m){var u=m.endAccessor();u=this.addAccessor(m.index,u)}if(f){var v=f.endAccessor();v=this.addAccessor(f.index,v)}let w;a.components&&0<a.components.length&&a.components[0].faces?(w=e.addBufferView(d.ComponentType.UNSIGNED_INT,d.DataType.SCALAR,d.TargetBuffer.ELEMENT_ARRAY_BUFFER),this.addMeshVertexIndexed(w,
a.components,b,p,r,t,u,v)):this.addMeshVertexNonIndexed(a.components,b,p,r,t,u,v);k.finalize();g&&g.finalize();l&&l.finalize();m&&m.finalize();w&&w.finalize();f&&f.finalize();c||e.finalize();c=this.gltf.meshes.length;this.gltf.meshes.push(b);return c};n.addMaterial=function(a){if(null!==a){var b=this.materialMap.indexOf(a);if(-1!==b)return b;this.gltf.materials||(this.gltf.materials=[]);b={};switch(a.alphaMode){case "mask":b.alphaMode=d.AlphaMode.MASK;break;case "auto":case "blend":b.alphaMode=d.AlphaMode.BLEND}.5!==
a.alphaCutoff&&(b.alphaCutoff=a.alphaCutoff);a.doubleSided&&(b.doubleSided=a.doubleSided);b.pbrMetallicRoughness={};var c=e=>{e=e.toRgba();e[0]=Math.pow(e[0]/255,2.1);e[1]=Math.pow(e[1]/255,2.1);e[2]=Math.pow(e[2]/255,2.1);return e};a.color&&(b.pbrMetallicRoughness.baseColorFactor=c(a.color));a.colorTexture&&(b.pbrMetallicRoughness.baseColorTexture={index:this.addTexture(a.colorTexture)});a.normalTexture&&(b.normalTexture={index:this.addTexture(a.normalTexture)});a instanceof E?(a.emissiveTexture&&
(b.emissiveTexture={index:this.addTexture(a.emissiveTexture)}),a.emissiveColor&&(c=c(a.emissiveColor),b.emissiveFactor=[c[0],c[1],c[2]]),a.occlusionTexture&&(b.occlusionTexture={index:this.addTexture(a.occlusionTexture)}),a.metallicRoughnessTexture&&(b.pbrMetallicRoughness.metallicRoughnessTexture={index:this.addTexture(a.metallicRoughnessTexture)}),b.pbrMetallicRoughness.metallicFactor=a.metallic,b.pbrMetallicRoughness.roughnessFactor=a.roughness):(b.pbrMetallicRoughness.metallicFactor=1,b.pbrMetallicRoughness.roughnessFactor=
1);c=this.gltf.materials.length;this.gltf.materials.push(b);this.materialMap.push(a);return c}};n.addTexture=function(a){this.gltf.textures||(this.gltf.textures=[]);a={sampler:this.addSampler(a),source:this.addImage(a)};const b=this.gltf.textures.length;this.gltf.textures.push(a);return b};n.addImage=function(a){this.gltf.images||(this.gltf.images=[]);const b={};if(a.url)b.uri=a.url;else{b.extras=a.data;for(let c=0;c<this.gltf.images.length;++c)if(a.data===this.gltf.images[c].extras)return c;switch(this.gltf.extras.options.imageOutputType){case d.ImageOutputType.GLB:{const c=
this.gltf.extras.binChunkBuffer.addBufferView(d.ComponentType.UNSIGNED_BYTE,d.DataType.SCALAR);c.writeAsync(x.imageToArrayBuffer(a.data)).then(()=>{c.finalize()});b.bufferView=c.index;b.mimeType="image/png";break}case d.ImageOutputType.DataURI:b.uri=x.imageToDataURI(a.data);break;default:this.gltf.extras.promises.push(x.imageToArrayBuffer(a.data).then(c=>{b.uri=c}))}}a=this.gltf.images.length;this.gltf.images.push(b);return a};n.addSampler=function(a){this.gltf.samplers||(this.gltf.samplers=[]);var b=
10497;let c=10497;if("string"===typeof a.wrap)switch(a.wrap){case "clamp":c=b=33071;break;case "mirror":c=b=33648}else{switch(a.wrap.vertical){case "clamp":c=33071;break;case "mirror":c=33648}switch(a.wrap.horizontal){case "clamp":b=33071;break;case "mirror":b=33648}}a={wrapS:b,wrapT:c};for(b=0;b<this.gltf.samplers.length;++b)if(JSON.stringify(a)===JSON.stringify(this.gltf.samplers[b]))return b;b=this.gltf.samplers.length;this.gltf.samplers.push(a);return b};n.addAccessor=function(a,b){this.gltf.accessors||
(this.gltf.accessors=[]);a={bufferView:a,byteOffset:b.byteOffset,componentType:b.componentType,count:b.count,type:b.type,min:b.min,max:b.max,name:b.name};b.normalized&&(a.normalized=!0);b=this.gltf.accessors.length;this.gltf.accessors.push(a);return b};n.addMeshVertexIndexed=function(a,b,c,e,k,g,l,m){for(const f of b){a.startAccessor("INDICES");for(b=0;b<f.faces.length;++b)a.push(f.faces[b]);b=a.endAccessor();b={attributes:{POSITION:e},indices:this.addAccessor(a.index,b),material:this.addMaterial(f.material)};
k&&"flat"!==f.shading&&(b.attributes.NORMAL=k);g&&(b.attributes.TEXCOORD_0=g);l&&"flat"!==f.shading&&(b.attributes.TANGENT=l);m&&(b.attributes.COLOR_0=m);c.primitives.push(b)}};n.addMeshVertexNonIndexed=function(a,b,c,e,k,g,l){c={attributes:{POSITION:c}};e&&(c.attributes.NORMAL=e);k&&(c.attributes.TEXCOORD_0=k);g&&(c.attributes.TANGENT=g);l&&(c.attributes.COLOR_0=l);a&&(c.material=this.addMaterial(a[0].material));b.primitives.push(c)};return D}();y.GLTF=H;Object.defineProperty(y,"__esModule",{value:!0})});