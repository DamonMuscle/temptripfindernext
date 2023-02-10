(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkMapTool = LandmarkMapTool;
	function LandmarkMapTool(map, arcgis, type, viewModel)
	{
		var self = this;
		self._map = map;
		self.dataModel = viewModel.dataModel;
		self.viewModel = viewModel;
		self.editModal = viewModel.editModal;
		self._arcgis = arcgis;
		self.paletteType = type;
		TF.RoutingMap.EsriFeatureTool.call(self, self._map);

		self.initialize();
		self.dataModel.onAllChangeEvent.subscribe(this.onChangeEvent.bind(this));
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChangedEvent.bind(self));
		self.dataModel.settingChangeEvent.subscribe(self.initializeSettings.bind(this));
	}
	LandmarkMapTool.prototype = Object.create(TF.RoutingMap.EsriFeatureTool.prototype);
	LandmarkMapTool.prototype.constructor = LandmarkMapTool;

	LandmarkMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializeBase({
			point: {
				id: "LandmarkPointFeatureLayer",
				symbol: self.symbol.landmarkPointSymbol()
			},
			polyline: {
				id: "LandmarkPolylineFeatureLayer",
				symbol: self.symbol.landmarkPolylineSymbol()
			},
			polygon: {
				id: "LandmarkPolygonFeatureLayer",
				symbol: self.symbol.landmarkPolygonSymbol()
			}
		});

		self.initializeSettings();
	};

	LandmarkMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.viewModel.dataModel.getSetting().then(function(settings)
		{
			self._moveDuplicateNode = settings.moveDuplicateNodes;
			self._allowOverlap = !settings.removeOverlapping;
		});
	};

	LandmarkMapTool.prototype.otherFields = function()
	{
		return this.viewModel.viewModel._viewModal.mapLayersPaletteViewModel.myLandmarkDisplaySetting.getLabelFields();
	};

})();