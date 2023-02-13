(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDisplayAutoScroll = RoutingDisplayAutoScroll;

	function RoutingDisplayAutoScroll()
	{
		this.autoScroll = new AutoScroll();
		this.parentScroll = new AutoScroll();
	}

	RoutingDisplayAutoScroll.prototype.onStart = function(e)
	{
		var parent = findScrollableParent(e.sender.element);
		var panel = findScrollableParent(parent.parent());
		this.autoScroll.onStart(parent);
		this.parentScroll.onStart(panel);
	};

	RoutingDisplayAutoScroll.prototype.onDrag = function(e)
	{
		this.autoScroll.onDrag(e);
		this.parentScroll.onDrag(e);
	};

	RoutingDisplayAutoScroll.prototype.onEnd = function()
	{
		this.autoScroll.onEnd();
		this.parentScroll.onEnd();
	};

	function AutoScroll()
	{
		this._scrollableParent = null;
		this._autoScroll = this._autoScroll.bind(this);
	}

	AutoScroll.prototype.onStart = function(scrollableParent)
	{
		this._scrollableParent = scrollableParent;
	};

	AutoScroll.prototype.onDrag = function(e)
	{
		if (this._scrollableParent[0])
		{
			var velocity = autoScrollVelocity(e.pageX, e.pageY, scrollableViewPort(this._scrollableParent));
			this._scrollVelocity = velocity;

			if (velocity.y === 0 && velocity.x === 0)
			{
				clearInterval(this._scrollInterval);
				this._scrollInterval = null;
			} else if (!this._scrollInterval)
			{
				this._scrollInterval = setInterval(this._autoScroll, 50);
			}
		}
	};

	AutoScroll.prototype.onEnd = function()
	{
		clearInterval(this._scrollInterval);
		this._scrollInterval = null;
	};

	AutoScroll.prototype._autoScroll = function()
	{
		var parent = this._scrollableParent[0],
			velocity = this._scrollVelocity;

		if (!parent)
		{
			return;
		}

		var yIsScrollable, xIsScrollable;

		yIsScrollable = parent.offsetHeight <= parent.scrollHeight;
		xIsScrollable = parent.offsetWidth <= parent.scrollWidth;

		var yDelta = parent.scrollTop + velocity.y;
		var yInBounds = yIsScrollable && yDelta > 0 && yDelta < parent.scrollHeight;

		var xDelta = parent.scrollLeft + velocity.x;
		var xInBounds = xIsScrollable && xDelta > 0 && xDelta < parent.scrollWidth;

		if (yInBounds)
		{
			parent.scrollTop += velocity.y;
		}

		if (xInBounds)
		{
			parent.scrollLeft += velocity.x;
		}
	};

	function autoScrollVelocity(mouseX, mouseY, rect)
	{
		var velocity = { x: 0, y: 0 };

		var AUTO_SCROLL_AREA = 50;

		if (mouseX - rect.left < AUTO_SCROLL_AREA)
		{
			velocity.x = -(AUTO_SCROLL_AREA - (mouseX - rect.left));
		} else if (rect.right - mouseX < AUTO_SCROLL_AREA)
		{
			velocity.x = AUTO_SCROLL_AREA - (rect.right - mouseX);
		}

		if (mouseY - rect.top < AUTO_SCROLL_AREA)
		{
			velocity.y = -(AUTO_SCROLL_AREA - (mouseY - rect.top));
		} else if (rect.bottom - mouseY < AUTO_SCROLL_AREA)
		{
			velocity.y = AUTO_SCROLL_AREA - (rect.bottom - mouseY);
		}

		return velocity;
	}

	function isRootNode(element)
	{
		return element === document.body || element === document.documentElement || element === document;
	}

	function findScrollableParent(element)
	{
		if (!element || isRootNode(element))
		{
			return $(document.body);
		}

		var parent = $(element)[0];

		while (!kendo.isScrollable(parent) && !isRootNode(parent))
		{
			parent = parent.parentNode;
		}

		return $(parent);
	}

	/**
	* get scroll div view port
	*/
	function scrollableViewPort(element)
	{
		var offset = element.offset();
		offset.bottom = offset.top + element.height();
		offset.right = offset.left + element.width();
		return offset;
	}
})();