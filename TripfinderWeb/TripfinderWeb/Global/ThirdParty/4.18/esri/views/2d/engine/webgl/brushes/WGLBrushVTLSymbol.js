// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../../../chunks/_rollupPluginBabelHelpers ../../../../../core/maybe ../definitions ../../../../../chunks/vec2f32 ../../../../../chunks/vec4f32 ../../vectorTiles/decluttering/config ../number ../enums ./WGLBrush ../GeometryUtils".split(" "),function(L,S,M,A,N,C,O,T,D,E,P){const U=1/65536,Q=[1,1,1,1];E=function(R){function F(){var b=R.apply(this,arguments)||this;b._iconProgramOptions={id:!1,dd:!1,sdf:!1};b._sdfProgramOptions={id:!1,dd:!1};b._spritesTextureSize=N.create();b._haloColor=
C.create();b._sdfColor=C.create();b._color=C.create();return b}S._inheritsLoose(F,R);var z=F.prototype;z.dispose=function(){};z.drawMany=function(b,a){const {drawPhase:m,styleLayerUID:p}=b,e=b.styleLayer;let c;m===D.WGLDrawPhase.HITTEST&&(c=T.u32to4Xu8(p+1));this._drawIcons(b,e,a,c);this._drawText(b,e,a,c)};z._drawIcons=function(b,a,m,p){const {context:e,displayLevel:c,drawPhase:t,painter:w,state:u,styleLayerUID:q}=b;var r=!1;for(var v of m)if(v.layerData.has(q)){var g=v.layerData.get(q);if(0<g.iconPerPageElementsMap.size){r=
!0;break}}if(r){v=a.hasDataDrivenIconSize?1:a.getLayoutValue("icon-size",c);var k=a.hasDataDrivenIconColor?Q:a.getPaintValue("icon-color",c),l=a.hasDataDrivenIconOpacity?1:a.getPaintValue("icon-opacity",c),G=a.getPaintValue("icon-translate",c),H=a.getPaintValue("icon-translate-anchor",c);r=w.getVectorTileProgramCache();l*=k[3];this._color[0]=l*k[0];this._color[1]=l*k[1];this._color[2]=l*k[2];this._color[3]=l;k=a.getLayoutValue("icon-rotation-alignment",c);2===k&&(k=0===a.getLayoutValue("symbol-placement",
c)?1:0);l=0===k;l=a.getLayoutValue("icon-keep-upright",c)&&l;var f=g.isIconSDF,d=a.hasDataDrivenIcon;g=t===D.WGLDrawPhase.HITTEST;var n=this._iconProgramOptions;n.id=g;n.dd=d;n.sdf=f;d=r.getProgram(4,(g?1:0)<<2|(d?1:0)<<1|(f?1:0),n);e.bindProgram(d);f&&(f=a.getPaintValue("icon-halo-color",c),n=a.getPaintValue("icon-halo-width",c),d.setUniform4f("u_outlineColor",f[0],f[1],f[2],f[3]),d.setUniform1f("u_outlineSize",n));d.setUniformMatrix3fv("u_displayViewMat3",0===k?u.displayViewMat3:u.displayMat3);
d.setUniformMatrix3fv("u_displayMat3",1===H?u.displayMat3:u.displayViewMat3);d.setUniform2fv("u_iconTranslation",G);d.setUniform1f("u_depth",a.z);d.setUniform1f("u_mapRotation",P.degToByte(u.rotation));d.setUniform1f("u_keepUpright",l?1:0);d.setUniform1f("u_level",10*c);d.setUniform1i("u_texture",A.VTL_TEXTURE_BINDING_UNIT_SPRITES);d.setUniform1f("u_size",v);d.setUniform4fv("u_color",this._color);d.setUniform1f("u_opacity",1);d.setUniform1f("u_fadeDuration",O.FADE_DURATION/1E3);g&&d.setUniform4fv("u_id",
p);for(const x of m)if(x.layerData.has(q)&&(g=x.layerData.get(q),0!==g.iconPerPageElementsMap.size&&(g.prepareForRendering(e,r),g.updateOpacityInfo(),a=g.iconVertexArrayObject,!M.isNone(a)))){e.bindVAO(a);d.setUniformMatrix3fv("u_dvsMat3",x.transforms.dvs);d.setUniform1f("u_time",(performance.now()-g.lastOpacityUpdate)/1E3);for(const [I,J]of g.iconPerPageElementsMap)this._renderIconRange(b,d,J,I,x)}}};z._renderIconRange=function(b,a,m,p,e){const {context:c,spriteMosaic:t}=b;this._spritesTextureSize[0]=
t.getWidth(p)/4;this._spritesTextureSize[1]=t.getHeight(p)/4;a.setUniform2fv("u_mosaicSize",this._spritesTextureSize);t.bind(c,9729,p,A.VTL_TEXTURE_BINDING_UNIT_SPRITES);c.setStencilTestEnabled(!0);c.setStencilFunction(516,255,255);c.setStencilWriteMask(0);c.drawElements(4,m[1],5125,Uint32Array.BYTES_PER_ELEMENT*m[0]);e.triangleCount+=m[1]/3};z._drawText=function(b,a,m,p){const {context:e,displayLevel:c,drawPhase:t,glyphMosaic:w,painter:u,pixelRatio:q,state:r,styleLayerUID:v}=b;var g=!1;for(var k of m)if(k.layerData.has(v)&&
(b=k.layerData.get(v),0<b.glyphPerPageElementsMap.size)){g=!0;break}if(g){b=a.getLayoutValue("text-rotation-alignment",c);2===b&&(b=0===a.getLayoutValue("symbol-placement",c)?1:0);k=0===b;g=a.getLayoutValue("text-keep-upright",c)&&k;var l=t===D.WGLDrawPhase.HITTEST,G=.8*3/q,H=a.hasDataDrivenTextSize?1:a.getLayoutValue("text-size",c),f=a.hasDataDrivenTextColor?Q:a.getPaintValue("text-color",c),d=a.hasDataDrivenTextOpacity?1:a.getPaintValue("text-opacity",c),n=a.getPaintValue("text-halo-color",c),x=
a.getPaintValue("text-halo-width",c),I=3*a.getPaintValue("text-halo-blur",c),J=3*x;k=u.getVectorTileProgramCache();var y=f[3]*d;this._sdfColor[0]=y*f[0];this._sdfColor[1]=y*f[1];this._sdfColor[2]=y*f[2];this._sdfColor[3]=y;f=n[3]*d;this._haloColor[0]=f*n[0];this._haloColor[1]=f*n[1];this._haloColor[2]=f*n[2];this._haloColor[3]=f;this._glyphTextureSize||(this._glyphTextureSize=N.fromValues(w.width/4,w.height/4));f=a.getPaintValue("text-translate",c);d=a.getPaintValue("text-translate-anchor",c);y=a.hasDataDrivenText;
var K=this._sdfProgramOptions;K.id=l;K.dd=y;var h=k.getProgram(6,(l?1:0)<<1|(y?1:0),K);e.bindProgram(h);h.setUniformMatrix3fv("u_displayViewMat3",0===b?r.displayViewMat3:r.displayMat3);h.setUniformMatrix3fv("u_displayMat3",1===d?r.displayMat3:r.displayViewMat3);h.setUniform2fv("u_textTranslation",f);h.setUniform1f("u_depth",a.z+U);h.setUniform2fv("u_mosaicSize",this._glyphTextureSize);h.setUniform1f("u_mapRotation",P.degToByte(r.rotation));h.setUniform1f("u_keepUpright",g?1:0);h.setUniform1f("u_level",
10*c);h.setUniform1i("u_texture",A.VTL_TEXTURE_BINDING_UNIT_GLYPHS);h.setUniform1f("u_size",H);h.setUniform1f("u_antialiasingWidth",G);h.setUniform1f("u_opacity",1);h.setUniform1f("u_fadeDuration",O.FADE_DURATION/1E3);l&&h.setUniform4fv("u_id",p);for(const B of m)B.layerData.has(v)&&(b=B.layerData.get(v),0!==b.glyphPerPageElementsMap.size&&(b.prepareForRendering(e,k),b.updateOpacityInfo(),a=b.textVertexArrayObject,M.isNone(a)||(e.bindVAO(a),h.setUniformMatrix3fv("u_dvsMat3",B.transforms.dvs),e.setStencilTestEnabled(!0),
e.setStencilFunction(516,255,255),e.setStencilWriteMask(0),a=(performance.now()-b.lastOpacityUpdate)/1E3,h.setUniform1f("u_time",a),b.glyphPerPageElementsMap.forEach((V,W)=>{this._renderGlyphRange(e,V,W,w,h,n[3],x,I,J,B)}))))}};z._renderGlyphRange=function(b,a,m,p,e,c,t,w,u,q){p.bind(b,9729,m,A.VTL_TEXTURE_BINDING_UNIT_GLYPHS);0<c&&0<t&&(e.setUniform4fv("u_color",this._haloColor),e.setUniform1f("u_halo",1),e.setUniform1f("u_edgeDistance",u),e.setUniform1f("u_edgeBlur",w),b.drawElements(4,a[1],5125,
Uint32Array.BYTES_PER_ELEMENT*a[0]),q.triangleCount+=a[1]/3);0<this._sdfColor[3]&&(e.setUniform4fv("u_color",this._sdfColor),e.setUniform1f("u_halo",0),e.setUniform1f("u_edgeDistance",0),e.setUniform1f("u_edgeBlur",0),b.drawElements(4,a[1],5125,Uint32Array.BYTES_PER_ELEMENT*a[0]),q.triangleCount+=a[1]/3)};return F}(E);L.WGLBrushVTLSymbol=E;Object.defineProperty(L,"__esModule",{value:!0})});