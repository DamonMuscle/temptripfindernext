
(function()
{
	function initialMenu(e, options)
	{
		var menuItems, $target = $(e.currentTarget), $gridStackContainer = $target.closest('.grid-stack-container');
		$target.find(".menu.with-sub-menu > ul").removeClass("sub-context-menu");
		if ($gridStackContainer.length != 0)
		{
			menuItems = $target.data("menu-element").find("> ul > li");
		}
		else
		{
			menuItems = $target.find(".menu.with-sub-menu > ul > li")
			if (menuItems.length === 0)
			{
				menuItems = $target.find(".menu.withsub-menu > ul > li");
			};
		}
		var root = $("<li>");
		root.childMenuItems = [];
		for (var i = 0; i < menuItems.length; i++)
		{
			var menuItem = $(menuItems[i]);
			menuItem.parentMenuItem = root;
			root.childMenuItems.push(menuItem);
			initialSubContextMenu(menuItem, options);
		}
	}

	function initialSubContextMenu(menuItem, options)
	{
		var childMenu = menuItem.children("div").children(".sub-context-menu");
		var childMenuItems = childMenu.children("li");
		menuItem.childMenu = $(childMenu[0]);
		menuItem.hasChildMenu = !!childMenu[0];
		menuItem.childMenuItems = [];

		for (var i = 0; i < childMenuItems.length; i++)
		{
			var childMenuItem = $(childMenuItems[i]);
			menuItem.childMenuItems.push(childMenuItem);
			childMenuItem.parentMenuItem = menuItem;
			initialSubContextMenu(childMenuItem);
		}

		function clearAllTimeOut(menuItem)
		{
			if (menuItem.timer)
			{
				clearTimeout(menuItem.timer);
			}
			if (menuItem.parentMenuItem.timer)
			{
				clearAllTimeOut(menuItem.parentMenuItem);
			}
		}

		// show sub menu when mouseover
		menuItem.off("mouseover").on("mouseover", function(e)
		{
			e.stopPropagation();
			for (var i = 0; i < menuItem.parentMenuItem.childMenuItems.length; i++)
			{
				if (options && options.itemClosing)
				{
					options.itemClosing(menuItem);
				}
				menuItem.parentMenuItem.childMenuItems[i].childMenu.hide();
				if (options && options.itemClosed)
				{
					options.itemClosed(menuItem);
				}
			}
			clearAllTimeOut(menuItem);
			if (!menuItem.hasChildMenu)
			{
				return;
			}
			var left = menuItem.width() + 1;
			if (menuItem.offset().left + left + menuItem.outerWidth() > $(window).width())
			{
				left = 0 - menuItem.childMenu.outerWidth();
			}
			var top = menuItem.position().top + parseInt(menuItem.css("padding-top"));
			var outerHeight = menuItem.childMenu.outerHeight();
			if (menuItem.offset().top + outerHeight > $(window).height())
			{
				top = top + menuItem.height() - outerHeight;
			}
			menuItem.childMenu.css({ position: "absolute", left: left + "px", top: top + "px" });
			if (options && options.itemShowing)
			{
				options.itemShowing(menuItem);
			}
			menuItem.childMenu.show();
			if (options && options.itemShown)
			{
				options.itemShown(menuItem);
			}
			if (menuItem.childMenu.offset().top < 0)
			{
				menuItem.childMenu.offset({ top: 0, left: menuItem.childMenu.offset().left });
			}
		});

		// hide sub menu when mouse leave
		menuItem.off("mouseleave").on("mouseleave", function()
		{
			menuItem.timer = setTimeout(function()
			{
				if (options && options.itemClosing)
				{
					options.itemClosing(menuItem);
				}
				menuItem.childMenu.hide();
				if (options && options.itemClosed)
				{
					options.itemClosed(menuItem);
				}
			}, 500);
		});
	}

	ko.bindingHandlers.dropDownMenu = {
		init: function(element, valueAccessor, allBindings)
		{
			var $element = $(element),
				className = "print-setting-group",
				floatMenuClass = "float-menu",
				btnClassName = "fixed-menu-btn",
				menuClassName = "menu",
				menuIdKey = 'menu-id',
				value = ko.unwrap(valueAccessor());

			$element.addClass(className);
			$element.children().eq(0).addClass(btnClassName);
			$element.children().eq(1).addClass(menuClassName);
			$element.on("click", function(e)
			{
				if ($element.children().eq(0).hasClass("disable"))
				{
					return;
				}
				var $target = $(e.currentTarget),
					isActive = $target.hasClass("active");
				e.stopPropagation();
				$("." + className).removeClass("active");
				hideFloatMenu();
				if (isActive && value && value.toggle)
				{
					return;
				}
				var $menuBtn = $element.children("." + btnClassName);
				if ($menuBtn.hasClass("checked") && $menuBtn.hasClass("active"))
				{
					$menuBtn.removeClass("active");
					return;
				}
				$target.addClass("active");
				var $menu = getMenu($target);
				$menu.css({ "position": "fixed" });
				// make it fixed to fix cut by container bug
				if ($menuBtn.length && $target.hasClass("active"))
				{
					var offset = $menuBtn.offset(),
						height = $menuBtn.height(),
						menuHeight = $menu.height(),
						menuWidth = $menu.width(),
						top = offset.top + height,
						left = offset.left - window.scrollX,
						$window = $(window),
						windowScrollTop = $window.scrollTop();
					if ((offset.top + menuHeight + height) > ($window.height() + windowScrollTop) && offset.top >= menuHeight)
					{
						top = offset.top - menuHeight;
					}
					if ((offset.left + menuWidth) > $window.width())
					{
						left = offset.left - menuWidth + $menuBtn.width();
					}
					top = top - windowScrollTop;
					$menu.css({ left: left, top: top });
				}

				initialMenu(e, value);
				$menu.show();
				// click child item auto close menu
				$menu.off("click.menu").on("click.menu", 'li', function(e)
				{
					e.stopPropagation();
					if ($(e.target).closest(".no-auto-close").length)
					{
						return;
					}
					$element.removeClass("active");
					hideFloatMenu();
				});
			});

			function hideFloatMenu()
			{
				$(`.${floatMenuClass}`).each((i, item) => $(item).remove());
			}

			function getMenu(ele)
			{
				var gridStackContainer = ele.closest('.grid-stack-container');
				if (gridStackContainer.length)
				{
					var menuId = ele.attr(menuIdKey);
					if (!menuId)
					{
						menuId = TF.generateUUID();
						ele.attr(menuIdKey, menuId);
						var menu = ele.find("." + menuClassName);
						ele.data('menu-element', menu);
						menu.attr("id", menuId).css('z-index', 1000000).addClass(floatMenuClass);
						gridStackContainer.append(menu);
						ko.cleanNode(menu[0]);
						ko.applyBindings(ko.dataFor(ele[0]), menu[0]);
						return menu;
					}

					var menu = $(`#${menuId}`);
					if (!menu.length)
					{
						menu = ele.data('menu-element');
						gridStackContainer.append(menu);
						ko.cleanNode(menu[0]);
						ko.applyBindings(ko.dataFor(ele[0]), menu[0]);
					}

					return menu;
				}

				return ele.find("." + menuClassName);
			}

			// click other place auto close menu
			$(document)
				.off("mousedown.closeDropDownMenu")
				.on("mousedown.closeDropDownMenu", function(e)
				{
					removeEvents();
					if ($(e.target).closest("." + className).length || $(e.target).closest("." + floatMenuClass).length)
					{
						return;
					}
					setTimeout(function()
					{
						$("." + className).removeClass("active");
						hideFloatMenu();
					}, 10);
				})
				.off("mousewheel.closeDropDownMenu")
				.on("mousewheel.closeDropDownMenu", function(e)
				{
					if (($(e.target).closest("." + className).length || $(e.target).closest("." + floatMenuClass).length) && !$(e.target).hasClass("fixed-menu-btn"))
					{
						return;
					}
					setTimeout(function()
					{
						$("." + className).removeClass("active");
						hideFloatMenu();
					}, 10);
				});

			// window resize ,recalculate position
			$(window).off("resize.closeDropDownMenu");
			$(window).on("resize.closeDropDownMenu", function()
			{
				$("." + className).children("." + btnClassName).each(function(index, item)
				{
					var $menuBtn = $(item);
					var offset = $menuBtn.offset();
					var height = $menuBtn.height();
					var $menu = $menuBtn.parent().find("." + menuClassName);
					$menu.css("top", (offset.top + height) + "px");
					$menu.css("left", offset.left - window.scrollX + "px");
				});
			});

			ko.utils.domNodeDisposal.addDisposeCallback(element, removeEvents);

			function removeEvents()
			{
				if (!$("." + className).length)
				{
					$(document).off("mousedown.closeDropDownMenu");
					$(document).off("mousewheel.closeDropDownMenu");
					$(window).off("resize.closeDropDownMenu");
					$(`.${floatMenuClass}`).each((i, item) => $(item).remove());
				}
			}

			if ($element.closest('.grid-stack-container').length)
			{
				return { controlsDescendantBindings: true };
			}
		}
	};

})();
