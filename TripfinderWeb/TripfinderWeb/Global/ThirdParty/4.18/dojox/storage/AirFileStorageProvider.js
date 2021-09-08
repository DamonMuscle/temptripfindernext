//>>built
define(["dojo","dijit","dojox","dojo/require!dojox/storage/manager,dojox/storage/Provider"],function(g,n,h){g.provide("dojox.storage.AirFileStorageProvider");g.require("dojox.storage.manager");g.require("dojox.storage.Provider");g.isAIR&&function(){if(!e)var e={};e.File=window.runtime.flash.filesystem.File;e.FileStream=window.runtime.flash.filesystem.FileStream;e.FileMode=window.runtime.flash.filesystem.FileMode;g.declare("dojox.storage.AirFileStorageProvider",[h.storage.Provider],{initialized:!1,
_storagePath:"__DOJO_STORAGE/",initialize:function(){this.initialized=!1;try{var a=e.File.applicationStorageDirectory.resolvePath(this._storagePath);a.exists||a.createDirectory();this.initialized=!0}catch(b){console.debug("dojox.storage.AirFileStorageProvider.initialize:",b)}h.storage.manager.loaded()},isAvailable:function(){return!0},put:function(a,b,c,d){if(0==this.isValidKey(a))throw Error("Invalid key given: "+a);d=d||this.DEFAULT_NAMESPACE;if(0==this.isValidKey(d))throw Error("Invalid namespace given: "+
d);try{this.remove(a,d);var f=e.File.applicationStorageDirectory.resolvePath(this._storagePath+d);f.exists||f.createDirectory();var k=f.resolvePath(a),l=new e.FileStream;l.open(k,e.FileMode.WRITE);l.writeObject(b);l.close()}catch(m){console.debug("dojox.storage.AirFileStorageProvider.put:",m);c(this.FAILED,a,m.toString(),d);return}c&&c(this.SUCCESS,a,null,d)},get:function(a,b){if(0==this.isValidKey(a))throw Error("Invalid key given: "+a);b=b||this.DEFAULT_NAMESPACE;var c=null;a=e.File.applicationStorageDirectory.resolvePath(this._storagePath+
b+"/"+a);a.exists&&!a.isDirectory&&(b=new e.FileStream,b.open(a,e.FileMode.READ),c=b.readObject(),b.close());return c},getNamespaces:function(){var a=[this.DEFAULT_NAMESPACE],b=e.File.applicationStorageDirectory.resolvePath(this._storagePath).getDirectoryListing(),c;for(c=0;c<b.length;c++)b[c].isDirectory&&b[c].name!=this.DEFAULT_NAMESPACE&&a.push(b[c].name);return a},getKeys:function(a){a=a||this.DEFAULT_NAMESPACE;if(0==this.isValidKey(a))throw Error("Invalid namespace given: "+a);var b=[];a=e.File.applicationStorageDirectory.resolvePath(this._storagePath+
a);if(a.exists&&a.isDirectory){a=a.getDirectoryListing();var c;for(c=0;c<a.length;c++)b.push(a[c].name)}return b},clear:function(a){if(0==this.isValidKey(a))throw Error("Invalid namespace given: "+a);a=e.File.applicationStorageDirectory.resolvePath(this._storagePath+a);a.exists&&a.isDirectory&&a.deleteDirectory(!0)},remove:function(a,b){b=b||this.DEFAULT_NAMESPACE;a=e.File.applicationStorageDirectory.resolvePath(this._storagePath+b+"/"+a);a.exists&&!a.isDirectory&&a.deleteFile()},putMultiple:function(a,
b,c,d){if(!1===this.isValidKeyArray(a)||!b instanceof Array||a.length!=b.length)throw Error("Invalid arguments: keys \x3d ["+a+"], values \x3d ["+b+"]");if(null==d||"undefined"==typeof d)d=this.DEFAULT_NAMESPACE;if(0==this.isValidKey(d))throw Error("Invalid namespace given: "+d);this._statusHandler=c;try{for(var f=0;f<a.length;f++)this.put(a[f],b[f],null,d)}catch(k){console.debug("dojox.storage.AirFileStorageProvider.putMultiple:",k);c&&c(this.FAILED,a,k.toString(),d);return}c&&c(this.SUCCESS,a,null,
d)},getMultiple:function(a,b){if(!1===this.isValidKeyArray(a))throw Error("Invalid key array given: "+a);if(null==b||"undefined"==typeof b)b=this.DEFAULT_NAMESPACE;if(0==this.isValidKey(b))throw Error("Invalid namespace given: "+b);for(var c=[],d=0;d<a.length;d++)c[d]=this.get(a[d],b);return c},removeMultiple:function(a,b){b=b||this.DEFAULT_NAMESPACE;for(var c=0;c<a.length;c++)this.remove(a[c],b)},isPermanent:function(){return!0},getMaximumSize:function(){return this.SIZE_NO_LIMIT},hasSettingsUI:function(){return!1},
showSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");},hideSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");}});h.storage.manager.register("dojox.storage.AirFileStorageProvider",new h.storage.AirFileStorageProvider);h.storage.manager.initialize()}()});