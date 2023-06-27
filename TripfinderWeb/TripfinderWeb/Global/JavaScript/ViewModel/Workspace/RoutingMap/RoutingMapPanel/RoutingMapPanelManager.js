(function()
{
	createNamespace("TF.RoutingMap").RoutingMapPanelManager = RoutingMapPanelManager;

	function RoutingMapPanelManager(viewModel)
	{
		this.viewModel = viewModel;
		this.routeState = viewModel.routeState;
		this.headDragged = false;
		this.defaultMaxHeight = 500;
		this.startPosition = {};
		this.movingPanel = null;
		this.placeholder = null;
	}
	var minPanelWidth = 418;
	var grayPadding = 20;

	RoutingMapPanelManager.prototype.init = function()
	{
		var self = this;
		self.initDrag();
		self.addDockShadow();
	};

	RoutingMapPanelManager.prototype.initDrag = function()
	{
		var self = this;
		self.headDragged = false;
		tf.documentEvent.unbind("mousedown.panel", self.routeState);
		tf.documentEvent.bind("mousedown.panel", self.routeState, function(e)
		{
			var pressPosition,
				type = "",
				target = $(e.target);

			if ($(e.target).closest(".routingmap_panel").length == 0)
			{
				return;
			}
			self.headDragged = false;
			pressPosition = [e.pageX, e.pageY];
			if (target.closest(".resize-handle").length > 0 || target.closest(".left-resize-handle").length > 0 || target.closest(".bottom-resize-handle").length > 0 || target.closest(".right-resize-handle").length > 0)
			{
				type = "resizePanel";
				self.resizingPanelStart(e, target);
			}
			else if (target.closest(".item-header-helper").length > 0)
			{
				type = "newPanel";
			}
			else if (target.closest(".routingmap_panel").length > 0 && target.closest(".list,.resize-handle,.slide-container").length == 0)
			{
				type = "dragPanel";
			}

			if (type == "")
			{
				return;
			}

			tf.documentEvent.bind("mousemove.panel", self.routeState, function(e)
			{
				if (type == "resizePanel")
				{
					self.resizingPanelMoving(e, target, pressPosition);
					return;
				}
				if (!self.headDragged && (Math.abs(pressPosition[0] - e.pageX) > 2 || Math.abs(pressPosition[1] - e.pageY) > 2))
				{
					if (type == "newPanel")
					{
						self.newPanelDragStart(e, target);
					}
					if (type == "dragPanel")
					{
						self.dragPanelStart(e, target);
					}
					if (self.movingPanel && self.movingPanel.length > 0)
					{
						ko.dataFor(self.movingPanel[0]).obDockStyle(null);
						self.headDragged = true;
						target.closest(".item-header-helper").addClass("disable");
						self.placeholder = $("<div></div>").addClass("platte-placeholder");
						self.placeholder.appendTo($("body"));
						self.placeholder.hide();
					}
				}

				if (self.headDragged && type == "newPanel")
				{
					self.newPanelMoving(e, target, type);
				}
				if (self.headDragged && type == "dragPanel")
				{
					self.dragPanelMoving(e, target, type);
				}
			});

			tf.documentEvent.bind("mouseup.panel", self.routeState, function()
			{
				setTimeout(function()
				{
					self.headDragged = false;
					$(".item-header-helper").removeClass("disable");
				});
				type = "";
				tf.documentEvent.unbind("mousemove.panel", self.routeState);
				tf.documentEvent.unbind("mouseup.panel", self.routeState);
				if (self.movingPanel)
				{
					const viewModelElement = self.movingPanel.closest(".dock-parent-container");
					viewModelElement.find(".routingmap_panel").css("z-index", 108);
					self.movingPanel.css("z-index", 109);
					const dockRightShadow = viewModelElement.find(".dock-right-shadow");
					const dockLeftShadow = viewModelElement.find(".dock-left-shadow");

					if (self.placeholder.css("display") == "block")
					{
						self.combinePanels();
					}
					else if (dockRightShadow.css("display") == "block")
					{
						self._dockPanel("right", viewModelElement);
					}
					else if (dockLeftShadow.css("display") == "block")
					{
						self._dockPanel("left", viewModelElement);
					}
					else
					{
						var panelViewModel = ko.dataFor(self.movingPanel[0]);
						panelViewModel.obDockStyle(null);
					}
					self.placeholder.remove();
				}
				self.movingPanel = null;
			});
		});
	};

	RoutingMapPanelManager.prototype.combinePanels = function()
	{
		var toPanelContainer = this.placeholder.closest(".routingmap_panel");
		var toPanel = ko.dataFor(toPanelContainer[0]);
		var panel = ko.dataFor(this.movingPanel[0]), palettes = [];
		palettes = $.extend(true, [], panel.palettes());

		panel.palettes.removeAll();
		var insertIndex = this.placeholder.parent().children().index(this.placeholder);
		var toPanelListContainer = toPanelContainer.children(".list-container").children(".list");
		for (var index = palettes.length - 1; index >= 0; index--)
		{
			var item = palettes[index];
			item.needInit = false;
			toPanelListContainer.children().eq(insertIndex).before(this.movingPanel.children(".list-container").children(".list").children().eq(index));
			toPanel.palettes.splice(insertIndex, 0, item);
		}
		var self = this;
		setTimeout(function()
		{
			panel.dispose();
			self.outerPalettes?.remove(panel);
		});
	};

	RoutingMapPanelManager.prototype.getRoutingMapPanel = function()
	{
		return "workspace/Routing Map/RoutingMapPanel/RoutingMapPanel";
	};

	RoutingMapPanelManager.prototype.newPanelDragStart = function(e, target)
	{
		var self = this;
		var draggingPaletteContainer = $(target).closest(".item-container");
		self.draggingPalette = ko.dataFor(draggingPaletteContainer[0]);
		var container = $(target).closest(".routingmap_panel").parent().parent(), panelDom;
		var startOffset = draggingPaletteContainer.offset();
		var mapOffset = $(target).closest(".map-page").offset();
		var mapPanel = ko.dataFor($(target).closest(".routingmap_panel")[0]);
		var $panel;
		if (mapPanel.palettes().length > 1)
		{
			mapPanel.palettes.remove(self.draggingPalette);
			panelDom = $("<div data-bind=\"template: { name: " + "'" + self.getRoutingMapPanel() + "'" + "}\"></div>");
			container.append(panelDom[0]);
			self.draggingPalette.needInit = false;
			self.newPanel = new TF.RoutingMap.RoutingMapPanelViewModel([self.draggingPalette], null, self.getUniqueName(), true, { left: startOffset.left - mapOffset.left - grayPadding, top: startOffset.top - mapOffset.top - grayPadding }, self.routeState, self.viewModel);
			self.newPanel.needInitPalettes = false;
			ko.applyBindings(self.newPanel, panelDom[0]);
			panelDom.find(".list").append(draggingPaletteContainer.parent());
			$panel = panelDom.find(".routingmap_panel");
			// self.updatePanelsStatus();
			self.newPanel.addIsFirstClass();
			mapPanel.addIsFirstClass();
		} else
		{
			$panel = $(target).closest(".routingmap_panel");
		}
		self.movePanelStart(e, $panel);
	};

	RoutingMapPanelManager.prototype.newPanelMoving = function(e, target, type)
	{
		var self = this;
		self.movePanel(e, target, type);
	};

	RoutingMapPanelManager.prototype.dragPanelStart = function(e, target)
	{
		var self = this;
		var $panel = $(target).closest(".routingmap_panel");
		self.movePanelStart(e, $panel);
	};

	RoutingMapPanelManager.prototype.dragPanelMoving = function(e, target, type)
	{
		var self = this;
		self.movingPanel = $(target).closest(".routingmap_panel");
		self.movePanel(e, target, type);
	};

	RoutingMapPanelManager.prototype.movePanelStart = function(e, $panel)
	{
		var startOffset = $panel.offset();
		var parentPadding = 40;
		this.movingPanel = $panel;
		$panel.css("z-index", 200);
		$panel.find(".list-container").css({ "max-height": this.viewModel.element.height() - parentPadding });
		this.startPosition = { pagePosition: { x: e.pageX, y: e.pageY }, offset: startOffset };
	};

	RoutingMapPanelManager.prototype.movePanel = function(e)
	{
		var self = this,
			$panel = self.movingPanel,
			mapPage = $panel.closest(".map-page"),
			containerRect = mapPage.find("canvas")[0].getBoundingClientRect(),
			pageX = e.pageX,
			pageY = e.pageY,
			leftMoveOffset = pageX - this.startPosition.pagePosition.x,
			topMoveOffset = pageY - this.startPosition.pagePosition.y,
			newLeft = this.startPosition.offset.left - containerRect.left + leftMoveOffset,
			newTop = this.startPosition.offset.top - containerRect.top + topMoveOffset;

		// touch left boundary
		if (newLeft < 0)
		{
			newLeft = 0;
		}
		// touch right boundary
		if (newLeft + $panel.outerWidth() >= containerRect.width)
		{
			newLeft = containerRect.width - $panel.outerWidth();
		}
		// touch bottom boundary
		if (newTop + $panel.outerHeight() >= containerRect.height)
		{
			newTop = containerRect.height - $panel.outerHeight();
		}
		// touch top boundary
		if (newTop < 0)
		{
			newTop = 0;
		}

		$panel.css({ left: newLeft / containerRect.width * 100 + '%', top: newTop });
		if (!self.highlightDock($panel))
		{
			var intersect = self.addPlaceholder(mapPage, $panel, e);
			if (!intersect)
			{
				self.placeholder.hide();
			}
		} else
		{
			self.placeholder.hide();
		}
	};

	RoutingMapPanelManager.prototype.intersect = function(panel1, panel2)
	{
		var offset1 = panel1.offset(),
			offset2 = panel2.offset();
		offset1.right = offset1.left + panel1.outerWidth();
		offset1.bottom = offset1.top + panel1.outerHeight();
		offset2.right = offset2.left + panel2.outerWidth();
		offset2.bottom = offset2.top + panel2.outerHeight();
		return offset1.left < offset2.right && offset1.right > offset2.left && offset1.top < offset2.bottom && offset1.bottom > offset2.top;
	};

	RoutingMapPanelManager.prototype.highlightDock = function($panel)
	{
		var leftPosition = parseInt($panel.css("left"));
		var dock = false;
		var mapPage = $panel.closest(".map-page");
		const dockLeftShadow = $panel.closest(".dock-parent-container").find(".dock-left-shadow");
		const dockRightShadow = $panel.closest(".dock-parent-container").find(".dock-right-shadow");

		dockLeftShadow.css("display", "none");
		dockRightShadow.css("display", "none");

		// dock right
		if (mapPage[0].clientWidth - leftPosition - $panel.outerWidth() < 10)
		{
			dockRightShadow.css("display", "block");
			dock = true;
		}
		// dock left
		else if (leftPosition < 10)
		{
			dockLeftShadow.css("display", "block");
			dock = true;
		}

		// set dock shadow height
		dockLeftShadow.add(dockRightShadow).height(mapPage.height() - 204);
		return dock;
	};

	RoutingMapPanelManager.prototype.addPlaceholder = function(mapPage, $panel)
	{
		var self = this;
		var intersect = false;
		mapPage.find(".routingmap_panel").not($panel).each(function(pIndex, panel)
		{
			if (self.intersect($(panel), $panel) && !intersect)
			{
				intersect = true;
				var offsetsTops = [$(panel).offset().top];
				$(panel).children(".list-container").children(".list").children().not(self.placeholder).each(function(index, palette)
				{
					offsetsTops.push($(palette).offset().top + $(palette).outerHeight() / 2);
				});
				var panelTop = $panel.offset().top;
				var index = 0;
				offsetsTops.forEach(function(top, i)
				{
					if (panelTop > top)
					{
						index = i;
					}
				});
				self.placeholder.show();
				var palettes = $(panel).children(".list-container").children(".list").children().not(self.placeholder);
				if (palettes.length > index)
				{
					palettes.eq(index).before(self.placeholder);
				} else
				{
					palettes.eq(index - 1).after(self.placeholder);
				}
				if (self.placeholder.next().hasClass("isfirst") || self.placeholder.prev().length == 0)
				{
					self.placeholder.css({
						marginTop: 0,
						marginBottom: 20
					});
				} else
				{
					self.placeholder.css({
						marginTop: 20,
						marginBottom: 0
					});
				}
				// auto scroll
				var scrollableDiv = self.placeholder.closest(".scrollable");
				var nowTop = scrollableDiv.scrollTop();
				if ($panel.offset().top < scrollableDiv.offset().top)
				{
					scrollableDiv.scrollTop(nowTop - 10);
				} else if ($panel.offset().top + $panel.outerHeight() > scrollableDiv.offset().top + scrollableDiv.outerHeight())
				{
					scrollableDiv.scrollTop(nowTop + 10);
				}
			}
		});
		return intersect;
	};

	/**
 * Get the unique name for current panel.
 * @returns {string} name of the panel.
 */
	RoutingMapPanelManager.prototype.getUniqueName = function()
	{
		var panels = this.viewModel.element.find(".routingmap_panel"), panelViewModel, maxId = 0, currentId, prefix = "routingmappanel";
		$.each(panels, function(index, panel)
		{
			panelViewModel = ko.dataFor(panel);
			currentId = parseInt(panelViewModel.name.substr(prefix.length));
			if (maxId < currentId)
			{
				maxId = currentId;
			}
		});
		return prefix + ++currentId;
	};

	/**
	 * Dock the panel to the left/right side.
	 * @returns {void} 
	 */
	RoutingMapPanelManager.prototype._dockPanel = function(leftRight, viewModelElement)
	{
		var self = this,
			dockCss = "dock-" + leftRight,
			container = viewModelElement,
			dockedPanel = container.find("." + dockCss),
			panel,
			panelViewModel = ko.dataFor(self.movingPanel[0]);

		const dockRightShadow = container.find(".dock-right-shadow");
		const dockLeftShadow = container.find(".dock-left-shadow");

		self.placeholder.remove();
		if (dockedPanel.length <= 0)
		{
			panelViewModel.obDockStyle(dockCss);
			panelViewModel.dockStatusChangedHandler.notify(dockCss);
			self.movingPanel.css({ top: "", left: "" });
			self.setDockPanelStyle(self.movingPanel, container);
			self.movingPanel.find(".list").css("max-height", "auto");
		}
		else
		{
			panel = ko.dataFor(dockedPanel[0]);
			var toPanelListContainer = dockedPanel.closest(".routingmap_panel").children(".list-container").children(".list");
			var movingPanelChildren = self.movingPanel.children(".list-container").children(".list").children();
			$.each(panelViewModel.palettes(), function(index, item)
			{
				item.needInit = false;
				toPanelListContainer.append(movingPanelChildren.eq(index));
				panel.palettes.push(item);
			});
			panelViewModel.palettes.removeAll();

			setTimeout(function()
			{
				panelViewModel.dispose();
				self.outerPalettes?.remove(panelViewModel);
			});
		}
		dockedPanel.find(".pannel-item-content").each(function(i, item)
		{
			var $item = $(item);
			$item.data("maxHeight", self.defaultMaxHeight);
		});

		dockLeftShadow.css("display", "none");
		dockRightShadow.css("display", "none");
	};

	RoutingMapPanelManager.prototype.setDockPanelStyle = function(panel, container)
	{
		panel.find(".list-container").css({ "max-height": container.height() - 155, "height": "auto" });
	};

	/**
	 * Add dock shadow to body
	 * @returns {void} 
	 */
	RoutingMapPanelManager.prototype.addDockShadow = function()
	{
		var container = this.viewModel.element;
		container.addClass("dock-parent-container");

		const dockRightShadow = container.find(".dock-right-shadow");
		const dockLeftShadow = container.find(".dock-left-shadow");

		dockLeftShadow.length <= 0 && container.append("<div class='dock dock-left-shadow'>");
		dockRightShadow.length <= 0 && container.append("<div class='dock dock-right-shadow'>");
	};

	RoutingMapPanelManager.prototype.resizingPanelStart = function(e, target)
	{
		var $panel = $(target).closest(".routingmap_panel");
		$panel.find(".pannel-item-content").each(function(i, item)
		{
			var $item = $(item),
				maxHeight = parseInt($item.css("max-height"));
			$item.data("maxHeight", maxHeight);
		});
		var mapPage = $panel.closest(".map-page");
		var mapPageHeight = mapPage.height();
		this.isDockRight = $panel.hasClass("dock-right");
		this.isDockLeft = $panel.hasClass("dock-left");
		this.isBottomResize = $(target).hasClass("bottom-resize-handle");
		this.isLeftResize = $(target).hasClass("left-resize-handle");
		this.isRightResize = $(target).hasClass("right-resize-handle");
		var maxBottom = this.isDockRight || this.isDockLeft ? (mapPageHeight - 70) : mapPageHeight;
		var padding = parseInt($panel.css("padding-top")) + parseInt($panel.css("padding-bottom"));
		this.maxPanelContentHeight = maxBottom - ($panel.offset().top - mapPage.offset().top) - padding;
		this.panelStartHeight = $panel.outerHeight() - padding;
		// change panel height to auto when content height is smaller than container
		if (ResizeObserver)
		{
			var timeOutEvent;
			var listContainer = $panel.find(".list-container.scrollable");
			new ResizeObserver(function()
			{
				clearTimeout(timeOutEvent);
				timeOutEvent = setTimeout(function()
				{
					var contentHeight = listContainer.children().height();
					if (listContainer.height() >= contentHeight)
					{
						listContainer.height("auto");
					}
				}, 50);
			}).observe(listContainer.children()[0]);
		}
	};

	RoutingMapPanelManager.prototype.resizingPanelMoving = function(e, target, pressPosition)
	{
		var self = this;
		var handlerWidth = 0,
			bufferWidth = 100,
			width,
			height,
			$panel = $(target).closest(".routingmap_panel"),
			isDockRight = this.isDockRight,
			isDockLeft = this.isDockLeft,
			isBottomResize = this.isBottomResize,
			isLeftResize = this.isLeftResize,
			isRightResize = this.isRightResize,
			mapPage = $panel.closest(".map-page"),
			mapPageOffset = mapPage.offset(),
			panelOffset = $panel.offset();

		if (!isBottomResize)
		{
			if (isDockRight)
			{
				width = mapPageOffset.left + mapPage.width() - e.pageX + handlerWidth;
			}
			else if (isDockLeft)
			{
				width = e.pageX - mapPageOffset.left + handlerWidth;
			}
			else if (isLeftResize)
			{
				width = panelOffset.left - e.pageX + parseInt($panel.css("width"));
			}
			else if (isRightResize)
			{
				width = Math.abs(e.pageX - panelOffset.left);
			}

			if (width)
			{
				// Edge test
				width = Math.min(Math.max(width, minPanelWidth + handlerWidth), mapPage.width() - bufferWidth);
				if (isLeftResize || isRightResize)
				{
					if (parseInt($panel.css("left")) + width + bufferWidth > mapPage.width())
					{
						width = mapPage.width() - parseInt($panel.css("left"));
					}
				}
				if (isLeftResize)
				{
					$panel.css("left", parseInt($panel.css("left")) - (width - parseInt($panel.css("width"))));
				}
				$panel.css("width", width);
				if (ko.dataFor($panel[0]))
				{
					ko.dataFor($panel[0]).panelSizeChangedHandler.notify({ "width": width });
				}
			}
		}
		else
		{
			// resize panel height
			var diffY = e.pageY - pressPosition[1];
			var listContainer = $panel.find(".list-container.scrollable");
			var contentHeight = listContainer.children().height();
			height = self.panelStartHeight + diffY;
			height = Math.min(height, contentHeight, self.maxPanelContentHeight);
			listContainer.height(Math.max(height, 0));
			if (height >= contentHeight || height == self.maxPanelContentHeight)
			{
				listContainer.height("auto");
			}
			if (height != self.maxPanelContentHeight)
			{
				var notScrollableDivHeight = 105;
				// set each panel content max height
				$panel.find(".pannel-item-content").each(function(i, item)
				{
					var $item = $(item),
						childHeight = 0;
					$item.children().each(function(j, child)
					{
						childHeight += $(child).outerHeight();
					});
					var newMaxHeight = $item.data("maxHeight") + diffY;
					if (childHeight >= self.defaultMaxHeight && newMaxHeight >= self.defaultMaxHeight)
					{
						$item.css("max-height", Math.min(newMaxHeight, childHeight, self.maxPanelContentHeight - notScrollableDivHeight));
						return false;
					}
				});
			}
		}
	};

	RoutingMapPanelManager.prototype.dispose = function()
	{
		tfdispose(this);
	};
})();