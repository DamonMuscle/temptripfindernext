(function()
{
	createNamespace("TF.RoutingMap").RoutingMapPanelViewModel = RoutingMapPanelViewModel;

	/**
	 * Constructor of RoutingMapPanelViewModel
	 * @param {array} dataSource The data source of panel items.
	 * @param {boolean} isLeft Determine if the panel is docking to left or right.
	 * @param {string} name The name of current panel.
	 * @param {boolean} isScrollable Determine if panel's content is scrollable.
	 * @param {object} position the panel position
	 * @param {string} routeState routeState to unique the panel
	 * @returns {void}
	 */
	function RoutingMapPanelViewModel(dataSource, isLeft, name, isScrollable, position, routeState, viewModel)
	{
		var self = this;
		self.$panel = null;
		self.$resizeHandle = null;
		self.$sliderHandle = null;
		self.palettes = ko.observableArray(dataSource);
		self.isScrollable = isScrollable;
		self.currentPanel = null;
		self.name = name;
		self.routeState = routeState;
		self.routingMapDocumentViewModel = viewModel;

		self.draggingPalette = null;
		self.pressPosition = null;
		self.toggleContent = self.toggleContent.bind(self);
		self.mouseDown = self.mouseDown.bind(self);
		self.togglePanel = self.togglePanel.bind(self);
		self.isPanelCollapse = ko.observable(false);
		self.obTitle = ko.computed(function()
		{
			var title = '';
			var activePalettes = self.palettes().filter(function(palette)
			{
				return palette.obShow();
			});
			if (self.isPanelCollapse() && activePalettes.length > 0)
			{
				$.each(activePalettes, function(index, palette)
				{
					title += palette.title;
					if (index != activePalettes.length - 1)
					{
						title += ', ';
					}
				});
			}
			return title;
		});
		self.position = position;
		self.obVisible = ko.observable(true);
		ko.computed(function()
		{
			var visible = false;
			$.each(self.palettes(), function(index, palette)
			{
				if (palette.obShow())
				{
					visible = true;
					return false;
				}
			});
			self.obVisible(visible);
		}, this);

		if (isLeft === null)
		{
			self.obDockStyle = ko.observable("");
		}
		else
		{
			self.obDockStyle = ko.observable(isLeft ? "dock-left" : "dock-right");
		}
		self.init = self.init.bind(self);

		self.dockStatusChangedHandler = new TF.Events.Event();
		self.panelSizeChangedHandler = new TF.Events.Event();
		self.panelMutationObservedHandler = new TF.Events.Event();

		// Bind the panel viewModel to the item and add event listener
		$.each(dataSource, function(index, item)
		{
			item.panel = self;
			item.dockLeft = isLeft;
			item.obShow(true);
			self.dockStatusChangedHandler.subscribe(item.onDockStatusChanged.bind(item));
			self.panelSizeChangedHandler.subscribe(item.onPanelSizeChanged.bind(item));
		});

		this.bindSelfToPalette();
		this.palettes.subscribe(this.bindSelfToPalette, this);

		this.firstShowPaletteIndex = ko.computed(self.addIsFirstClass.bind(self));
	}

	RoutingMapPanelViewModel.prototype = Object.create(TF.RoutingMap.RoutingMapPanelViewModel.prototype);
	RoutingMapPanelViewModel.prototype.constructor = RoutingMapPanelViewModel;

	RoutingMapPanelViewModel.prototype.addIsFirstClass = function()
	{
		if (this.$panel)
		{
			var list = this.$panel.children(".list-container").children().children();
			list.removeClass("isfirst");
		}
		for (var i = 0; i < this.palettes().length; i++)
		{
			if (this.palettes()[i].obShow())
			{
				if (this.$panel)
				{
					list.eq(i).addClass("isfirst");
				}
				return i;
			}
		}
	};

	RoutingMapPanelViewModel.prototype.bindSelfToPalette = function()
	{
		var self = this;
		this.palettes().forEach(function(palette)
		{
			palette.$parent = self;
			palette.panel = self;
		});
	};

	/**
	 * Toggle the content of palette.
	 * @param {type} model Bound view model
	 * @param {type} e Event argument
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.toggleContent = function(model, e)
	{
		var self = this,
			content = $(e.target).closest(".item-container").children(".item-content");

		if ($(e.target).closest(".item-header-helper").hasClass("disable"))
		{
			return;
		}

		if (!content.is(":animated"))
		{
			content.animate({ height: "toggle", }, {
				duration: 500,
				done: function()
				{
					self.panelSizeChangedHandler.notify();
					self.afterContentToggle();
					ko.dataFor(content.closest(".item-container")[0]).isOpen = content.css("display") != "none";
				}
			});
		}
	};

	/**
	 * Remove the palette panel.
	 * @param {type} model Bound view model
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.removePanel = function()
	{
		var self = this;
		var routingMapDocViewModel = self._viewModal;
		var mapTool = routingMapDocViewModel.RoutingMapTool;
		if (!mapTool) return;
		var menuItem = null;
		mapTool.rootMenuItem.enum(mapTool.rootMenuItem, function(item)
		{
			if (item.header && item.header == self.title)
			{
				menuItem = item;
			}
		});
		if (menuItem)
		{
			menuItem.onclick();
			// menuItem.toggleStatus = false;
		}
	};

	/**
	 * Fired after mouse down.
	 * @param {type} model Bound view model
	 * @param {type} e Event argument
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.mouseDown = function()
	{
		return;
	};

	/**
	 * Collapse/Expand the panel.
	 * @param {type} viewModel Bound view model
	 * @param {type} e Event argument
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.togglePanel = function()
	{
		var self = this, width, isLeft, animateOption;
		if (!self.$panel || self.$panel.length <= 0 || self.$panel.is(":animated"))
		{
			return;
		}

		width = self.$panel.outerWidth();
		isLeft = self.$panel.hasClass("dock-left");

		if (self.$panel.hasClass("in"))
		{
			self.isPanelCollapse(false);
			self.$panel.removeClass("in");
			animateOption = isLeft ? {
				left: 0
			} : {
					right: 0
				};
		}
		else
		{
			self.isPanelCollapse(true);
			self.$panel.addClass("in");
			animateOption = isLeft ? {
				left: 0 - width
			} : {
					right: 0 - width
				};
		}
		self.$panel.animate(animateOption, 500);
		setTimeout(function()
		{
			self.routingMapDocumentViewModel.autoPan.resetAutoPanZone();
		}, 500);

		self.$panel.find('.esri-search__suggestions-menu').hide();
	};

	/**
	 * create mutation observer for the RoutingMapPanel
	 * @param { dom } element
	 */
	RoutingMapPanelViewModel.prototype._createMutationObserver = function(element)
	{
		var self = this,
			observer = new MutationObserver(function()
			{
				self.panelMutationObservedHandler.notify();
			}),
			observerConfig =
			{
				attributes: true,
				childList: true,
				subtree: true,
				characterData: false
			},
			targetNode = element;
		observer.observe(targetNode, observerConfig);

		return observer;
	};

	/**
	 * Initialize.
	 * @param {any} model Bound view model
	 * @param {any} e Event argument
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.init = function(model, e)
	{
		var self = this;
		self.$panel = $(e);
		self.$panel.addClass("routingmap_panel" + self.routeState);
		self.$mapPage = self.$panel.closest(".map-page");
		if (self.position && self.obDockStyle() === "")
		{
			self.$panel.css({ "top": self.position.top + "px", "left": self.position.left + "px" });
		}

		self.$resizeHandle = self.$panel.find(".resize-handle");
		self.$sliderHandle = self.$panel.find(".panel-handle");
		self.routingMapDocumentViewModel.routingMapPanelManager.setDockPanelStyle(self.$panel, self.$mapPage);
		self.mutationObserver = self._createMutationObserver(e);
		self.initPalettes();
	};

	RoutingMapPanelViewModel.prototype.initPalettes = function()
	{
		var self = this;
		if (self.needInitPalettes != false)
		{
			setTimeout(function()
			{
				self.palettes().forEach(function(palette)
				{
					self._appendPalette(palette);
				});
				self.addIsFirstClass();
			});
		}
	};

	RoutingMapPanelViewModel.prototype.appendNewPalette = function(palette)
	{
		var self = this;
		self.palettes.push(palette);
		self._appendPalette(palette);
		self.addIsFirstClass();
	};

	RoutingMapPanelViewModel.prototype._appendPalette = function(palette)
	{
		var self = this;
		var container = self.$panel.find(".list");
		var paletteDom = $("<div data-bind=\"template: { name: templateName, data: $data, afterRender: $data.afterRender.bind($data) }\"></div>");
		container.append(paletteDom[0]);
		ko.applyBindings(palette, paletteDom[0]);
	};

	/**
	* To be called when the content is expanded or collapsed.
	* @returns {void} 
	*/
	RoutingMapPanelViewModel.prototype.afterContentToggle = function()
	{
		var self = this,
			maxTop = self.$panel.closest(".map-page").find(".map_panel").outerHeight() - self.$panel.outerHeight();

		if (maxTop < self.$panel.offset().top - 45)
		{
			self.$panel.css("top", maxTop);
		}
	};

	/**
	 * Dispose the panel.
	 * @returns {void} 
	 */
	RoutingMapPanelViewModel.prototype.dispose = function()
	{
		var self = this;
		self.mutationObserver.disconnect();
		self.$panel.off("." + self.name);
		self.$panel.parent().remove();
		$.each(self.palettes(), function(index, palette)
		{
			palette.dispose();
		});

		tfdispose(self);
	};
})();