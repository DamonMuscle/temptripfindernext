(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionMapTool = TravelRegionMapTool;
	function TravelRegionMapTool(map, arcgis, type, viewModel)
	{
		var self = this;
		self._map = map;
		self.dataModel = viewModel.dataModel;
		self.viewModel = viewModel;
		self._arcgis = arcgis;
		self.paletteType = type;
		TF.RoutingMap.EsriTool.call(self, self._map);

		self.initialize();
		self.dataModel.travelRegionCollectionChangedEvent.subscribe(this.onTravelRegionCollectionChanged.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(self));
		self.dataModel.travelRegionPropertyChangedEvent.subscribe(this.ontravelRegionPropertyChangedEvent.bind(this));
		self.dataModel.onSettingChangeEvent.subscribe(self.initializeSettings.bind(this));
	}
	TravelRegionMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	TravelRegionMapTool.prototype.constructor = TravelRegionMapTool;

	TravelRegionMapTool.prototype.initialize = function()
	{
		var self = this;
		var layerIds = { polygonLayerId: "travelRegionLayer" };
		self.initializeBase.apply(self, [layerIds]);
		self.viewModel.layers.push(layerIds.polygonLayerId);
		self.initializeSettings();
	};

	TravelRegionMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.viewModel.dataModel.getTravelRegionSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNode;
			self._allowOverlap = !setting.removeOverlapping;
		});
	};

	TravelRegionMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;
		graphic = self.removeOverlapBoundary(graphic);
		if (!graphic.geometry && !self._allowOverlap)
		{
			return this._warningDialogBox("Remove Overlapping Boundaries is set as true");
		}
		this.viewModel.travelRegionEditModal.create(graphic).then(function()
		{
			self.sketchTool.stopAndClear();
		});
	};

	TravelRegionMapTool.prototype.onTravelRegionCollectionChanged = function(e, items)
	{
		var self = this;
		if ($.isArray(items.delete))
		{
			items.delete.map(function(item)
			{

				self._deleteBoundary(item);
			});
		}

		if ($.isArray(items.add))
		{
			items.add.map(function(item)
			{
				if (item.type != null)
				{
					self._addBoundary(item);
				}
			});
		}
	};

	TravelRegionMapTool.prototype.onHighlightChangedEvent = function()
	{
		var self = this;

		self._polygonLayer.graphics.items.forEach(function(graphic)
		{
			if (graphic.attributes.dataModel)
			{
				self.changeSymbolMeetStatus(graphic.attributes.dataModel.id, graphic);
			}
		});
	};

	TravelRegionMapTool.prototype.ontravelRegionPropertyChangedEvent = function(e, item)
	{
		var self = this;
		self.changeSymbolMeetStatus(item.id);
	};

	TravelRegionMapTool.prototype.changeSymbolMeetStatus = function(id)
	{
		var self = this;
		var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
		// polygonSymbol = $.extend(true, {}, self._polygonSymbolCreate),
		// highlightPolygonSymbol = $.extend(true, {}, self._highlightPolygonSymbol);
		if (graphic)
		{
			var color = TF.Color.toLongColorFromHTMLColor(self.viewModel.dataModel.getColorByType(graphic.attributes.dataModel.type)),
				fillPattern = 1;

			var polygonSymbol = self._computeSymbol(color, fillPattern / 2, false);
			// var highlightPolygonSymbol.setColor(self._computeColor(color, fillPattern / 2));

			var isHighlighted = self.viewModel.dataModel.isHighlighted(id);
			// var isEditing = self._isCurrentEditing(id);
			// var isRedraw = self._mode == "redraw" && self._currentRightClickPolygonId == id;
			// if (isRedraw)
			// {
			// 	polygonSymbol = self._polygonSymbolRedraw;
			// } else if (isEditing)
			// {
			// 	polygonSymbol = self._polygonSymbolEditing;
			// 	self._changeVertexSymbol(graphic.attributes.dataModel.color);
			// } else
			if (isHighlighted)
			{
				polygonSymbol.outline = self.symbol.getHighlightLineSymbol();
			}
			// self._changeSymbol(id, polygonSymbol, isEditing, isHighlighted, graphic);
			graphic.symbol = polygonSymbol;
		}
	};

	TravelRegionMapTool.prototype._addBoundary = function(item)
	{
		item.color = TF.Color.toLongColorFromHTMLColor(this.viewModel.dataModel.getColorByType(item.type));
		var self = this,
			symbol = self._computeSymbol(item.color, 1 / 2, item.isHighlighted);

		var geometry = new self._arcgis.Polygon({ spatialReference: self._map.mapView.spatialReference, rings: JSON.parse(JSON.stringify(item.geometry.rings)) });
		self._polygonLayer.add(new self._arcgis.Graphic({ geometry: geometry, symbol: symbol, attributes: { 'dataModel': item } }));
	};

	TravelRegionMapTool.prototype._deleteBoundary = function(item)
	{
		var self = this;
		self._polygonLayer.remove(self._findGraphicInLayerById(self._polygonLayer, item.id));
	};

	TravelRegionMapTool.prototype.transformCallback = function(graphics)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		if (!graphics)
		{
			self._oldBoundaryGraphic.symbol = self._oldBoundarySymbol;
			return;
		}

		var checkPromise = Promise.resolve(false);
		if (graphics.length === 1 && graphics[0].attributes.dataModel.type === 2)
		{
			checkPromise = TF.RoutingMap.TravelScenariosPalette.TravelRegionsViewModel.isTripStopInTravelRegion(graphics[0].geometry, this.viewModel.dataModel.selectedTravelScenarioId);
		}
		return checkPromise.then((isStopInTravelRegion) =>
		{
			if (isStopInTravelRegion)
			{
				// revert to original geometry
				graphics[0].geometry = self._oldBoundaryGraphic.geometry;
			}

			return TF.RoutingMap.EsriTool.prototype.transformCallback.call(this, graphics);
		});
	};
})();