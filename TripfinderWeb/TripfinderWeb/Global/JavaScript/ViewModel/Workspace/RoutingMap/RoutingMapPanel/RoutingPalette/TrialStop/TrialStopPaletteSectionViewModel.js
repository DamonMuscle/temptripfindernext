(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopPaletteSectionViewModel = TrialStopPaletteSectionViewModel;

	function TrialStopPaletteSectionViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.stopPoolPaletteSection = viewModel.stopPoolPaletteSection;
		self.fieldTripPaletteSection = viewModel.fieldTripPaletteSection;
		self.isShowMode = ko.observable(true);
		self.tripDataModel = self.fieldTripPaletteSection.dataModel;
		self.parentViewModel = viewModel;
		self.dataModel = new TF.RoutingMap.RoutingPalette.TrialStopDataModel(self);
		self.eventsManager = new TF.RoutingMap.RoutingPalette.TrialStopEventsManager(self);
		self.editModal = new TF.RoutingMap.RoutingPalette.TrialStopEditModal(self);
		self.display = new TF.RoutingMap.RoutingPalette.TrialStopDisplay(self);
		self.layers = [];
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(function(e, data)
		{
			self._viewModal.changeHighlight(data, "trialStop", self.dataModel.findById);
		});
		self.newPoolStopHeaderName = ko.computed(function()
		{
			return 'Copy to ' + (viewModel.stopPoolPaletteSection.display.obStopPoolName() != '' ? viewModel.stopPoolPaletteSection.display.obStopPoolName() : 'Pool Stop') + ' from Selection';
		});
	}

	TrialStopPaletteSectionViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	TrialStopPaletteSectionViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.RoutingPalette.TrialStopMapTool(self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
	};

	TrialStopPaletteSectionViewModel.prototype.show = function()
	{
		return Promise.resolve(true);
	};

	TrialStopPaletteSectionViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	TrialStopPaletteSectionViewModel.prototype._changeShow = function()
	{
		var self = this;
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});
		self.parentViewModel.childViewShowChange();
	};

	TrialStopPaletteSectionViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.parentViewModel._viewModal._map.findLayerById(item);
		}).filter(function(c) { return c; });
	};

	TrialStopPaletteSectionViewModel.prototype.close = function()
	{
		return this.dataModel.close();
	};

	TrialStopPaletteSectionViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose && this.drawTool.dispose();
	};
})();