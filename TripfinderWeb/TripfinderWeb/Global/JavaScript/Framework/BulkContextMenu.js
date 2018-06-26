(function()
{
	var namespace = createNamespace("TF.ContextMenu");
	namespace.BulkContextMenu = BulkContextMenu;

	function BulkContextMenu(templateName, menuViewModel)
	{
		namespace.TemplateContextMenu.call(this, templateName, menuViewModel);
	}

	BulkContextMenu.prototype = Object.create(namespace.TemplateContextMenu.prototype);

	BulkContextMenu.prototype.constructor = BulkContextMenu;

	BulkContextMenu.prototype.setMenuPosition = function($menuContainer, $target)
	{
		$menuContainer = $($menuContainer);
		$target = $($target);
		var leftDiff, topSpace, bottomSpace, isBottom, offset, handleAddition;
		var screenHeight = $(window).height();
		var screenWidth = $(window).width();
		if (this.isElementTarget($target[0]))
		{
			handleAddition = this.handleHeight;
			offset = $target.offset();
		}
		else
		{
			handleAddition = 0;
			offset = $target[0];
		}
		leftDiff = offset.left + $menuContainer.outerWidth() - screenWidth;

		//not sure how handleheight works, so ignore it this time.
		bottomSpace = screenHeight - offset.top;
		topSpace = offset.top;
		isBottom = bottomSpace > topSpace;

		var topx = 0, leftx, maxHeight = $menuContainer.outerHeight();
		if ((screenHeight) < maxHeight)
		{
			maxHeight = screenHeight;
		}
		$menuContainer.find(".grid-menu").css('max-height', maxHeight);

		if (isBottom)
		{
			if (bottomSpace < maxHeight)
			{
				topx = bottomSpace - maxHeight;
			}
		}
		else
		{
			topx = -$menuContainer.outerHeight();
			if (topSpace < maxHeight)
			{
				topx = -topSpace;
			}
			topx += 1;
		}
		$menuContainer.css({
			position: "absolute",
			left: leftDiff < 0 ? 0 : -$menuContainer.outerWidth() + $target.outerWidth(),
			top: topx
		});
		$menuContainer.show();
	};

	BulkContextMenu.prototype.setMenuMaxHeight = function(el)
	{
		var arrayOfContextMenu = [];
		$.merge(arrayOfContextMenu, $(el).find(".tf-contextmenu"));
		while (contextMenu = arrayOfContextMenu.shift())
		{
			if (contextMenu)
			{
				var $contextMenu = $(contextMenu);
				$contextMenu.css('max-height', $(window).height());
			}
		}
	}

	BulkContextMenu.prototype.dispose = function()
	{
		this.target.remove();
		namespace.TemplateContextMenu.prototype.dispose.call(this);
	};
})();
