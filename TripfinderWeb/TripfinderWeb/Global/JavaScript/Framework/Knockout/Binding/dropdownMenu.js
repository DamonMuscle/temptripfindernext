ko.bindingHandlers.dropDownMenu = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var $element = $(element);
		var className = "print-setting-group";
		var btnClassName = "fixed-menu-btn";
		var menuClassName = "menu"
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
				isActive = $target.hasClass("active"),
				active = !isActive;
			e.stopPropagation();
			$("." + className).removeClass("active");
			$target.toggleClass("active", active);
			//make it fixed to fix cut by container bug
			var $menuBtn = $element.children('.' + btnClassName);
			if ($menuBtn.length && $target.hasClass('active'))
			{
				var $menu = $target.find('.' + menuClassName);
				$menu.css('position', 'fixed');
				var offset = $menuBtn.offset();
				var height = $menuBtn.height();
				var menuHeight = $menu.height();
				if ((offset.top + menuHeight + height) > ($(window).height() + $(window).scrollTop()))
				{
					$menu.css('top', (offset.top - menuHeight) + 'px');
				}
				else
				{
					$menu.css('top', (offset.top + height) + 'px');
				}
				// if ((offset.left - window.scrollX + $menu.width()) > ($(window).width() + $(window).scrollLeft()))
				// {
				// 	$menu.css('left', offset.left - window.scrollX + 'px');
				// }
				// else
				// {
				$menu.css('left', offset.left - window.scrollX + 'px');
				// }
			}
		});
		//click child item auto close menu
		$element.delegate("div.menu li", "click", function(e)
		{
			e.stopPropagation();
			var $target = $(e.currentTarget);
			$element.removeClass("active");
		});

		//click other place auto close menu
		$(document).off("mousedown.closeDropDownMenu");
		$(document).on("mousedown.closeDropDownMenu", function(e)
		{
			if ($(e.target).closest("." + className).length > 0)
			{
				return;
			}
			setTimeout(function()
			{
				$("." + className).removeClass("active");
			}, 10)
		});

		$(document).off("mousewheel.closeDropDownMenu");
		$(document).on("mousewheel.closeDropDownMenu", function(e)
		{
			if ($(e.target).closest("." + className).length > 0 && !$(e.target).hasClass('fixed-menu-btn'))
			{
				return;
			}
			setTimeout(function()
			{
				$("." + className).removeClass("active");
			}, 10)
		});

		$(window).off("resize.closeDropDownMenu");
		$(window).on("resize.closeDropDownMenu", function(e)
		{
			$("." + className).children('.' + btnClassName).each(function(index, item)
			{
				var $menuBtn = $(item);
				var offset = $menuBtn.offset();
				var height = $menuBtn.height();
				var $menu = $menuBtn.parent().find('.' + menuClassName);
				$menu.css('top', (offset.top + height) + 'px');
				$menu.css('left', offset.left - window.scrollX + 'px');
			});
		});
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{

	}
};
