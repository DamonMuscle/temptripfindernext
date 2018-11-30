ko.bindingHandlers.panelContentDrag = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
		var $element = $(element)
		var displayArray = valueAccessor() ? valueAccessor().displayArray : null
		if (displayArray)
		{
			displayArray.subscribe(function()
			{
				$element.height('auto');
				$element.closest(".content-container").height('auto');
			})
		}
		ko.bindingHandlers.panelContentDrag.makeTitleDraggable($element);
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
	{
	},
	makeTitleDraggable: function($element)
	{
		var $sliderList = $element.closest(".slider-list");
		var dragInfo = {}
		$element.closest(".content-container").prev(".item-header").on("click", function(e)
		{
			if (dragInfo.dragging)
			{
				return;
			}
			var $content = $(e.currentTarget).next();
			if ($content.height() == 0)
			{
				$content.css('height', 'auto');
				$content.find(".pannel-item-content").css('height', 'auto');
				var height = $content.height();
				$content.height(0);
				$content.animate({ height: height }, 500, function()
				{
					$content.css('height', 'auto');
					$content.find(".pannel-item-content").css('height', 'auto');
				});
			} else
			{
				$content.animate({ height: 0 }, 500);
			}
		}).bind('mousedown', function(e)
		{
			dragInfo = { startY: e.pageY, dragging: false, diffY: 0 }
			var dragTarget = $(e.currentTarget);
			var direction;
			var dragEnd = false;
			var lastPageY;
			var changeTarget = dragTarget.prev(".content-container");
			if (changeTarget.length == 0)
			{
				return;
			}
			$(document).bind('mousemove.sliderItem', function(e)
			{
				dragInfo.diffY = e.pageY - dragInfo.startY;
				if (lastPageY == null)
				{
					lastPageY = e.pageY;
				}
				if (Math.abs(dragInfo.diffY) > 2 && dragInfo.dragging == false)
				{
					dragInfo.dragging = true;
					$sliderList.find(".content-container").each(function(i, item)
					{
						$(item).data("startHeight", $(item).height())
					})
				}
				if (dragInfo.dragging)
				{
					var newDirection = lastPageY == e.pageY ? direction : (lastPageY - e.pageY < 0 ? "down" : "up");
					if (newDirection != direction)
					{
						changeTarget = dragTarget.prev(".content-container");
						$sliderList.find(".content-container").each(function(i, item)
						{
							$(item).data("startHeight", $(item).height())
						})
						dragInfo.startY = e.pageY;
						dragInfo.diffY = e.pageY - dragInfo.startY;
					}
					direction = newDirection;
					lastPageY = e.pageY;
					var newHeight = changeTarget.data("startHeight") + dragInfo.diffY;

					var maxHeight = changeTarget.children(".item-content").outerHeight() - changeTarget.find(".pannel-item-content").outerHeight() - 1;
					var headAndFooterHeight = maxHeight;
					changeTarget.find(".pannel-item-content").children().each(function(index, item)
					{
						maxHeight += $(item).outerHeight()
					});
					var end = false;
					if (newHeight < 0)
					{
						newHeight = 0;
						end = true;
					} else if (newHeight >= maxHeight)
					{
						newHeight = maxHeight
						end = true;
						changeTarget.next().css('height', 'auto').find(".pannel-item-content").css('height', 'auto');
					}
					changeTarget.find(".pannel-item-content").height(newHeight - headAndFooterHeight);
					changeTarget.height(newHeight);
					if (end && changeTarget.prev().prev().length > 0 && Math.abs(dragInfo.diffY) > 0)
					{
						changeTarget = changeTarget.prev().prev();
						dragInfo.startY = e.pageY;
					}
				}
			});
			$(document).bind('mouseup.sliderItem', function(e)
			{
				$(document).unbind('mousemove.sliderItem')
				$(document).unbind('mouseup.sliderItem')
				setTimeout(function()
				{
					dragInfo.dragging = false;
				}, 10);
			});
		});
	}
}