//>>built
require({cache:{"url:dijit/templates/Fieldset.html":'\x3cfieldset\x3e\r\n\t\x3clegend data-dojo-attach-event\x3d"ondijitclick:_onTitleClick, onkeydown:_onTitleKey"\r\n\t\t\tdata-dojo-attach-point\x3d"titleBarNode, titleNode"\x3e\r\n\t\t\x3cspan data-dojo-attach-point\x3d"arrowNode" class\x3d"dijitInline dijitArrowNode" role\x3d"presentation"\x3e\x3c/span\r\n\t\t\x3e\x3cspan data-dojo-attach-point\x3d"arrowNodeInner" class\x3d"dijitArrowNodeInner"\x3e\x3c/span\r\n\t\t\x3e\x3cspan data-dojo-attach-point\x3d"titleNode, focusNode" class\x3d"dijitFieldsetLegendNode" id\x3d"${id}_titleNode"\x3e\x3c/span\x3e\r\n\t\x3c/legend\x3e\r\n\t\x3cdiv class\x3d"dijitFieldsetContentOuter" data-dojo-attach-point\x3d"hideNode" role\x3d"presentation"\x3e\r\n\t\t\x3cdiv class\x3d"dijitReset" data-dojo-attach-point\x3d"wipeNode" role\x3d"presentation"\x3e\r\n\t\t\t\x3cdiv class\x3d"dijitFieldsetContentInner" data-dojo-attach-point\x3d"containerNode" role\x3d"region"\r\n\t\t\t\t \tid\x3d"${id}_pane" aria-labelledby\x3d"${id}_titleNode"\x3e\r\n\t\t\t\t\x3c!-- nested divs because wipeIn()/wipeOut() doesn\'t work right on node w/padding etc.  Put padding on inner div. --\x3e\r\n\t\t\t\x3c/div\x3e\r\n\t\t\x3c/div\x3e\r\n\t\x3c/div\x3e\r\n\x3c/fieldset\x3e\r\n'}});
define(["dojo/_base/declare","dojo/query!css2","dijit/TitlePane","dojo/text!./templates/Fieldset.html","./a11yclick"],function(b,c,d,e){return b("dijit.Fieldset",d,{baseClass:"dijitFieldset",title:"",open:!0,templateString:e,postCreate:function(){if(!this.title){var a=c("legend",this.containerNode);a.length&&(this.set("title",a[0].innerHTML),a[0].parentNode.removeChild(a[0]))}this.inherited(arguments)}})});