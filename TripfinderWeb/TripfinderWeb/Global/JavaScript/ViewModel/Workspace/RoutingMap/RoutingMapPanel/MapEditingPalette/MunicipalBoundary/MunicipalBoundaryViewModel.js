(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MunicipalBoundaryViewModel = MunicipalBoundaryViewModel;

	function MunicipalBoundaryViewModel(viewModel, isOpen, routeState)
	{
		var self = this;
		self.obShow = ko.observable(true);
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.routeState = routeState;
		self.mode = "Normal";
		self.eyeTitle = ko.observable("Municipal Boundary");
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(this._changeMunicipalBoundaryShow.bind(this));
		self.isEyeVisible = ko.observable(true);
		self.obIsMunicipalBoundaryEditButtonDisable = ko.observable(false);
		self.obHighlightedMunicipalBoundary = ko.observable(false);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.MunicipalBoundaryDataModel(self);
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.MunicipalBoundary.EventsManager(self);
		self.municipalBoundaryEditModal = new TF.RoutingMap.MapEditingPalette.MunicipalBoundaryEditModal(self);
		self.municipalBoundaryDisplay = new TF.RoutingMap.MapEditingPalette.MunicipalBoundaryDisplay(self, routeState, self.dataModel);
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChanged.bind(self));
		self.calculator = null;
		self.dataModel.inited = false;
		self.layers = [];
		viewModel._viewModal.onMapLoad.subscribe(this._onMapLoad.bind(this));

	}

	MunicipalBoundaryViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
	};

	MunicipalBoundaryViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return this.municipalBoundaryEditModal.beforeChangeData().then(function()
		{
			return self.dataModel.municipalBoundaryLockData.obSelfChangeCount() > 0;
		});
	};

	MunicipalBoundaryViewModel.prototype.initMapTool = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.MapEditingPalette.MunicipalBoundaryMapTool(self._viewModal._map, self._viewModal._arcgis, "MunicipalBoundary", self);
			self.drawTool.viewModel = self;
		}
	};
	MunicipalBoundaryViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		self.dataModel.initData();
		self.initMapTool();
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
			self.dataModel.inited = true;
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.obShow();
		});
	};

	MunicipalBoundaryViewModel.prototype.show = function()
	{
		var self = this;
		var layers = this.getLayers();
		var showMode = self.isShowMode();
		layers.forEach(function(item)
		{
			if (item)
			{
				item.visible = showMode;
			}
		});
		self.dataModel.revertMunicipalBoundary();
		return Promise.resolve(true);
	};

	MunicipalBoundaryViewModel.prototype.toggleMunicipalBoundaryShow = function(data, event)
	{
		var self = this;
		event.stopPropagation();
		self.isShowMode(!self.isShowMode());
		self.viewModel.showChange();
	};

	MunicipalBoundaryViewModel.prototype.getLayers = function()
	{
		var self = this;
		return ["municipalBoundaryLayer"].map(function(item)
		{
			return self._viewModal._map.findLayerById(item);
		}).filter(function(item)
		{
			return !!item;
		});
	};

	MunicipalBoundaryViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this._viewModal.setMode("MunicipalBoundary", "Normal");
		this.municipalBoundaryEditModal.closeEditModal();
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

	MunicipalBoundaryViewModel.prototype.onHighlightChanged = function()
	{
		var highlighted = this.dataModel.getMunicipalBoundaryHighlighted();
		this.obHighlightedMunicipalBoundary(highlighted.length > 0);
		this._viewModal.changeHighlight(highlighted, "MunicipalBoundary", this.dataModel.getMunicipalBoundaryById.bind(this.dataModel));
	};

	MunicipalBoundaryViewModel.prototype._changeMunicipalBoundaryShow = function()
	{
		var self = this;
		self.obIsMunicipalBoundaryEditButtonDisable(!self.isShowMode());
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});
		self.viewModel.showChange();
		if (self.isShowMode() && self.drawTool._polygonLayer.graphics.length == 0 && self.dataModel.municipalBoundaries.length > 0)
		{
			self.drawTool._addBoundary(self.dataModel.municipalBoundaries);
		}
	};

	MunicipalBoundaryViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
		this.dataModel = null;
		this.eventsManager = null;
		this.editModal = null;
		this.municipalBoundaryDisplay = null;
		this.municipalBoundariestreetModal = null;
	};
})();