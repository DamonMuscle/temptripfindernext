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

		var contextMenuClose = function()
		{
			self.dispose();
		};

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
					left: offset.left -1 ,
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

		$("body").on("mousemove.contextmenu", function(e)
		{
			var target = $(e.target);
			clearTimeout(self._timer);
			if (target.closest($container).length == 0 && target.closest($target).length == 0 && target.closest('.mobile-alert').length === 0)
			{
				self._timer = setTimeout(function()
				{
					self.dispose();

				}, 100); // original 300ms might cause menu stuck if user moves very fast. Decrease to 100ms to prevent this issue.
			}
		});

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
		if ($("#contextmenu-wrapper .tf-contextmenu").length <= 0)
		{
			self._target.removeClass("contextmenu-open");
		}
		$(window).off("resize.contextmenu");
		$(document).off("mousemove.contextmenu");
	};

	BaseContextMenu.prototype.render = function()
	{
		throw "render needs to be implemented in subclass of BaseContextMenu";
	};
})();
