(function()
{
	//var contentMaxHeight = 100;
	function calcArrowPosition(arrow, trigger)
	{
		var triggerOffset = trigger.offset();
		return {
			left: triggerOffset.left - arrow.outerWidth() / 2 + trigger.outerWidth() / 2,
			top: triggerOffset.top - 19
		}
	}

	function calcToolTipPosition(tooltip, trigger)
	{
		var triggerOffset = trigger.offset();
		tooltip.find(".scroll-content").css({ "height": "auto", "display": 'inline' });
		tooltip.children(".content").css("height", "auto");
		var newContentHeight = tooltip.children(".content").height();
		var position = {
			left: triggerOffset.left - tooltip.outerWidth() / 2 + trigger.outerWidth() / 2,
			top: triggerOffset.top - tooltip.height() - 40
		};
		//out of window verify
		if (position.left < 0)
		{
			position.left = 10;
		} else if (position.left > $('body').width())
		{
			position.left = $('body').width() - 10;
		}

		if (position.top < 0)
		{
			newContentHeight = newContentHeight + position.top - 10;
			tooltip.children(".content").css("height", newContentHeight);
			position.top = 10;
		}
		var scrollContentHeight = newContentHeight - tooltip.find(".fix-at-bottom").outerHeight() - 2;
		if (scrollContentHeight > 15)
		{
			tooltip.find(".scroll-content").css({ "height": scrollContentHeight, "display": 'block' });
		}
		return position;
	}

	function getMouseWorkPolygon(tooltip, trigger)
	{
		var tooltipOffset = tooltip.offset(),
			tooltipHeight = tooltip.outerHeight(),
			tooltipWidth = tooltip.outerWidth(),
			triggerOffset = trigger.offset(),
			triggerHeight = trigger.outerHeight(),
			triggerWidth = trigger.outerWidth();
		return [
			[tooltipOffset.left, tooltipOffset.top],
			[tooltipOffset.left + tooltipWidth, tooltipOffset.top],
			[tooltipOffset.left + tooltipWidth, tooltipOffset.top + tooltipHeight],
			[triggerOffset.left + triggerWidth, triggerOffset.top + triggerHeight],
			[triggerOffset.left, triggerOffset.top + triggerHeight],
			[tooltipOffset.left, tooltipOffset.top + tooltipHeight],
			[tooltipOffset.left, tooltipOffset.top]
		]
	}

	function inside(point, polygon)
	{
		var x = point[0], y = point[1];
		var inside = false;
		for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++)
		{
			var xi = polygon[i][0], yi = polygon[i][1];
			var xj = polygon[j][0], yj = polygon[j][1];

			var intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	};

	ko.bindingHandlers.toolTip = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var $element = $(element);
			var trigger = $element.prev();
			var $arrow = $("<div class='arrow'></div>");
			$element.hide()
				.append($arrow);
			trigger.on("mouseover", function()
			{
				$element.appendTo("body");
				$element.show().offset(calcToolTipPosition($element, trigger));
				$arrow.offset(calcArrowPosition($arrow, trigger));
				var mouseWorkPolygon = getMouseWorkPolygon($element, trigger);
				$(document).off("mousemove.tooltip").on("mousemove.tooltip", function(e)
				{
					if (!inside([e.clientX, e.clientY], mouseWorkPolygon))
					{
						$element.hide();
						$(document).off("mousemove.tooltip");
					}
				});
			})
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
		}
	}
})();
