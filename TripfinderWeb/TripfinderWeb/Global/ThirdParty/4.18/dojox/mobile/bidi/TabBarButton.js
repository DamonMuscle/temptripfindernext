//>>built
define(["dojo/_base/declare","./common","dojo/dom-class"],function(b,d,a){return b(null,{_setBadgeAttr:function(c){this.inherited(arguments);this.badgeObj.setTextDir(this.textDir)},_setIcon:function(c,e){this.inherited(arguments);this.iconDivNode&&!this.isLeftToRight()&&(a.remove(this.iconDivNode,"mblTabBarButtonIconArea"),a.add(this.iconDivNode,"mblTabBarButtonIconAreaRtl"))}})});