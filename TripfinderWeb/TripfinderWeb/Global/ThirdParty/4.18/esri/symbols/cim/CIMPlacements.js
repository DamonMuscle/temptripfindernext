// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define(["exports"],function(d){let f=function(){function c(){this.setIdentity()}var b=c.prototype;b.getAngle=function(){if(null==this.rz||0===this.rz&&1!==this.rz_c&&0!==this.rz_s)this.rz=Math.atan2(this.rz_s,this.rz_c);return this.rz};b.setIdentity=function(){this.tz=this.ty=this.tx=0;this.s=1;this.rz=this.ry=this.rx=0;this.rz_c=1;this.rz_s=0};b.setTranslate=function(a,e){this.tx=a;this.ty=e};b.setTranslateZ=function(a){this.tz=a};b.setRotateCS=function(a,e){this.rz=void 0;this.rz_c=a;this.rz_s=
e};b.setRotate=function(a){this.rz=a;this.rz_s=this.rz_c=void 0};b.setRotateY=function(a){this.ry=a};b.setScale=function(a){this.s=a};b.setMeasure=function(a){this.m=a};return c}(),g=function(){function c(){}c.prototype.next=function(){return null};return c}();d.EmptyPlacementCursor=g;d.Placement=f;Object.defineProperty(d,"__esModule",{value:!0})});