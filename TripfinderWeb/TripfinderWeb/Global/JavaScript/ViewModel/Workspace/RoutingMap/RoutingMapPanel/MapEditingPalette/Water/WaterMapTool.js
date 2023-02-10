(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterMapTool = WaterMapTool;
	function WaterMapTool(map, arcgis, type, viewModel)
	{
		var self = this;
		self._map = map;
		self.dataModel = viewModel.dataModel;
		self.viewModel = viewModel;
		self._arcgis = arcgis;
		self.paletteType = type;
		self.isTileRender = true;
		TF.RoutingMap.EsriFeatureTool.call(self, self._map);

		self.initialize();
		self.dataModel.onAllChangeEvent.subscribe(this.onChangeEvent.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(self));
		self.dataModel.settingChangeEvent.subscribe(self.initializeSettings.bind(this));
	}

	WaterMapTool.prototype = Object.create(TF.RoutingMap.EsriFeatureTool.prototype);
	WaterMapTool.prototype.constructor = WaterMapTool;

	WaterMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializeBase({
			polyline: {
				id: "waterPolylineLayer",
				symbol: self.symbol.waterPolylineSymbol()
			},
			polygon: {
				id: "waterPolygonLayer",
				symbol: self.symbol.waterPolygonSymbol()
			}
		});

		self.initializeSettings();
	};

	WaterMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.viewModel.dataModel.getSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNodes;
			self._allowOverlap = !setting.removeOverlapping;
		});
	};

	WaterMapTool.prototype.otherFields = function()
	{
		return this.viewModel.viewModel._viewModal.mapLayersPaletteViewModel.waterDisplaySetting.getLabelFields();
	};

})();