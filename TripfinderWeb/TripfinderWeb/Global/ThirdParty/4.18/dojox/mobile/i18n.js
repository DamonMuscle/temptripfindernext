//>>built
define(["dojo/_base/lang","dojo/i18n","dijit/_WidgetBase"],function(c,e,d){var a={};c.setObject("dojox.mobile.i18n",a);a.load=function(b,f,g){return a.registerBundle(e.getLocalization(b,f,g))};a.registerBundle=function(b){a.bundle||(a.bundle=[]);return c.mixin(a.bundle,b)};a.I18NProperties={mblNoConv:!1};c.extend(d,a.I18NProperties);c.extend(d,{_cv:function(b){return this.mblNoConv||!a.bundle?b:a.bundle[c.trim(b)]||b}});return a});