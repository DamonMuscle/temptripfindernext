// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See https://js.arcgis.com/4.18/esri/copyright.txt for details.
//>>built
define("exports ../../../chunks/_rollupPluginBabelHelpers ../../../core/handleUtils ./snappingUtils ./SnappingCandidate ./SnappingConstraint".split(" "),function(h,m,a,e,f,n){f=function(k){function g({coordinateHelper:b,targetPoint:c,point1:d,point2:p}){return k.call(this,b,c,new n.PlanarCircleConstraint(d,p))||this}m._inheritsLoose(g,k);var l=g.prototype;l.visualizeTargetHints=function(){return a.destroyHandle(null)};l.visualizeReferenceHints=function(b,c,d){return a.handlesGroup([a.destroyHandle(e.createLineSegmentHintFromMap(2,
d,this.constraint.point1,this.coordinateHelper,c,b)),a.destroyHandle(e.createLineSegmentHintFromMap(2,d,this.constraint.point2,this.coordinateHelper,c,b)),a.destroyHandle(e.createQuadHint(this.constraint.point1,d,this.constraint.point2,this.coordinateHelper,c,b))])};return g}(f.SnappingCandidate);h.RightAngleTriangleSnappingCandidate=f;Object.defineProperty(h,"__esModule",{value:!0})});