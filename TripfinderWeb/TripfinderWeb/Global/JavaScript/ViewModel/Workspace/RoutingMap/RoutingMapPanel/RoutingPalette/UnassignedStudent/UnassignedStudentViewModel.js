(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentViewModel = UnassignedStudentViewModel;

	function UnassignedStudentViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.isEyeVisible = ko.observable(true);
		self._viewModal = viewModel._viewModal;
		self.dataModel = new TF.RoutingMap.RoutingPalette.UnassignedStudentDataModel(self);
		self.eventsManager = new TF.RoutingMap.RoutingPalette.UnassignedStudentEventsManager(self);
		self.display = new TF.RoutingMap.RoutingPalette.UnassignedStudentDisplay(self);
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.isSymbolsChanged = false;
		self.layers = [];
	}

	UnassignedStudentViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	UnassignedStudentViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.RoutingPalette.UnassignedStudentMapTool(self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
		}
	};

	UnassignedStudentViewModel.prototype.show = function()
	{
		this.dataModel.init();
		return Promise.resolve(true);
	};

	UnassignedStudentViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	UnassignedStudentViewModel.prototype._changeShow = function()
	{
		var self = this;
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});
		self.viewModel.childViewShowChange();
	};

	UnassignedStudentViewModel.prototype.getLayers = function()
	{
		var self = this;
		var map = self.viewModel._viewModal._map;
		return self.layers.map(function(item)
		{
			return map.findLayerById(item);
		}).filter(function(layer) { return layer; });
	};

	UnassignedStudentViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("UnassignedStudent", "Normal");
		if (this.viewModel.showCount == 0)
		{
			layers.forEach(function(item)
			{
				item.removeAll();
			});
		}
		return Promise.resolve(true);
	};

	UnassignedStudentViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return self.dataModel.unSaveCheck();
	};

	UnassignedStudentViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
	};
})();