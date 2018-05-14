(function()
{
	var namespace = createNamespace("TF.ContextMenu");
	var menusNeedHideLeftBarTopBorder = [
		'workspace/grid/filtercontextmenu',
		'workspace/grid/layoutcontextmenu',
		'workspace/grid/newgridwithselectedrecordsmenu',
		'workspace/grid/editkendocolumnformobile'
	];

	namespace.TemplateContextMenu = TemplateContextMenu;

	function TemplateContextMenu(templateName, menuViewModel)
	{
		namespace.BaseContextMenu.apply(arguments);
		if (!menuViewModel instanceof TF.ContextMenu.BaseGeneralMenuViewModel)
		{
			throw "parameter should be a subclass of TF.ContextMenu.BaseGeneralMenuViewModel";
		}

		this.menuViewModel = menuViewModel;

		this.afterRender = function()
		{
			this.loopInit(this.$menuContainer);
			this.setMenuMaxHeight(this.$menuContainer);
			this.setMenuPosition(this.$menuContainer, this.target);

			var mobileHelper = TF.ContextMenuMobileHelper;
			if (TF.isPhoneDevice)
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
				this.menuViewModel.afterRender();
			}
		}.bind(this);

		this.render = function($wrapper, target)
		{
			this.target = target;
			var $container = this.createContainer($wrapper, target);
			this.$container = $container;
			this.templateName = 'workspace/documenttabmenu';
			var $templateWrapper = $('<div data-bind="template:{name:\''
				+ templateName +
				'\',afterRender:afterRender,data:menuViewModel}" style="display:none"></div>');
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
		var arrayOfMenuItem = [];
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
						$menuItem.on("mouseover", function(e)
						{
							clearTimeout($menu.timer);
							var left = $parent.position().left + $parent.width();
							if ($parent.offset().left + left + $menu.outerWidth() > $(window).width())
							{
								left = 0 - $menu.outerWidth();
							}
							var top = $parent.position().top;
							var outerHeight = $menu.outerHeight();
							if ($parent.offset().top + outerHeight > $(window).height())
							{
								top = top + $parent.height() - outerHeight;
							}
							$menu.css({ position: "absolute", left: left + "px", top: top + "px" });
							$menu.show();
							if ($menu.offset().top < 0)
							{
								$menu.offset({ top: 0, left: $menu.offset().left });
							}
						});
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

	TemplateContextMenu.prototype.setMenuMaxHeight = function(el)
	{
		var arrayOfContextMenu = [];
		$.merge(arrayOfContextMenu, $(el).find(".tf-contextmenu"));
		while (contextMenu = arrayOfContextMenu.shift())
		{
			if (contextMenu)
			{
				var $contextMenu = $(contextMenu);
				var dynamicMaxHeight = $(window).height() - 300;
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