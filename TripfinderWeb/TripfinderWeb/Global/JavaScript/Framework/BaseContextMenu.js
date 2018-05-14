(function()
{
	var namespace = createNamespace("TF.ContextMenu");
	namespace.BaseContextMenu = BaseContextMenu;

	function BaseContextMenu()
	{
		this.disposed = false;
		this._timer = null;
		this._$container = null;
		this._target = null;
	}

	BaseContextMenu.prototype.constructor = BaseContextMenu;

	//this method needs to be called in subclass
	BaseContextMenu.prototype.createContainer = function($wrapper, target)
	{
		var $target = $(target);
		this._target = $target;

		var $container = $('<div></div>');
		this._$container = $container;
		var self = this;

		var _mouseover = function()
		{
			clearTimeout(self._timer);
		};

		var _mouseout = function()
		{
			clearTimeout(self._timer);
			//NOTE: context menu close
			self._timer = setTimeout(function()
			{
				//$container.hide();
				self.dispose();
			}, 300);
		};

		var contextMenuClose = function()
		{
			//$container.hide();
			self.dispose();
		};

		setTimeout(function()
		{
			$container.on("mouseover", _mouseover);
			$container.on("mouseout", _mouseout);
			$container.on("contextMenuClose", contextMenuClose);
		}.bind(this), 200); // FLEET-327: fix issue of when trigger menu by multi touch bar, the mouseout will be triggered at same time, add code to delay events binding to fix it


		if (this.isElementTarget($target[0]))
		{
			$handlePlaceholder = $('<div></div>');
			this.handleWidth = $target.outerWidth();
			this.handleHeight = $target.outerHeight();
			$handlePlaceholder.css(
				{
					width: this.handleWidth,
					height: this.handleHeight,
					position: "absolute"
				});
			$handlePlaceholder.appendTo($container);
			$handlePlaceholder.addClass("contextmenu-overlay");
			if ($handlePlaceholder.width() === 0)
			{
				//VIEW-1343 Right-Click menu does not close when navigating away from it
				$handlePlaceholder.css(
					{
						width: 40,
						height: 40,
						marginLeft: -20,
						marginTop: -20
					});
			}
			var offset = $target.offset();
			$container.css(
				{
					position: "absolute",
					left: offset.left,
					top: offset.top
				});
			$target.addClass("contextmenu-open");

			$(window).on("resize.contextmenu", function()
			{
				if (TF.isPhoneDevice)
				{
					return;
				}
				setTimeout(function()
				{
					var offset = $target.offset();
					$container.css(
						{
							position: "absolute",
							left: offset.left,
							top: offset.top
						});
				}, 10);
			}.bind(this));
		}
		else
		{
			$container.css(
				{
					position: "absolute",
					left: $target[0].left,
					top: $target[0].top
				});
		}
		$container.appendTo($wrapper);
		return $container;
	};


	//this method needs to be called in subclass to set position properly
	BaseContextMenu.prototype.setMenuPosition = function($menuContainer, $target)
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
		bottomSpace = screenHeight - offset.top - $menuContainer.outerHeight() - handleAddition;
		topSpace = offset.top - $menuContainer.outerHeight();
		isBottom = bottomSpace > topSpace;
		var topx, leftx;
		if (isBottom)
		{
			topx = 0 + this.handleHeight;
			if (bottomSpace < 0)
			{
				$menuContainer.find(".grid-menu").css('max-height', screenHeight - offset.top);
			}
		}
		else
		{
			topx = $menuContainer.outerHeight() > offset.top ? offset.top : $menuContainer.outerHeight();
			$menuContainer.find(".grid-menu").css('max-height', topx);
			topx = -topx;
		}
		$menuContainer.css(
			{
				//this messes with submenu, didn't find a solution yet
				//overflowY: "auto",
				//overflowX: "visible",
				//maxHeight: isBottom ? screenHeight - this.handleHeight - offset.top : offset.top,
				position: "absolute",
				left: leftDiff < 0 ? 0 : -$menuContainer.outerWidth() + $target.outerWidth(),
				top: topx
			});
		$menuContainer.show();
	};

	BaseContextMenu.prototype.isElementTarget = function($target)
	{
		return !($target.hasOwnProperty("top") && $target.hasOwnProperty("left"));
	};

	BaseContextMenu.prototype.dispose = function()
	{
		this.disposed = true;
		clearTimeout(this._timer);
		this._$container.remove();
		this._target.removeClass("contextmenu-open");
		$(window).off("resize.contextmenu");
	};

	BaseContextMenu.prototype.render = function()
	{
		throw "render needs to be implemented in subclass of BaseContextMenu";
	};
})();
