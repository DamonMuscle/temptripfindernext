(function()
{
	var namespace = createNamespace("TF.ContextMenu");
	var menusNeedHideLeftBarTopBorder = [
		'workspace/grid/filtercontextmenu',
		'workspace/grid/layoutcontextmenu',
		'workspace/grid/overflowmenu',
		'workspace/grid/newgridwithselectedrecordsmenu',
		'workspace/grid/editkendocolumnformobile'
	];

	namespace.TemplateContextMenu = TemplateContextMenu;

	function TemplateContextMenu(templateName, menuViewModel, done)
	{
		namespace.BaseContextMenu.apply(arguments);

		this.menuViewModel = menuViewModel;
		this.done = done;

		this.afterRender = function(elements, viewModel)
		{
			this.loopInit(this.$menuContainer);
			this.setMenuMaxHeight(this.$menuContainer);
			this.setMenuPosition(this.$menuContainer, this.target);

			var mobileHelper = TF.ContextMenuMobileHelper;
			if (TF.isPhoneDevice && !tf.isViewfinder)
			{
				var specialMenuClass = mobileHelper.getSpecialMenuClass(this.$menuContainer);
				if (specialMenuClass)
				{
					mobileHelper.setMenuHeightForPhoneDevice(this.$menuContainer, specialMenuClass);
					mobileHelper.setMenuLeftForPhoneDevice(this.$menuContainer);
					mobileHelper.setMenuTopForPhoneDevice(this.$menuContainer);
					this._$container.off("mouseout");
					this._$container.off("mouseover");
				}
			}
			if (this.menuViewModel.afterRender)
			{
				this.menuViewModel.afterRender(elements, viewModel);
			}
		}.bind(this);

		this.render = function($wrapper, target)
		{
			this.target = target;
			var $container = this.createContainer($wrapper, target);
			this.$container = $container;
			this.templateName = 'workspace/documenttabmenu';
			var $templateWrapper = $('<div data-bind="template:{name:\'' + templateName + '\''
				+ ',afterRender:afterRender,data:menuViewModel}" style="display:none;background-color:#FFF"></div>');

			if (TF.isPhoneDevice)
			{
				$templateWrapper.addClass('is-phone-device');
			}
			else if (TF.isMobileDevice)
			{
				$templateWrapper.addClass('is-mobile-device');
			}
			this.$menuContainer = $templateWrapper;

			if (TF.isPhoneDevice && Enumerable.From(menusNeedHideLeftBarTopBorder)
				.Where(function(menuName) { return menuName === templateName }).ToArray().length > 0)
			{
				$templateWrapper.addClass("hide-left-bar-top-border");
			}

			$container.append($templateWrapper);
			ko.applyBindings(this, $templateWrapper[0]);
		};
	}

	TemplateContextMenu.prototype = Object.create(namespace.BaseContextMenu.prototype);

	TemplateContextMenu.prototype.constructor = TemplateContextMenu;

	TemplateContextMenu.prototype.loopInit = function(el)
	{
		function showMenu($menu, $parent)
		{
			clearTimeout($menu.timer);
			var left = $parent.position().left + $parent.width();
			if (TF.isPhoneDevice || TF.isIOS)
			{
				left = left - $menu.outerWidth();
			}
			else
			{
				if ($parent.offset().left + left + $menu.outerWidth() > $(window).width())
				{
					left = 0 - $menu.outerWidth();
				}
			}
			var top = $parent.position().top;
			var outerHeight = $menu.outerHeight();
			if ($parent.offset().top + outerHeight > $(window).height())
			{
				top = top + $parent.height() - outerHeight;
			}
			if (TF.isMobileDevice)
			{
				$menu.css({ position: "absolute", left: left + "px", top: top + "px", "z-index": 1 });
			}
			else
			{
				$menu.css({ position: "absolute", left: left + "px", top: top + "px" });
			}
			$menu.show();
			if ($menu.offset().top < 0)
			{
				$menu.offset({ top: 0, left: $menu.offset().left });
			}
		}

		var arrayOfMenuItem = [], menuItem;
		$.merge(arrayOfMenuItem, $(el).find(".menu-item"));
		while (menuItem = arrayOfMenuItem.shift())
		{
			if (menuItem)
			{
				var $menuItem = $(menuItem);
				if ($menuItem.find(".tf-contextmenu").length > 0)
				{
					(function()
					{
						var $parent = $menuItem;
						var $menu = $($menuItem.find(".tf-contextmenu").get(0));
						$menu.hide();

						$.merge(arrayOfMenuItem, $menu.find(".menu-item"));
						if (TF.isMobileDevice)
						{
							$menuItem.on("click", function(e)
							{
								showMenu($menu, $parent)
							});
						}
						else
						{
							$menuItem.on("mouseover", function(e)
							{
								showMenu($menu, $parent)
							});
						}

						$menuItem.on("mouseleave", function(e)
						{
							clearTimeout($menu.timer);
							//TODO: close clear timeout
							if ($menu.parent().hasClass("menu-item"))
							{
								$menu.hide();
							}
							else
							{
								$menu.timer = setTimeout(function() { $menu.hide(); }, 500);
							}
						});
					})();
				}
			}
		}
	};

	function isSplitPanelOpenedOnMobileDevicePortraitMode()
	{
		return TF.isMobileDevice &&
			TF.isPortrait() &&
			$('.right-panel').height() > 0;
	}

	TemplateContextMenu.prototype.setMenuMaxHeight = function(el)
	{
		var arrayOfContextMenu = [], contextMenu;
		$.merge(arrayOfContextMenu, $(el).find(".tf-contextmenu"));
		while (contextMenu = arrayOfContextMenu.shift())
		{
			if (contextMenu)
			{
				var $contextMenu = $(contextMenu);
				var dynamicMaxHeight = $(window).height() - 300;
				if (isSplitPanelOpenedOnMobileDevicePortraitMode())
				{
					var iconRowHeight = $('.iconrow').outerHeight();
					dynamicMaxHeight = Math.min(dynamicMaxHeight, $(window).height() / 2 - iconRowHeight);
				}

				if (TF.isMobileDevice && $(window).height() <= 500 && $(window).height() >= 320)
				{
					dynamicMaxHeight = 238;
				}
				if (dynamicMaxHeight > $contextMenu.outerHeight())
				{
					if ($contextMenu.find('.scroll-item').length > 0)
					{
						$contextMenu.find('.scroll-item').css('max-height', dynamicMaxHeight);
						$contextMenu.css('max-height', 'none');
					} else
					{
						$contextMenu.css('max-height', dynamicMaxHeight);
					}

				}

			}
		}
	};

	TemplateContextMenu.prototype.refresh = function()
	{
		this.setMenuPosition(this.$menuContainer, this.target);
	};

	TemplateContextMenu.prototype.dispose = function()
	{
		namespace.BaseContextMenu.prototype.dispose.call(this);
		ko.cleanNode(this.$menuContainer[0]);
		if (this.done)
		{
			this.done();
		}
		if (this.menuViewModel && this.menuViewModel.dispose)
		{
			this.menuViewModel.dispose();
		}
		this.menuViewModel = null;
	};
})();

(function()
{
	createNamespace("TF.ContextMenu").BaseGeneralMenuViewModel = BaseGeneralMenuViewModel;

	function BaseGeneralMenuViewModel()
	{

	}
})();

(function()
{
	function ContextMenuMobileHelper()
	{

	}

	createNamespace("TF").ContextMenuMobileHelper = ContextMenuMobileHelper;

	ContextMenuMobileHelper.setMenuHeightForPhoneDevice = function(el, specialMenuClass)
	{
		var $container = $(el);
		var $contextmenuWrap = $container.find(specialMenuClass);
		if ($contextmenuWrap.length)
		{
			var $contextmenu = $contextmenuWrap.find('.tf-contextmenu'),
				originalContextMenuHeight = $contextmenu.height();

			var gridHeight = $('.grid-wrap').height();
			var contextMenuHeight = gridHeight > originalContextMenuHeight ? originalContextMenuHeight : gridHeight - 5;

			$container.height(contextMenuHeight);
			$contextmenuWrap.height(contextMenuHeight);
			$contextmenu.css('height', contextMenuHeight + 'px');
			$contextmenu.css('max-height', contextMenuHeight + 'px');
		}
	};

	ContextMenuMobileHelper.setMenuLeftForPhoneDevice = function(el)
	{
		var $container = $(el);
		var $containerWrap = $container.parent();
		$container.css('left', '0');
		$containerWrap.css('left', '0');
	};

	ContextMenuMobileHelper.setMenuTopForPhoneDevice = function(el)
	{
		var $container = $(el);
		$container.css('top', '0');
		var baseTop = $('.grid-panel').offset().top;

		var $containerWrap = $container.parent();

		var iconrowIsGridPanelChild = $('.grid-panel').find('.iconrow').length;
		if (iconrowIsGridPanelChild)
		{
			var iconRowHeight = $('.iconrow').outerHeight();
			$containerWrap.css('top', baseTop + iconRowHeight + 'px');
		}
		else
		{
			var hackOffsetTop = -1; // move up menu to concat tab button and menu
			$containerWrap.css('top', baseTop + hackOffsetTop + 'px');
		}
	};

	ContextMenuMobileHelper.getSpecialMenuClass = function(el)
	{
		var $contextmenuWrap = $(el).find('.phone-wrap');
		if ($contextmenuWrap.length)
			return '.phone-wrap';

		return '';
	};
})();
