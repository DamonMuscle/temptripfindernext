(function()
{
	createNamespace('TF.RoutingMap').ContextMenu = ContextMenu;
	createNamespace('TF.RoutingMap').MenuItem = MenuItem;

	function createRootItem()
	{
		return new MenuItem(
			{
				header: 'root',
				icon: null,
				parent: null,
				children: [],
				disable: false
			}
		);
	}

	function MenuItem(config)
	{
		this.header = config.header;
		this.title = config.title || config.header;
		this.icon = config.icon;
		this.parent = null;
		this.isToggled = config.isToggled;
		this.toggleStatus = config.toggleStatus;
		this.children = config.children ? config.children : [];
		this.onclick = config.click ? config.click : function()
		{
			return;
		};
		this.config = config;
		this.html = null;
		this.isDevider = !!config.isDevider;
		this.isDisable = config.disable;
		this.sequence = config.sequence;
	}

	function clearAllTimeOut(menuItem)
	{
		if (menuItem.timer)
		{
			clearTimeout(menuItem.timer);
		}
		if (menuItem.parent.timer)
		{
			clearAllTimeOut(menuItem.parent);
		}
	}

	function menuItemMouseOver(menuItem, e)
	{
		e.stopPropagation();
		if (!menuItem.parent)
		{
			return;
		}

		for (var i = 0; i < menuItem.parent.children.length; i++)
		{
			if (menuItem.parent.children[i].isDevider)
			{
				continue;
			}

			menuItem.parent.children[i].childMenuHtml.hide();
		}

		clearAllTimeOut(menuItem);

		if (menuItem.children.length === 0)
		{
			return;
		}
		var ulRect = menuItem.html.children('.text').closest('li')[0].getBoundingClientRect();
		var left = ulRect.right;
		if (left + menuItem.childMenuHtml.outerWidth() > $(window).width())
		{
			left = ulRect.left - menuItem.childMenuHtml.outerWidth();
		}
		var top = ulRect.top;
		var outerHeight = menuItem.childMenuHtml.outerHeight();
		if (menuItem.html.offset().top + outerHeight > $(window).height())
		{
			top = ulRect.top - menuItem.childMenuHtml.height() + ulRect.height;
		}
		menuItem.childMenuHtml.css({ position: "fixed", left: left + "px", top: top + "px" });
		menuItem.childMenuHtml.show();
		if (menuItem.childMenuHtml.offset().top < 0)
		{
			menuItem.childMenuHtml.offset({ top: 0, left: menuItem.childMenuHtml.offset().left });
		}
	}

	function menuItemMouseLeave(menuItem, e)
	{
		menuItem.timer = setTimeout(function()
		{
			menuItem.childMenuHtml.hide();
		}, 500);
	}

	MenuItem.prototype.addChild = function(menuItem)
	{
		this.children.push(menuItem);

		function addChildInternal(parentMenuItem)
		{
			for (var i = 0; i < parentMenuItem.children.length; i++)
			{
				parentMenuItem.children[i].parent = parentMenuItem;
				addChildInternal(parentMenuItem.children[i]);
			}
		}
		addChildInternal(this);

	};

	MenuItem.prototype.addDevider = function()
	{
		var menuItem = new MenuItem(
			{
				isDevider: true
			});
		this.children.push(menuItem);
	};

	MenuItem.prototype.setChildren = function(children)
	{
		this.children = children;
		for (var i = 0; i < children.length; i++)
		{
			children[i].parent = this;
		}
	};

	MenuItem.prototype.onClick = function(fn)
	{
		this.onclick = fn;
	};

	MenuItem.prototype.enum = function(menuItem, fn, scope)
	{
		var self = this;
		for (var i = 0; i < menuItem.children.length; i++)
		{
			var item = menuItem.children[i];
			fn.call(scope || self, item);
			self.enum.call(self, item, fn, scope);
		}
	};

	function ContextMenu(container, openElement)
	{
		this.container = container;
		this.openElement = openElement;
		this.root = createRootItem();
	}

	ContextMenu.prototype.addChild = function(menuItem)
	{
		this.root.addChild(menuItem);
	};

	ContextMenu.prototype.showMenu = function(evt, insertStopsContextMenu, avoidAreaHeight, mapDiv)
	{
		var rootDiv = this.showMenuInternal(this.root);
		this.clearContextMenu(evt);
		this.container.append(rootDiv);
		if (insertStopsContextMenu && this.openElement.length > 0)
		{
			this.setInsertStopsContextMenuPosition(this.openElement, rootDiv);
		}
		else
		{
			this.setContextMenuPosition(evt, rootDiv, avoidAreaHeight);
		}
		this.addArrowForOverFlowScroll(rootDiv);
		$(mapDiv).off('mousedown').on('mousedown', this.clearContextMenu.bind(this));
	};

	ContextMenu.prototype.setInsertStopsContextMenuPosition = function(openElement, contextMenu)
	{
		contextMenu.css({
			position: "fixed",
			left: openElement.offset().left + openElement.width() / 2,
			top: openElement.offset().top + openElement.height() / 2
		});
	};

	ContextMenu.prototype.onClickEvent = function()
	{
		return;
	};

	ContextMenu.prototype.setChildren = function(children)
	{
		this.root.setChildren(children);
	};

	function enumMenuItemsInternal(scope, fn, menuItem)
	{
		for (var i = 0; i < menuItem.children.length; i++)
		{
			var item = menuItem.children[i];
			fn.call(scope, scope, item);
			enumMenuItemsInternal(scope, fn, item);
		}
	}

	ContextMenu.prototype.enumAllMenuItems = function(fn)
	{
		enumMenuItemsInternal(this, fn, this.root);
	};

	ContextMenu.prototype.showMenuInternal = function(menuItem)
	{
		var self = this;
		var outterDiv = $('<div class="menu context-menu right-click-menu"></div>');
		var outterUl = $('<ul/>');
		outterDiv.append(outterUl);
		for (var i = 0; i < menuItem.children.length; i++)
		{
			var child = menuItem.children[i];
			if (child.isDevider)
			{
				var devider = $('<li class="menu-divider"><div class="rule"></div></li>');
				outterUl.append(devider);
				continue;
			}

			var iconCss = "menuIcon";
			if (child.icon)
			{
				iconCss += ' ' + child.icon;
			}

			var listItem = $(`<li title="${child.title}"><div class="${iconCss}"></div></li>`),
				textDiv = $(`<div class="text" ><span class="menu-item-title${child.isDisable ? ' disable' : ''}">${child.header}</span></div>`);
			listItem.append(textDiv);
			child.html = listItem;

			if (child.children.length > 0)
			{
				var arrowItem = $('<span class="k-icon k-i-arrow-e"></span>');
				textDiv.append(arrowItem);
			}
			listItem.on('mouseover', menuItemMouseOver.bind(this, child));
			listItem.on('mouseleave', menuItemMouseLeave.bind(this, child));
			outterUl.append(listItem);

			var returnDiv = this.showMenuInternal(menuItem.children[i]);
			child.childMenuHtml = returnDiv;
			textDiv.append(returnDiv);
			if (!child.isDisable)
			{
				listItem.on('click', null, child, child.onclick.createInterceptor(function(e)
				{
					var menuItem = e.data;
					var result = self.onClickEvent.call(self, menuItem, e);
					if (menuItem.config.click)
					{
						self.removeContextMenu.call(self);
					}

					if (!result && menuItem.config.cancelClick)
					{
						menuItem.config.cancelClick();
					}

					return result;
				}));
			}
		}
		return outterDiv;
	};

	ContextMenu.prototype.initMenuInternalEvent = function(child, listItem, textDiv, outterUl)
	{
		const self = this;
		listItem.on('mouseover', menuItemMouseOver.bind(self, child));
		listItem.on('mouseleave', menuItemMouseLeave.bind(self, child));
		outterUl.append(listItem);

		var returnDiv = self.showMenuInternal(menuItem.children[i]);
		child.childMenuHtml = returnDiv;
		textDiv.append(returnDiv);
		if (!child.isDisable)
		{
			listItem.on('click', null, child, child.onclick.createInterceptor(function(e)
			{
				var menuItemData = e.data;
				var result = self.onClickEvent.call(self, menuItemData, e);
				if (menuItemData.config.click)
				{
					self.removeContextMenu.call(self);
				}
				return result;
			}));
		}
	}

	ContextMenu.prototype.addArrowForOverFlowScroll = function(rootDiv)
	{
		if (rootDiv.children().outerHeight() <= rootDiv.height())
		{
			return;
		}
		var upArrow = $("<div class='up-arrow'></div>");
		var downArrow = $("<div class='down-arrow'></div>");
		var rect = rootDiv[0].getBoundingClientRect();
		var arrowHeight = 18,
			iconBorderWidth = 30;

		upArrow.css({
			left: rect.left + iconBorderWidth,
			right: rect.right,
			width: rect.width - iconBorderWidth,
			top: rect.top
		});
		downArrow.css({
			left: rect.left + iconBorderWidth,
			right: rect.right,
			width: rect.width - iconBorderWidth,
			top: rect.bottom - arrowHeight
		});
		rootDiv.append(upArrow).append(downArrow);
		setVisibleByScroll();
		rootDiv.on("scroll", function()
		{
			setVisibleByScroll();
		});

		var step = 30 * 2;
		upArrow.on("click", function()
		{
			rootDiv.animate({ scrollTop: rootDiv[0].scrollTop - step }, "fast");
		});

		downArrow.on("click", function()
		{
			rootDiv.animate({ scrollTop: rootDiv[0].scrollTop + step }, "fast");
		});

		function setVisibleByScroll()
		{
			rootDiv[0].scrollTop <= 0 ? upArrow.hide() : upArrow.show();
			rootDiv[0].scrollTop >= rootDiv[0].scrollHeight - rootDiv[0].clientHeight ? downArrow.hide() : downArrow.show();
		}
	};

	ContextMenu.prototype.setContextMenuPosition = function(event, contextMenu, avoidAreaHeight)
	{
		var mousePosition = {};
		var menuPosition = {};
		var menuDimension = {
			x: contextMenu.outerWidth(),
			y: contextMenu.outerHeight()
		};

		mousePosition.x = event.clientX;
		mousePosition.y = event.clientY;

		if (mousePosition.x + menuDimension.x > $(window).width())
		{
			menuPosition.x = mousePosition.x - menuDimension.x;
		} else
		{
			menuPosition.x = mousePosition.x;
		}

		menuPosition.y = mousePosition.y;
		var bottomHeight = 28 + 16;

		bottomHeight = Math.max((document.scrollingElement.scrollTop + document.scrollingElement.clientHeight) - (document.scrollingElement.scrollHeight - bottomHeight), 0);
		if (mousePosition.y + menuDimension.y > $(window).height() - bottomHeight)
		{
			if (menuPosition.y - menuDimension.y > 0)
			{
				menuPosition.y = menuPosition.y - menuDimension.y;
			}
			else if ($(window).height() < (contextMenu.outerHeight() + bottomHeight))
			{
				menuPosition.y = 0;
			}
			else
			{
				menuPosition.y = $(window).height() - menuDimension.y - bottomHeight;
			}
		}

		contextMenu.css({
			position: "fixed",
			left: menuPosition.x,
			top: menuPosition.y,
			"overflow": "hidden"
		});

		return menuPosition;
	};

	ContextMenu.prototype.clearContextMenu = function(e)
	{
		if ($(e.target).closest(".menu.context-menu.right-click-menu").length === 0)
		{
			this.removeContextMenu();
		}
	};

	ContextMenu.prototype.removeContextMenu = function()
	{
		var _contextMenu = $(".menu.context-menu.right-click-menu");
		_contextMenu.remove();
	};
}());
