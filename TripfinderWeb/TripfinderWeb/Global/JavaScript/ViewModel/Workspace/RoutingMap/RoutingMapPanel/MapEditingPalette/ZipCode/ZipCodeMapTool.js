(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeMapTool = ZipCodeMapTool;
	function ZipCodeMapTool(map, arcgis, type, viewModel)
	{
		var self = this;
		self._map = map;
		self.dataModel = viewModel.dataModel;
		self.viewModel = viewModel;
		self._arcgis = arcgis;
		self.paletteType = type;
		TF.RoutingMap.EsriTool.call(self, self._map, self._arcgis, viewModel.viewModel);

		self.initialize();
		this.dataModel.zipCodeCollectionChangedEvent.subscribe(this.onZipCodeCollectionChanged.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(self));
		// self.dataModel.travelRegionPropertyChangedEvent.subscribe(this.ontravelRegionPropertyChangedEvent.bind(this));
		self.dataModel.onSettingChangeEvent.subscribe(self.initializeSettings.bind(this));
	}
	ZipCodeMapTool.prototype = Object.create(TF.RoutingMap.EsriTool.prototype);
	ZipCodeMapTool.prototype.constructor = ZipCodeMapTool;

	ZipCodeMapTool.prototype.initialize = function()
	{
		var self = this;
		var layerIds = { polygonLayerId: "zipCodeLayer" };
		self.initializeBase.apply(self, [layerIds]);
		self.initializeSettings();
	}

	ZipCodeMapTool.prototype.getPaletteName = function()
	{
		return "ZipCode";
	};

	ZipCodeMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.viewModel.dataModel.getZipCodeSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNode;
			self._allowOverlap = !setting.removeOverlapping;
		})
	}

	ZipCodeMapTool.prototype.onZipCodeCollectionChanged = function(e, items)
	{
		var self = this;
		if (items.delete.length > 0)
		{
			items.delete.map(function(item)
			{

				self._deleteBoundary(item);
			});
		}
		if (items.add.length > 0 && self._polygonLayer.visible)
		{
			self._addBoundary(items.add);
		}
	};

	ZipCodeMapTool.prototype._addBoundary = function(items)
	{
		var self = this;
		var symbol = self.symbol.postalCodePolygonSymbol();
		items = $.isArray(items) ? items : [items];
		self._polygonLayer.addMany(items.map((item) =>
		{
			var geometry = new self._arcgis.Polygon({ spatialReference: self._map.mapView.spatialReference, rings: item.geometry.rings.slice() });
			return new self._arcgis.Graphic({
				geometry: geometry,
				symbol: symbol,
				attributes: { "dataModel": item }
			});
		}));
	};

	ZipCodeMapTool.prototype._deleteBoundary = function(item)
	{
		var self = this;
		self._polygonLayer.remove(self._findGraphicInLayerById(self._polygonLayer, item.id));
	};

	ZipCodeMapTool.prototype.addPolygonToLayer = function(graphic)
	{
		var self = this;

		graphic = self.removeOverlapBoundary(graphic);
		if (!graphic.geometry && !self._allowOverlap)
		{
			return this._warningDialogBox("Remove Overlapping Boundaries is set as true");
		}

		this.viewModel.zipCodeEditModal.create(graphic).then(function()
		{
			self.sketchTool._drawingLayer.removeAll();
		});
	}

	ZipCodeMapTool.prototype.onTravelRegionCollectionChanged = function(e, items)
	{
		var self = this;
		if (items.delete.length > 0)
		{
			items.delete.map(function(item)
			{

				self._deleteBoundary(item);
			});
		}
		if (items.add.length > 0)
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

	ZipCodeMapTool.prototype.onHighlightChangedEvent = function()
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

	ZipCodeMapTool.prototype.ontravelRegionPropertyChangedEvent = function(e, item)
	{
		var self = this;
		self.changeSymbolMeetStatus(item.id);
	};

	ZipCodeMapTool.prototype.changeSymbolMeetStatus = function(id)
	{
		var self = this;
		var graphic = self._findGraphicInLayerById(self._polygonLayer, id);
		if (graphic)
		{
			var polygonSymbol = self.symbol.postalCodePolygonSymbol();

			var isHighlighted = self.viewModel.dataModel.isHighlighted(id);
			if (isHighlighted)
			{
				polygonSymbol.outline = self.symbol.getHighlightLineSymbol();
			}
			graphic.symbol = polygonSymbol;
		}
	};
})();