(function()
{
	createNamespace("TF").TapHelper = TapHelper;

	function TapHelper(element, options)
	{
		this.xDown = null;
		this.yDown = null;
		this.options = options;
		element.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
		element.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
		element.addEventListener('touchend', this.handleTouchOver.bind(this), false);
		element.addEventListener('touchcancel', this.handleTouchOver.bind(this), false);
	}

	TapHelper.prototype.constructor = TapHelper;

	TapHelper.prototype.handleTouchStart = function(evt)
	{
		if (evt.touches)
		{
			this.xDown = evt.touches[0].clientX;
			this.yDown = evt.touches[0].clientY;
			if (this.options.touchStart)
			{
				this.options.touchStart(evt);
			}
		}
	}

	TapHelper.prototype.handleTouchOver = function(evt)
	{
		if (this._loseFocus)
		{
			this._loseFocus = false;
			evt.preventDefault();
			return;
		}

		this.xDown = null;
		this.yDown = null;
		if (this.options.touchOver)
		{
			this.options.touchOver(evt);
		}
	}

	TapHelper.prototype.handleTouchMove = function(evt)
	{
		if (!this.xDown || !this.yDown || !evt.touches)
		{
			return;
		}

		var xUp = evt.touches[0].clientX;
		var yUp = evt.touches[0].clientY;

		var xDiff = this.xDown - xUp;
		var yDiff = this.yDown - yUp;

		if (Math.abs(xDiff) > Math.abs(yDiff))
		{
			if (xDiff > 0)
			{
				if (this.options.swipingLeft)
				{
					this.options.swipingLeft(evt);
				}
			} else
			{
				if (this.options.swipingRight)
				{
					this.options.swipingRight(evt);
				}
			}
		}
		else
		{
			this.detectAndBlurTextElement();
			if (yDiff > 0)
			{
				if (this.options.swipingUp)
				{
					this.options.swipingUp(evt);
				}
			} else
			{
				if (this.options.swipingDown)
				{
					this.options.swipingDown(evt);
				}
			}
		}
	}

	TapHelper.prototype.detectAndBlurTextElement = function()
	{
		var node = document.activeElement;
		if (node && (node.nodeName == "TEXTAREA" || node.nodeName == "INPUT"))
		{
			this._loseFocus = true;
			$(node).blur();
		}
	};
})();