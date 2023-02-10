(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadMapTool = RailroadMapTool;
	function RailroadMapTool(map, arcgis, type, viewModel)
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
		// self.dataModel.travelRegionPropertyChangedEvent.subscribe(this.ontravelRegionPropertyChangedEvent.bind(this));
		self.dataModel.settingChangeEvent.subscribe(self.initializeSettings.bind(this));
	}
	RailroadMapTool.prototype = Object.create(TF.RoutingMap.EsriFeatureTool.prototype);
	RailroadMapTool.prototype.constructor = RailroadMapTool;

	RailroadMapTool.prototype.initialize = function()
	{
		var self = this;
		self.initializeBase({
			polyline: {
				id: "railroadFeatureLayer",
				symbol: {
					type: "simple-line",
					color: "#808080",
					style: "short-dash",
					width: 1
				}
			}
		});

		self.initializeSettings();
	};

	RailroadMapTool.prototype.initializeSettings = function()
	{
		var self = this;
		self.viewModel.dataModel.getSetting().then(function(setting)
		{
			self._moveDuplicateNode = setting.moveDuplicateNodes;
		});
	};

	RailroadMapTool.prototype.addPolylineToLayer = function(graphic)
	{
		var self = this;
		self.editModal.create(graphic.geometry).then(function()
		{
			self.sketchTool.stopAndClear();
		});
	};

	RailroadMapTool.prototype.otherFields = function()
	{
		return this.viewModel.viewModel._viewModal.mapLayersPaletteViewModel.myRailroadDisplaySetting.getLabelFields();
	};

})();