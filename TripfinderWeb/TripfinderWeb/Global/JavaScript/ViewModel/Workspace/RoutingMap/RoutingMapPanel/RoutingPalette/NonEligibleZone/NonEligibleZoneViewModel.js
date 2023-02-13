(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NonEligibleZoneViewModel = NonEligibleZoneViewModel;

	function NonEligibleZoneViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.isEyeVisible = ko.observable(true);
		self._viewModal = viewModel._viewModal;
		self.dataModel = new TF.RoutingMap.RoutingPalette.NonEligibleZoneDataModel(self);
		self.eventsManager = new TF.RoutingMap.RoutingPalette.NonEligibleZoneEventsManager(self);
		self.display = new TF.DataEntry.SchoolDataEntryNonEligibleDisplay(self);
		self.editModal = new TF.RoutingMap.RoutingPalette.NonEligibleZoneEditModal(self);
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.layers = [];
	}

	NonEligibleZoneViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	NonEligibleZoneViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.DataEntry.SchoolDataEntryNonEligibleMapTool(self);
			this.drawTool.selectionChange.subscribe(this.eventsManager.selectionChange.bind(this));
		}
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
		}
	};

	NonEligibleZoneViewModel.prototype.show = function()
	{
		this.dataModel.init();
		return Promise.resolve(true);
	};

	NonEligibleZoneViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	NonEligibleZoneViewModel.prototype._changeShow = function()
	{
		var self = this;
		var layers = this.getLayers();
		var visible = self.isShowMode();
		layers.forEach(function(item)
		{
			item.visible = visible;
		});
		self.viewModel.childViewShowChange();

		// change nez visible
		this.dataModel.changeAllDataVisible(visible);
	};

	NonEligibleZoneViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.viewModel._viewModal._map.findLayerById(item);
		}).filter(function(c) { return c; });
	};

	NonEligibleZoneViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("NonEligibleZone", "Normal");
		this.editModal.closeEditModal();
		this.dataModel.close();
		if (this.viewModel.showCount == 0)
		{
			layers.forEach(function(item)
			{
				item.removeAll();
			});
		}
		return Promise.resolve(true);
	};

	NonEligibleZoneViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
	};
})();