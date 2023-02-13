(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDisplayFixTitle = RoutingDisplayFixTitle;

	function RoutingDisplayFixTitle()
	{

	}

	var defaults = {
		scrollContainer: null,
		fixElements: null,
		backgroundColor: "white",
		zIndex: 2
	};

	RoutingDisplayFixTitle.prototype.init = function(options)
	{
		var self = this;
		self.options = $.extend({}, defaults, options);
		var titles = self.options.fixElements,
			scrollContainer = self.options.scrollContainer;
		// add css to fix titles
		titles.each(function(i, item)
		{
			var $item = $(item);
			$item.css({ "position": "relative", "background": self.options.backgroundColor });
		});
		// add scroll event
		scrollContainer.unbind("scroll").bind("scroll", function()
		{
			self.fixTitle();
		});
	};

	RoutingDisplayFixTitle.prototype.fixTitle = function()
	{
		var self = this,
			titles = self.options.fixElements,
			scrollContainer = self.options.scrollContainer,
			containerOffset = scrollContainer.offset(),
			fixItem,
			fixItemIndex,
			bottom,
			i;
		// find fixItem
		for (i = 0; i < titles.length; i++)
		{
			var item = titles.eq(i),
				parent = item.parent(),
				itemOffset = parent.offset(),
				itemBottom = item.parent().outerHeight() + itemOffset.top;

			if (itemOffset.top < containerOffset.top && itemBottom > containerOffset.top)
			{
				fixItem = item;
				fixItemIndex = i;
				bottom = itemBottom;
				break;
			}
		}
		// transform fixItem
		if (fixItem)
		{
			var parentTop = fixItem.parent().offset().top,
				translateY = containerOffset.top - parentTop,
				height = fixItem.outerHeight();
			if (bottom - containerOffset.top < height)
			{
				translateY = bottom - parentTop - height;
			}
			fixItem.css({ "z-index": self.options.zIndex, "transform": "translateY(" + translateY + "px)" });
		}
		// delete other item transform
		for (i = 0; i < titles.length; i++)
		{
			var item = titles.eq(i);
			if (i != fixItemIndex)
			{
				item.css("transform", "translateY(0)");
			}
		}
		self.removeInsertContextMenu();
	};

	RoutingDisplayFixTitle.prototype.removeInsertContextMenu = function()
	{
		TF.RoutingMap.ContextMenu.prototype.removeContextMenu();
	};
})();