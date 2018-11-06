(function()
{
	createNamespace("TF.DetailView").LineBlockHelper = LineBlockHelper;

	function LineBlockHelper(detailView)
	{
		var self = this;
		self.detailView = detailView;
	};

	LineBlockHelper.prototype.setStatic = function(isStatic)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"), $lines = $gridStack.find(".verti-line, .hori-line");
		if ($lines.length > 0)
		{
			isStatic ? $lines.addClass("disable") : $lines.removeClass("disable");
		}
	};

	LineBlockHelper.prototype.addLineContainers = function()
	{
		var self = this, width = self.detailView.getCurrentWidth(), node, maxY = -1, $bottomContainer,
			$gridStack = self.detailView.$element.find(".grid-stack"),
			items = $gridStack.find(">.grid-stack-item:visible"),
			lineContainer = "<div class='line-container'></div>", $lineContainer, lastContainer = [];

		$gridStack.find(".line-container").remove();
		for (var i = 0; i < width; i++)
		{
			$lineContainer = $(lineContainer);
			$lineContainer.addClass("bottom");
			$lineContainer.css({ width: 100 / width + "%", left: i === 0 ? 0 : (100 / width * i + "%"), top: -4 });
			$lineContainer.attr({ x: i, y: 0 });
			$gridStack.prepend($lineContainer);
		}

		$.each($gridStack.find(".line-container"), function(index, container)
		{
			var accept = "";
			if (!$(container).hasClass("no-hori"))
			{
				accept += ".horizontal-line, .hori-line";
			}
			if (!$(container).hasClass("no-hori"))
			{
				if (accept !== "")
				{
					accept += ",";
				}
				accept += ".vertical-line, .verti-line";
			}
			$(container).droppable({
				accept: accept,
				tolerance: "pointer",
				drop: function(e, ui)
				{
					var placeholder = $gridStack.find(".placeholder-line");
					if (placeholder.hasClass("horizontal"))
					{
						self.addHoriLine(placeholder.attr("x"), placeholder.attr("y"), placeholder.attr("width"));
					}
					else
					{
						self.addVertiLine(placeholder.attr("x"), placeholder.attr("y"), placeholder.attr("height"));
					}
					placeholder.remove();
					if (ui.draggable.hasClass("hori-line") || ui.draggable.hasClass("verti-line"))
					{
						ui.draggable.remove();
					}
					$(".right-container .line-container").removeClass("drag-line");
					$gridStack.find(".hori-line, .verti-line").removeClass("disable-animation");
				},
				out: function(e, ui)
				{
				},
				over: function(e, ui)
				{
				}
			});
		});
	};

	//Temporary
	LineBlockHelper.prototype.vLineDraggingIn = function($vline, $helper)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"), unitHeight = self.detailView.UNITHEIGHT + 1, height, left,
			unitWidth = $(".line-container").outerWidth(), x, y, placeholder, gridWidth = self.detailView.getCurrentWidth(),
			offset = $gridStack.offset(), marginLeft = 2, top = $vline.offset().top - offset.top, left = $vline.offset().left - offset.left + marginLeft,
			showPlaceholder = left >= 0 && top >= 0;

		$gridStack.find(".placeholder-line").remove();

		if ($helper)
		{
			if (left < 0)
			{
				$helper.addClass('removing');
			}
			else
			{
				$helper.removeClass('removing');
			}
		}

		y = parseInt(top / unitHeight);
		x = left / unitWidth;
		if (x < gridWidth && x > gridWidth - 0.5)
		{
			x = Math.ceil(x);
		}
		else
		{
			x = Math.floor(x);
		}

		height = $vline.attr("height") || 1;
		height = parseInt(height);
		left = x === 0 ? 0 : (100 / gridWidth * x + "%")

		if (showPlaceholder)
		{
			placeholder = $("<div class='placeholder-line vertical' x='" + x + "' y='" + y + "' height='" + height + "'></div>");
			placeholder.css({
				top: (y * self.detailView.UNITHEIGHT + (y - 1)) + "px",
				left: left,
				height: (height * unitHeight) + "px"
			});
			$gridStack.append(placeholder);
		}

		self.moveNode({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			isVertical: true,
			type: 'line'
		}, x, y, 0, height);
	};

	LineBlockHelper.prototype.hLineDraggingIn = function($hline, $helper)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"), unitHeight = self.detailView.UNITHEIGHT + 1, width,
			unitWidth = $(".line-container").outerWidth(), x, y, placeholder, gridWidth = self.detailView.getCurrentWidth(),
			offset = $gridStack.offset(), top = $hline.offset().top - offset.top, left = $hline.offset().left - offset.left,
			showPlaceholder = left >= 0 && top >= 0;

		$gridStack.find(".placeholder-line").remove();

		if ($helper)
		{
			if (left < 0)
			{
				$helper.addClass('removing');
			}
			else
			{
				$helper.removeClass('removing');
			}
		}

		y = parseInt(top / unitHeight);
		x = parseInt(left / unitWidth + 0.01);
		width = $hline.attr("width") || 1;
		width = parseInt(width);
		y = self.getClosestPosition(x, y, width);
		y = self.checkLineYPosition(x, y, width);

		if (showPlaceholder)
		{
			placeholder = $("<div class='placeholder-line horizontal' x='" + x + "' y='" + y + "' width='" + width + "'></div>");
			placeholder.css({
				top: (y * self.detailView.UNITHEIGHT + (y - 1) - 2) + "px",
				left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
				width: 100 / gridWidth * width + "%"
			});
			$gridStack.append(placeholder);
		}
		self.refresh();
	}

	LineBlockHelper.prototype.refresh = function()
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack");
		$gridStack.data('gridstack').lineBlockManager.packNodes();
	};

	LineBlockHelper.prototype.fixCollisions = function()
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack");
		$gridStack.data('gridstack').lineBlockManager.fixCollisions();
	};

	LineBlockHelper.prototype.moveNode = function(node, x, y, width, height)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack");
		$gridStack.data('gridstack').grid.moveNode(node, x, y, width, height);
	};

	LineBlockHelper.prototype.getClosestPosition = function(x, y, width)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"), bottomNodes = [],
			$hLine, bottomNode, gridWidth = self.detailView.getCurrentWidth(), stackItems = $gridStack.find(".grid-stack-item"),
			itemX, itemY, itemHeight, itemWidth, maxY = 0;

		$.each(stackItems, function(index, item)
		{
			itemX = parseInt($(item).attr("data-gs-x"));
			itemY = parseInt($(item).attr("data-gs-y"));
			itemHeight = parseInt($(item).attr("data-gs-height"));
			itemWidth = parseInt($(item).attr("data-gs-width"));
			if (itemX >= x + width || itemX + itemWidth <= x)
			{
				return true;
			}
			if (itemY + itemHeight <= y)
			{
				if (maxY < itemY + itemHeight)
				{
					maxY = itemY + itemHeight;
				}
			}
		});
		return maxY;
	};

	/**
	 * Check whether current line position will cut any blocks.
	 * @param {any} x
	 * @param {any} y
	 * @param {any} width
	 */
	LineBlockHelper.prototype.checkLineYPosition = function(x, y, width, height)
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"),
			stackItems = $gridStack.find(".grid-stack-item"),
			itemX, itemY, itemHeight, itemWidth, height = height || 0, cutBlocks;

		while (y > 0)
		{
			cutBlocks = false;
			$.each(stackItems, function(index, item)
			{
				itemX = parseInt($(item).attr("data-gs-x"));
				itemY = parseInt($(item).attr("data-gs-y"));
				itemHeight = parseInt($(item).attr("data-gs-height"));
				itemWidth = parseInt($(item).attr("data-gs-width"));
				if (itemX >= x + width || itemX + itemWidth <= x)
				{
					return true;
				}
				if (itemY >= y + height)
				{
					return true;
				}

				if (itemY + itemHeight > y)
				{
					y--;
					cutBlocks = true;
					return false;
				}
			});
			if (!cutBlocks)
			{
				break;
			}
		}

		return y;
	};

	LineBlockHelper.prototype.addVertiLine = function(x, y, h)
	{
		var self = this, width, height, $gridStack = self.detailView.$element.find(".grid-stack"),
			gridWidth = self.detailView.getCurrentWidth(), $line, actualUnitWidth;

		y = parseInt(y);
		x = parseInt(x);
		h = parseInt(h);
		$line = $("<div class='verti-line'></div>");
		$line.css({
			left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
			top: (y * self.detailView.UNITHEIGHT + (y - 1)) + "px",
			height: (h * (self.detailView.UNITHEIGHT + 1)) + "px",
			width: "1px"
		});
		$gridStack.append($line);
		$line.draggable({
			containment: "#pageContent",
			appendTo: "body",
			// left should greater than 2, because vertical line has -2px margin-left css,
			// otherwise lineContainer will not trigger drop event.
			cursorAt: { left: 3, top: 8 },
			scroll: false,
			helper: function(e)
			{
				var $helper = $(e.target).clone(), height = $(e.target).height();
				$helper.addClass("disable-animation");
				$helper.css({
					width: '1px',
					height: height
				});
				return $helper;
			},
			drag: function(evt, ui)
			{
				var helperOffset = $(ui.helper).offset(),
					containerOffset = $gridStack.offset();
				$line.css({
					left: helperOffset.left - containerOffset.left + 'px',
					top: helperOffset.top - containerOffset.top + 'px'
				});

				self.vLineDraggingIn($line, ui.helper);
			},
			start: function()
			{
				$line.addClass('dragging');
				$(".right-container .line-container").addClass("drag-line");
				$line.addClass("disable-animation");
			},
			stop: function(e, ui)
			{
				$line.removeClass('dragging');
				if (ui.helper.hasClass('removing'))
				{
					$line.remove();
				}
				else
				{
					var x = parseInt($line.attr('x')), y = parseInt($line.attr('y')),
						gridWidth = self.detailView.getCurrentWidth();

					$line.css({
						left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
						top: (y * self.detailView.UNITHEIGHT + (y - 1)) + "px"
					});
				}
				$(".right-container .line-container").removeClass("drag-line");
				$line.removeClass("disable-animation");
			}
		});
		$line.attr({ x: x, y: y, height: h, type: "verticalLine" });

		actualUnitHeight = (self.detailView.UNITHEIGHT + 1);

		$line.resizable({
			autoHide: true,
			minHeight: actualUnitHeight,
			handles: 'n, s',
			resize: function(e, ui)
			{
				var $currentLine = ui.element, placeholderHeight, lineContainer, currentY,
					axis = $(ui.element).data('ui-resizable').axis, origX = parseInt($currentLine.attr("x")), currentX,
					origHeight = parseInt($currentLine.attr("height")), origY = parseInt($currentLine.attr("y")),
					placeholderLine = $("<div class='placeholder-line vertical'></div>"), currentHeight;

				currentHeight = parseInt($currentLine.attr("resizingHeight") || origHeight) * (self.detailView.UNITHEIGHT + 1);

				if ($currentLine.height() > currentHeight &&
					!self.canResizeVertiLine(parseInt($currentLine.attr("resizingY") || origY), origX, parseInt($currentLine.attr("resizingHeight") || origHeight), axis === "s"))
				{
					$currentLine.css("top", parseInt($currentLine.attr("resizingY") || origY) * self.detailView.UNITHEIGHT + (parseInt($currentLine.attr("resizingY") || origY) - 1));
					$currentLine.height(currentHeight);
					return;
				}

				gridWidth = self.detailView.getCurrentWidth();
				$gridStack.find(".placeholder-line").remove();
				switch (axis)
				{
					case "s":
						placeholderHeight = parseInt($currentLine.height() / actualUnitHeight);
						$currentLine.attr("resizingHeight", placeholderHeight);
						if ($currentLine.height() / actualUnitHeight - placeholderHeight > 0.5)
						{
							placeholderHeight++;
						}
						placeholderLine.css({
							left: origX === 0 ? 0 : (100 / gridWidth * origX + "%"),
							height: (placeholderHeight * (self.detailView.UNITHEIGHT + 1)) + "px",
							top: $currentLine.css("top")
						});
						placeholderLine.attr({
							x: origX,
							height: placeholderHeight,
							y: $currentLine.attr("y")
						});
						$gridStack.append(placeholderLine);
						break;
					case "n":
						placeholderHeight = parseInt($currentLine.height() / actualUnitHeight);
						if ($currentLine.height() / actualUnitHeight - placeholderHeight > 0.5)
						{
							placeholderHeight++;
							$currentLine.attr("resizingHeight", placeholderHeight);
							$currentLine.attr("resizingY", origY - placeholderHeight + origHeight);
						}

						currentY = origY - placeholderHeight + origHeight;
						placeholderLine.css({
							left: origX === 0 ? 0 : (100 / gridWidth * origX + "%"),
							height: (placeholderHeight * (self.detailView.UNITHEIGHT + 1)) + "px",
							top: (currentY * self.detailView.UNITHEIGHT + (currentY - 1)) + "px"
						});
						placeholderLine.attr({
							x: origX,
							height: placeholderHeight,
							y: currentY
						});
						$gridStack.append(placeholderLine);
						break;
				}
				self.refresh();
			},
			start: function()
			{
				$line.addClass("disable-animation");
			},
			stop: function(e, ui)
			{
				var placeholder = $gridStack.find(".placeholder-line.vertical"), $currentLine = ui.element,
					y = parseInt(placeholder.attr("y")), height = parseInt(placeholder.attr("height"));

				if (placeholder.length !== 0)
				{
					$currentLine.css("top", y * self.detailView.UNITHEIGHT + (y - 1)).height(height * (self.detailView.UNITHEIGHT + 1))
						.attr("height", height).attr("y", y);
				}

				$gridStack.find(".placeholder-line.vertical").remove();
				$currentLine.removeAttr("resizingY").removeAttr("resizingHeight").closest(".grid-stack").removeClass("grid-stack-resizing");
				$line.find(".ui-resizable-handle").hide();
				$line.removeClass("disable-animation");
			}
		});
		$line.find(".ui-resizable-handle").empty().append("<div class='handle'></div>");
	};

	LineBlockHelper.prototype.addHoriLine = function(x, y, w)
	{
		var self = this, width, height, $gridStack = self.detailView.$element.find(".grid-stack"),
			gridWidth = self.detailView.getCurrentWidth(), $line, actualUnitWidth;

		y = parseInt(y);
		x = parseInt(x);
		w = parseInt(w);
		$line = $("<div class='hori-line'></div>");
		$line.css({
			left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
			top: (y * self.detailView.UNITHEIGHT + (y - 1) - 2) + "px",
			height: "1px",
			width: 100 / gridWidth * w + "%"
		});
		$gridStack.append($line);
		$line.draggable({
			containment: "#pageContent",
			appendTo: "body",
			cursorAt: { left: 8, top: 0 },
			scroll: false,
			helper: function(e)
			{
				var $helper = $(e.target).clone(), width = $(e.target).width();
				$helper.addClass("disable-animation");
				$helper.css({
					width: width,
					height: '1px'
				});
				return $helper;
			},
			drag: function(evt, ui)
			{
				var helperOffset = $(ui.helper).offset(),
					containerOffset = $gridStack.offset();
				$line.css({
					left: helperOffset.left - containerOffset.left + 'px',
					top: helperOffset.top - containerOffset.top + 'px'
				});

				self.hLineDraggingIn($line, ui.helper);
			},
			start: function()
			{
				$line.addClass('dragging');
				$(".right-container .line-container").addClass("drag-line");
				$line.addClass("disable-animation");
			},
			stop: function(e, ui)
			{
				$line.removeClass('dragging');
				if (ui.helper.hasClass('removing'))
				{
					$line.remove();
				}
				else
				{
					var x = parseInt($line.attr('x')), y = parseInt($line.attr('y')),
						gridWidth = self.detailView.getCurrentWidth();

					$line.css({
						left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
						top: (y * self.detailView.UNITHEIGHT + (y - 1) - 2) + "px"
					});
				}
				$(".right-container .line-container").removeClass("drag-line");
				$line.removeClass("disable-animation");
			}
		});
		$line.attr({ x: x, y: y, width: w, type: "horizontalLine" });

		actualUnitWidth = $(".line-container").outerWidth();
		$line.resizable({
			autoHide: true,
			minWidth: actualUnitWidth,
			handles: 'e, w',
			resize: function(e, ui)
			{
				var $currentLine = ui.element, placeholderWidth, lineContainer,
					axis = $(ui.element).data('ui-resizable').axis, origX = parseInt($currentLine.attr("x")), currentX,
					origWidth = parseInt($currentLine.attr("width")), origY = parseInt($currentLine.attr("y")),
					placeholderLine = $("<div class='placeholder-line horizontal'></div>");

				actualUnitWidth = $(".line-container").outerWidth();

				if ($currentLine.width() > actualUnitWidth * (parseInt($currentLine.attr("resizingWidth")) || origWidth) &&
					!self.canResizeHoriLine(parseInt($currentLine.attr("resizingX") || origX), origY, parseInt($currentLine.attr("resizingWidth")) || origWidth, axis === "e"))
				{
					$currentLine.css("left", parseInt($currentLine.attr("resizingX") || origX) === 0 ? 0 : (100 / gridWidth * parseInt($currentLine.attr("resizingX") || origX) + "%"));
					$currentLine.width((parseInt($currentLine.attr("resizingWidth")) || origWidth) * actualUnitWidth);
					return;
				}

				gridWidth = self.detailView.getCurrentWidth();
				$gridStack.find(".placeholder-line").remove();
				switch (axis)
				{
					case "e":
						placeholderWidth = parseInt($currentLine.width() / actualUnitWidth);
						$currentLine.attr("resizingWidth", placeholderWidth);
						if ($currentLine.width() / actualUnitWidth - placeholderWidth > 0.5)
						{
							placeholderWidth++;
						}
						placeholderLine.css({
							left: origX === 0 ? 0 : (100 / gridWidth * origX + "%"),
							width: 100 / gridWidth * placeholderWidth + "%",
							top: parseInt($currentLine.css("top")) + 2 + "px"
						});
						placeholderLine.attr({
							x: origX,
							width: placeholderWidth,
							y: $currentLine.attr("y")
						});
						$gridStack.append(placeholderLine);
						break;
					case "w":
						placeholderWidth = parseInt($currentLine.width() / actualUnitWidth);
						if ($currentLine.width() / actualUnitWidth - placeholderWidth > 0.5)
						{
							placeholderWidth++;
							$currentLine.attr("resizingWidth", placeholderWidth);
							$currentLine.attr("resizingX", origX - placeholderWidth + origWidth);
						}

						currentX = origX - placeholderWidth + origWidth;
						placeholderLine.css({
							left: currentX === 0 ? 0 : (100 / gridWidth * currentX + "%"),
							width: 100 / gridWidth * placeholderWidth + "%",
							top: parseInt($currentLine.css("top")) + 2 + "px"
						});
						placeholderLine.attr({
							x: currentX,
							width: placeholderWidth,
							y: $currentLine.attr("y")
						});
						$gridStack.append(placeholderLine);
						break;
				}
				self.refresh();
			},
			start: function()
			{
				$line.addClass("disable-animation");
			},
			stop: function(e, ui)
			{
				var placeholder = $gridStack.find(".placeholder-line.horizontal"), $currentLine = ui.element,
					x = parseInt(placeholder.attr("x")), width = parseInt(placeholder.attr("width")), y = parseInt(placeholder.attr("y"));

				if (placeholder.length !== 0)
				{
					$currentLine.css({
						left: x === 0 ? 0 : (100 / gridWidth * x + "%"),
						top: (y * self.detailView.UNITHEIGHT + (y - 1) - 2) + "px"
					}).width(100 / gridWidth * width + "%")
						.attr("width", width).attr("x", x).attr("y", y);
				}

				$gridStack.find(".placeholder-line.horizontal").remove();
				$currentLine.removeAttr("resizingX").removeAttr("resizingWidth").closest(".grid-stack").removeClass("grid-stack-resizing");
				$line.find(".ui-resizable-handle").hide();
				$line.removeClass("disable-animation");
			}
		});
		$line.find(".ui-resizable-handle").empty().append("<div class='handle'></div>");
	};

	LineBlockHelper.prototype.canResizeHoriLine = function(x, y, width, toRight)
	{
		var self = this, xEdge = toRight ? (x + width) : x, yEdge = y, $gridStack = self.detailView.$element.find(".grid-stack"),
			items = $gridStack.find(">.grid-stack-item:visible"), node, result = true, gridWidth = self.detailView.getCurrentWidth();

		if ((x + width === gridWidth && toRight) || (x === 0 && !toRight))
		{
			return false;
		}
		$.each(items, function(index, item)
		{
			node = $(item).data('_gridstack_node');
			if (toRight)
			{
				if (node.x === xEdge)
				{
					if (node.y < yEdge && node.y + node.height > yEdge)
					{
						result = false;
						return false;
					}
				}
			}
			else
			{
				if (node.x + node.width === xEdge)
				{
					if (node.y < yEdge && node.y + node.height > yEdge)
					{
						result = false;
						return false;
					}
				}
			}
		});
		return result;
	};

	LineBlockHelper.prototype.canResizeVertiLine = function(y, x, height, toBottom)
	{
		var self = this, yEdge = toBottom ? (y + height) : y, xEdge = x, $gridStack = self.detailView.$element.find(".grid-stack"),
			items = $gridStack.find(">.grid-stack-item:visible"), node, result = true;

		if (!toBottom)
		{
			return false;
		}

		$.each(items, function(index, item)
		{
			node = $(item).data('_gridstack_node');
			if (node.y === yEdge)
			{
				if (node.x < xEdge && node.x + node.width > xEdge)
				{
					result = false;
					return false;
				}
			}
		});
		return result;
	};

	LineBlockHelper.prototype.getVerticalLines = function()
	{
		var self = this, $gridStack = self.detailView.$element.find(".grid-stack"), $lines = $gridStack.find(".verti-line"),
			lineNodes = [];

		$lines.each(function(index, item)
		{
			lineNodes.push({
				x: parseInt($(item).attr('x')),
				y: parseInt($(item).attr('y')),
				width: parseInt($(item).attr('width')),
				height: parseInt($(item).attr('height')),
				type: 'line',
				el: item,
				isVertical: true
			});
		});

		return lineNodes;
	};

	LineBlockHelper.prototype.resizeHeight = function(lineNode, height)
	{
		var self = this, $line = $(lineNode.el);
		if ($line)
		{
			$line.attr({
				height: height
			}).height(height * (self.detailView.UNITHEIGHT + 1));
		}
	};

	LineBlockHelper.prototype.serializeLines = function($lines)
	{
		var self = this, items = [], $line;
		$.each($lines, function(index, line)
		{
			$line = $(line);
			item = {
				x: parseInt($line.attr("x")),
				y: parseInt($line.attr("y")),
				type: $line.hasClass("hori-line") ? "horizontalLine" : "verticalLine"
			};
			item.w = $line.attr("width") ? parseInt($line.attr("width")) : 0;
			item.h = $line.attr("height") ? parseInt($line.attr("height")) : 0;

			items.push(item);

		});
		return items;
	};

	LineBlockHelper.prototype.dispose = function()
	{
	};
})();