//>>built
define(["dojo/_base/declare","dojo/dom-style"],function(e,f){return e(null,{labelTooltip:function(g,b,a,h,k,l){var c="rtl"==f.get(b.node,"direction"),d="rtl"==b.getTextDir(a);d&&!c&&(a="\x3cspan dir\x3d'rtl'\x3e"+a+"\x3c/span\x3e");!d&&c&&(a="\x3cspan dir\x3d'ltr'\x3e"+a+"\x3c/span\x3e");this.inherited(arguments)},_isRtl:function(){return this.chart.isRightToLeft()}})});