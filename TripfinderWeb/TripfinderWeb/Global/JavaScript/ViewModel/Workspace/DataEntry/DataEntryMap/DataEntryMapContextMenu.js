(function()
{
	createNamespace("TF.DataEntry").DataEntryMapContextMenu = DataEntryMapContextMenu;

	function DataEntryMapContextMenu(dataEntryMap, viewModels)
	{
		this.dataEntryMap = dataEntryMap;
		this.viewModels = viewModels;
		this.selectedMenuItemHeader = [];
		this.mapviewHandler = []
		this.showContextMenuTimer = null;
		this.token = PubSub.subscribe("clear_ContextMenu_Operation", this.clearOperation.bind(this));
	}

	DataEntryMapContextMenu.prototype.init = function()
	{
		this.mapviewHandler = this.mapviewHandler.concat([
			this.setUpClickHandler(),
			TF.Helper.MapHelper.bind(this.dataEntryMap._map, "zoom-start", this.removeContextMenu)
		]);
	};

	DataEntryMapContextMenu.prototype.setUpClickHandler = function()
	{
		if (!this.dataEntryMap._map) return;

		var self = this,
			mapView = self.dataEntryMap._map.mapView;
		return mapView.on("click", function(e)
		{
			if (e.button == 2)
			{
				var mapPoint = e.mapPoint;
				self.showContextMenu(e.native, mapPoint);
			}
			else
			{
				self.removeContextMenu();
			}
		});
	};

	DataEntryMapContextMenu.prototype.show = function(e, mapPoint)
	{
		var self = this;
		self.showContextMenuTimer = setTimeout(function()
		{
			self.showContextMenu(e, mapPoint);
		}, 200);
	};

	DataEntryMapContextMenu.prototype.showContextMenu = function(e, mapPoint)
	{
		var self = this;
		var graphics = self.getIntersectGraphics(mapPoint);

		var contextMenu = self.buildContextMenuInternal(self.dataEntryMap.element.closest("div.doc"), graphics);

		if (contextMenu && contextMenu.root.children.length == 0)
		{
			return;
		}

		contextMenu.onClickEvent = function(menuItem, e)
		{
			return self.onMenuItemClick.call(self, menuItem, e);
		};

		contextMenu.showMenu(e, null, 75, ".map-item");

		for (var i = 0; i < self.selectedMenuItemHeader.length; i++)
		{
			contextMenu.enumAllMenuItems(function(contextMenu, menuItem)
			{
				if (menuItem.config.data &&
					menuItem.config.data.id == self.selectedMenuItemHeader[i].id &&
					self.selectedMenuItemHeader[i].operation == menuItem.config.id)
				{
					self.setFontToBold(menuItem);
				}
			});
		}
	};

	DataEntryMapContextMenu.prototype.onMenuItemClick = function(menuItem)
	{
		if (menuItem.header.indexOf("Clear Geofinder Boundary") >= 0)
		{
			this.removeContextMenu();
			return;
		}
		var selectedMenuItem = null;
		if (menuItem.children.length > 0)
		{
			menuItem.children.some(function(child)
			{
				if (child.config.isDefault)
				{
					selectedMenuItem = child;
					return true;
				}
				return false;
			});
		} else selectedMenuItem = menuItem;

		if (selectedMenuItem == null)
		{
			return false;
		}
		if (selectedMenuItem.config.data)
		{
			for (var i = 0; i < this.selectedMenuItemHeader.length; i++)
			{

				if (this.selectedMenuItemHeader[i].id == selectedMenuItem.config.data.id &&
					this.selectedMenuItemHeader[i].operation == selectedMenuItem.config.id)
				{
					this.selectedMenuItemHeader[i].id = -1;
					this.selectedMenuItemHeader[i].operation = "";
					this.viewModels.forEach(function(viewModelData)
					{
						viewModelData.viewModel.drawTool && viewModelData.viewModel.drawTool.sketchTool.stop();
					});
					return false;
				}
				else
				{
					this.selectedMenuItemHeader[i].id = selectedMenuItem.config.data.id;
					this.selectedMenuItemHeader[i].operation = selectedMenuItem.config.id ? selectedMenuItem.config.id : "";
				}
			}
			if (this.selectedMenuItemHeader.length == 0)
			{
				this.selectedMenuItemHeader.push({
					id: selectedMenuItem.config.data.id,
					operation: selectedMenuItem.config.id ? selectedMenuItem.config.id : ""
				});
			}
		}
		return true;
	};

	DataEntryMapContextMenu.prototype._existOperateData = function(routeState)
	{
		return (this.selectedMenuItemHeader || []).some(function(item)
		{
			return item.routeState == routeState;
		});
	};

	DataEntryMapContextMenu.prototype.setFontToBold = function(menuItem)
	{
		menuItem.html.addClass('selected_operation');
		if (menuItem.parent != null && menuItem.parent.header != 'root')
		{
			this.setFontToBold(menuItem.parent);
		}
	};

	DataEntryMapContextMenu.prototype.setMenuItems = function(data)
	{
		var contextMenuCategories = {};
		this.viewModels.forEach(function(viewModel)
		{
			contextMenuCategories[viewModel.layerId] = [];
		});
		for (var i = 0; i < data.length; i++)
		{
			var menuItemData = data[i].attributes.dataModel;
			var layer = data[i].getLayer ? data[i].getLayer() : data[i].layer;
			var layerId = layer.id.toLowerCase();

			for (var j = 0; j < this.viewModels.length; j++)
			{
				var item = this.viewModels[j];
				if (layerId.toLowerCase().indexOf(item.layerId.toLowerCase()) >= 0)
				{
					contextMenuCategories[item.layerId].push(item.buildMenu.call(this, menuItemData, item.viewModel));
				}
			}
		}

		this.createClearMenu(contextMenuCategories);
		return contextMenuCategories;
	};

	DataEntryMapContextMenu.prototype.createClearMenu = function(contextMenuCategories)
	{
		var tempParentMenuItem;
		var self = this;
		var map = self.dataEntryMap._map;
		if (map.findLayerById("geoFinderDrawPolygonLayer") && map.findLayerById("geoFinderDrawPolygonLayer").graphics.length > 0)
		{
			initTempParentMenuItem();
			tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Clear Geofinder Boundary',
				click: function()
				{
					map.findLayerById("geoFinderDrawPolygonLayer").removeAll();
				}
			}));
		}

		if (map.findLayerById("searchPointLayer") && map.findLayerById("searchPointLayer").graphics.length > 0)
		{
			initTempParentMenuItem();
			tempParentMenuItem.addChild(new TF.RoutingMap.MenuItem({
				header: 'Clear Search Point',
				click: function()
				{
					map.findLayerById("searchPointLayer").removeAll();
				}
			}));
		}

		function initTempParentMenuItem()
		{
			if (!tempParentMenuItem)
			{
				tempParentMenuItem = new TF.RoutingMap.MenuItem({
					header: "default",
					icon: null,
					type: 'default'
				});
				tempParentMenuItem.displayName = "Clear";
			}
		}

		if (tempParentMenuItem)
		{
			contextMenuCategories["geoFinderDrawPolygonLayer"] = [tempParentMenuItem];
		}
	};

	DataEntryMapContextMenu.prototype.clearOperation = function()
	{
		this.selectedMenuItemHeader.map(function(item)
		{
			item.id = -1;
			item.operation = "";
		});
	};

	DataEntryMapContextMenu.prototype.createClickEvent = function(that)
	{
		return function(eventName)
		{
			var parameters = Array.prototype.slice.call(arguments, 1, arguments.length);
			return function() { that[eventName].apply(that, parameters); };
		};
	};

	DataEntryMapContextMenu.prototype.getIntersectGraphics = function(mapPoint)
	{
		var map = this.dataEntryMap._map;
		var extent = TF.Helper.MapHelper.getPointExtent(map, mapPoint);
		var graphics = [];
		this.viewModels.forEach(function(viewModelData)
		{
			var layers = viewModelData.viewModel.getLayers();
			layers.forEach(function(layer)
			{
				if (layer.visible && (layer.visibleAtMapScale == null || layer.visibleAtMapScale))
				{
					layer.graphics.map(function(graphic)
					{
						if (graphic && graphic.visible && extent.intersects(graphic.geometry))
						{
							graphics.push(graphic);
						}
					});
				}
			});
		});

		return graphics;
	};

	DataEntryMapContextMenu.prototype.getGeofinderGraphics = function()
	{
		var map = this.dataEntryMap._map;
		var layer = map.findLayerById("geoFinderDrawPolygonLayer");
		return layer.graphics;
	};

	DataEntryMapContextMenu.prototype.buildContextMenuInternal = function(container, graphics)
	{
		var contextMenu = new TF.RoutingMap.ContextMenu(container);
		var contextMenuCategories = this.setMenuItems(graphics);

		function createSecondLevelContextMenu(children)
		{
			for (var i = 0; i < children.length; i++)
			{
				var child = children[i];
				contextMenu.addChild(child);
			}
		}

		function addToContextMenu(menuItems)
		{
			if (menuItems.length > 0)
			{
				contextMenu.setChildren(menuItems[0].children);
			}
		}
		var allLength = 0;
		var multipleTypes = [];
		var key;
		for (key in contextMenuCategories)
		{
			var count = contextMenuCategories[key].length;
			allLength += count;
			if (count > 0)
			{
				multipleTypes.push(count);
			}
		}

		if (allLength > 1)
		{
			for (key in contextMenuCategories)
			{
				createSecondLevelContextMenu(contextMenuCategories[key]);
			}
		} else
		{
			for (key in contextMenuCategories)
			{
				addToContextMenu(contextMenuCategories[key]);
			}
		}
		if (multipleTypes.length > 1)
		{
			contextMenu.root.children = [];

			for (key in contextMenuCategories)
			{
				if (contextMenuCategories[key].length > 0)
				{
					var menuItem = new TF.RoutingMap.MenuItem({
						header: contextMenuCategories[key][0].displayName,
						icon: null
					});
					contextMenu.addChild(menuItem);
					if (contextMenuCategories[key].length > 1)
					{
						menuItem.setChildren(contextMenuCategories[key]);
					} else
					{
						menuItem.setChildren(contextMenuCategories[key][0].children);
					}
				}
			}
		}

		return contextMenu;
	};

	DataEntryMapContextMenu.prototype.removeContextMenu = function()
	{
		$(".menu.context-menu.right-click-menu").remove();
	};

	DataEntryMapContextMenu.prototype.dispose = function()
	{
		PubSub.unsubscribe(this.token);
		this.mapviewHandler.forEach(handler => handler && handler.remove && handler.remove())
		if (this.showContextMenuTimer)
		{
			clearTimeout(this.showContextMenuTimer)
		}
		this.removeContextMenu();
		tfdispose(this);
	};
})();