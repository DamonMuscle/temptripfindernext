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
		var $target = $(target), $container = $('<div></div>'), self = this;
		self._$container = $container;
		self._target = $target;

		if (!TF.isPhoneDevice)
		{
			self._mouseover = function()
			{
				if (self._timer)
				{
					clearTimeout(self._timer);
				}
				$(document).unbind("mousemove", self._mouseout);
			};

			$container.on("mouseout", function()
			{
				if (self._timer)
				{
					clearTimeout(self._timer);
				}
				//NOTE: context menu close
				self._timer = setTimeout(function()
				{
					self.dispose();
				}, 300);
			});
		}

		var contextMenuClose = function()
		{
			self.dispose();
		};
		if (self._target.prop("className").split(" ").includes('iconbutton'))
		{
			self._target.on("mouseover", self._mouseover);
			self._target.on("mouseout", self._mouseout);
		}
		else
		{
			$(document).on("mousemove", self._mouseout);
		}
		self._$container.on("mouseover", self._mouseover);
		self._$container.on("mouseout", self._mouseout);
		self._$container.on("contextMenuClose", contextMenuClose);

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

		var left;
		if (leftDiff < 0)
		{
			left = 0;
		}
		else
		{
			if (offset.left < Math.abs(-$menuContainer.outerWidth() + $target.outerWidth()))
			{
				left = -offset.left;
				if (screenWidth < $menuContainer.outerWidth())
				{
					$menuContainer.width(screenWidth);
				}
			}
			else
			{
				left = -$menuContainer.outerWidth() + $target.outerWidth();
			}
		}

		$menuContainer.css(
			{
				//this messes with submenu, didn't find a solution yet
				position: "absolute",
				left: left,
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
		var self = this;
		self.disposed = true;
		clearTimeout(self._timer);
		tf.pageManager.obContextMenuVisible(false);
		self._$container.remove();
		self._target.removeClass("contextmenu-open");
		$(window).off("resize.contextmenu");
		$(document).unbind("mousemove", self._mouseout);
	};

	BaseContextMenu.prototype.render = function()
	{
		throw "render needs to be implemented in subclass of BaseContextMenu";
	};
})();
