
(function()
{
	createNamespace("TF.RoutingMap").ContextMenuBase = ContextMenuBase;

	function ContextMenuBase(eventsManager, dataModel)
	{
		var self = this;
		this.clickPosition = null;
		TF.RoutingMap.EventBase.call(self, eventsManager, dataModel);
	}

	ContextMenuBase.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	ContextMenuBase.prototype.constructor = ContextMenuBase;

	// ContextMenuBase.prototype.setContextMenuPosition = function(event, contextMenu)
	// {
	// 	var mousePosition = {};
	// 	var menuPosition = {};
	// 	var menuDimension = {};

	// 	menuDimension.x = contextMenu.outerWidth();
	// 	menuDimension.y = contextMenu.outerHeight();
	// 	mousePosition.x = event.pageX;
	// 	mousePosition.y = event.pageY;

	// 	if (mousePosition.x + menuDimension.x > $(window).width() + $(window).scrollLeft())
	// 	{
	// 		menuPosition.x = mousePosition.x - menuDimension.x;
	// 	} else
	// 	{
	// 		menuPosition.x = mousePosition.x;
	// 	}

	// 	if (mousePosition.y + menuDimension.y > $(window).height() + $(window).scrollTop())
	// 	{
	// 		menuPosition.y = mousePosition.y - menuDimension.y;
	// 	} else
	// 	{
	// 		menuPosition.y = mousePosition.y;
	// 	}

	// 	contextMenu.css({
	// 		position: "fixed",
	// 		left: menuPosition.x,
	// 		top: menuPosition.y
	// 	});

	// 	return menuPosition;
	// }

	// ContextMenuBase.prototype.compare = function(a, b)
	// {
	// 	return 0;
	// }

	ContextMenuBase.prototype.clearContextMenu = function(e)
	{
		var self = this;
		if ($(e.target).closest(".menu.context-menu.right-click-menu").length == 0)
		{
			this.removeContextMenu();
		}
	}

	ContextMenuBase.prototype.removeContextMenu = function()
	{
		var _contextMenu = $(".menu.context-menu.right-click-menu");
		_contextMenu.remove();
	}

	// ContextMenuBase.prototype.initialSubContextMenu = function(menuItem)
	// {
	// 	var childMenu = menuItem.children("div").children(".sub-context-menu");
	// 	var childMenuItems = childMenu.children("li");
	// 	menuItem.childMenu = $(childMenu[0]);
	// 	menuItem.hasChildMenu = !!childMenu[0];
	// 	menuItem.childMenuItems = [];

	// 	for (var i = 0; i < childMenuItems.length; i++)
	// 	{
	// 		var childMenuItem = $(childMenuItems[i]);
	// 		menuItem.childMenuItems.push(childMenuItem);
	// 		childMenuItem.parentMenuItem = menuItem;
	// 		this.initialSubContextMenu(childMenuItem);
	// 	}

	// 	menuItem.on("mouseover", function(e)
	// 	{
	// 		e.stopPropagation();
	// 		for (var i = 0; i < menuItem.parentMenuItem.childMenuItems.length; i++)
	// 		{
	// 			menuItem.parentMenuItem.childMenuItems[i].childMenu.hide();
	// 		}
	// 		if (menuItem.parentMenuItem.timer)
	// 		{
	// 			clearTimeout(menuItem.parentMenuItem.timer);
	// 		}
	// 		if (menuItem.timer)
	// 		{
	// 			clearTimeout(menuItem.timer);
	// 		}
	// 		if (!menuItem.hasChildMenu) return;
	// 		var left = menuItem.children('.text').width() + 1;
	// 		if (menuItem.offset().left + left + menuItem.outerWidth() > $(window).width())
	// 		{
	// 			left = 0 - menuItem.childMenu.outerWidth() - parseInt(menuItem.parent().parent().css('border-left-width')) - parseInt(menuItem.parent().css('border-left-width'));
	// 		}
	// 		var top = menuItem.position().top + parseInt(menuItem.css('padding-top'));
	// 		var outerHeight = menuItem.childMenu.outerHeight();
	// 		if (menuItem.offset().top + outerHeight > $(window).height())
	// 		{
	// 			top = top + menuItem.height() - outerHeight;
	// 		}
	// 		menuItem.childMenu.css({ position: "absolute", left: left + "px", top: top + "px" });
	// 		menuItem.childMenu.show();
	// 		if (menuItem.childMenu.offset().top < 0)
	// 		{
	// 			menuItem.childMenu.offset({ top: 0, left: menuItem.childMenu.offset().left });
	// 		}
	// 	});

	// 	menuItem.on("mouseleave", function(e)
	// 	{
	// 		menuItem.timer = setTimeout(function() { menuItem.childMenu.hide(); }, 500);
	// 	});
	// }

	// ContextMenuBase.prototype.initialContextMenu = function()
	// {
	// 	var self = this;
	// 	var _contextMenu = $(".menu.context-menu.right-click-menu");
	// 	$(".menu.right-click-menu.context-menu > ul").removeClass("sub-context-menu");
	// 	var menuItems = $(".menu.right-click-menu.context-menu > ul > li");
	// 	var root = $('<li>');
	// 	root.childMenuItems = [];
	// 	for (var i = 0; i < menuItems.length; i++)
	// 	{
	// 		var menuItem = $(menuItems[i]);
	// 		menuItem.parentMenuItem = root;
	// 		root.childMenuItems.push(menuItem);
	// 		this.initialSubContextMenu(menuItem);
	// 	}
	// 	setTimeout(function()
	// 	{
	// 		self.setContextMenuPosition(self.clickPosition, _contextMenu);
	// 	});
	// 	_contextMenu.delegate("li", "mouseup", function(e)
	// 	{
	// 		var $target = $(e.target);
	// 		var $clickable = $target.closest(".sub-content[data-bind],li[data-bind]");
	// 		if (($clickable.attr("data-bind") || '').indexOf("click") >= 0)
	// 		{
	// 			setTimeout(function()
	// 			{
	// 				self.removeContextMenu();
	// 			});
	// 		}
	// 	})
	// 	$('.map-page').off('mousedown').on('mousedown', self.clearContextMenu.bind(self));
	// }

	// ContextMenuBase.prototype.showContextMenu = function(e)
	// {
	// 	this.onMapClick(e);
	// }

	// ContextMenuBase.prototype.onMapInitialized = function()
	// {
	// 	this.getMap().on('mouse-up', this.onMapClick.bind(this));
	// }

})();
