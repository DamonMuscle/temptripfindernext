(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsViewModel = MyStreetsViewModel;

	function MyStreetsViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.isEyeVisible = ko.observable(true);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.MyStreetsDataModel(self);
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.MyStreetsEventsManager(self);
		self.myStreetsDisplay = new TF.RoutingMap.MapEditingPalette.MyStreetsDisplay(self);
		self.editModal = new TF.RoutingMap.MapEditingPalette.MyStreetsEditModal(self);
		self.calculator = null;
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.layers = ["splitLayer", "MyStreetLabelLayer"];
	}

	MyStreetsViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	MyStreetsViewModel.prototype.init = function()
	{
		var self = this;
		self.drawTool = new TF.RoutingMap.MapEditingPalette.MyStreetsMapTool(self);
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		self.calculator = new TF.RoutingMap.MapEditingPalette.ManeuverPosCalculator(self.viewModel._viewModal._arcgis,
			self.viewModel._viewModal._map, self);
		self.controlDisplay = new TF.RoutingMap.MapEditingPalette.MyStreetsControlDisplay(self.viewModel._viewModal._arcgis,
			self.viewModel._viewModal._map, self);
		return Promise.resolve(true);
	};

	MyStreetsViewModel.prototype.show = function()
	{
		var self = this;
		this.changeLayerVisible(this.isShowMode());
		if (self.dataModel.inited == false)
		{
			self._initData();
		} else if (this.dataModel.closed)
		{
			self.dataModel.revertData();
		} else
		{
			self.controlDisplay && self.controlDisplay.extentChangeEvent();
		}
		return Promise.resolve(true);
	};

	MyStreetsViewModel.prototype._initData = function()
	{
		var self = this;
		if (self.isShowMode())
		{
			self.dataModel.inited = true;
			self.dataModel.init();
		} else
		{
			self.myStreetsDisplay.setFooterDisplay();
		}
	};

	MyStreetsViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	MyStreetsViewModel.prototype._changeShow = function()
	{
		this.changeShow(this.isShowMode());
	};

	MyStreetsViewModel.prototype.changeShow = function(show)
	{
		var self = this;
		this.changeLayerVisible(show);
		self.viewModel.showChange();
		if (show && self.dataModel.inited == false)
		{
			self.dataModel.init();
		}
	};

	MyStreetsViewModel.prototype.changeLayerVisible = function(show)
	{
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			if (item)
			{
				item.visible = show;
			}
		});
		if (show && this.controlDisplay)
		{
			this.controlDisplay.showAll();
		}
	};

	MyStreetsViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.viewModel._viewModal._map.findLayerById(item);
		}).filter(function(c) { return !!c; });
	};

	MyStreetsViewModel.prototype.close = function()
	{
		this.viewModel._viewModal.setMode("MyStreets", "Normal");
		this.editModal.closeEditModal();
		if (this.showMode().travelScenario && this.dataModel.streetsLockData.obSelfChangeCount() > 0)
		{
			// when travel scenario is open,close street palette and revert street changes
			this.dataModel.revert(false);
		}
		if (!this.showMode().mapEditing && !this.showMode().travelScenario)
		{
			this.dataModel.close();
			this.drawTool.close();
			this.clearAllLayer();
		}
		this.restoreTravelScenarioShowMap();
		return Promise.resolve(true);
	};

	MyStreetsViewModel.prototype.restoreTravelScenarioShowMap = function()
	{
		if (this.showMode().travelScenario)
		{
			this.viewModel._viewModal.travelScenariosPaletteViewModel.travelScenariosViewModel.dataModel.getSetting().then((setting) =>
			{
				this.changeShow(setting.showStreet);
			});
		}
	};

	MyStreetsViewModel.prototype.clearAllLayer = function()
	{
		this.getLayers().forEach(function(item)
		{
			if (item)
			{
				item.removeAll && item.removeAll();
			}
		});
	};

	MyStreetsViewModel.prototype.unSaveCheck = function()
	{
		let self = this;
		if (self.dataModel.isSaving)
		{
			self.dataModel.isSaving = false;
			return Promise.resolve(false);
		}

		return self.editModal.beforeChangeData().then(function()
		{
			return self.dataModel.streetsLockData.obSelfChangeCount() > 0;
		});
	};

	MyStreetsViewModel.prototype.save = function()
	{
		return this.dataModel.save();
	};

	MyStreetsViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	MyStreetsViewModel.prototype.displayOnMap = function()
	{
		this.drawTool.displayGraphicInExtent();
	};

	MyStreetsViewModel.prototype.showMode = function()
	{
		var documentViewModel = this.viewModel._viewModal;
		return {
			mapEditing: this.viewModel.showCount > 0,
			travelScenario: documentViewModel.travelScenariosPaletteViewModel.showCount > 0
		};
	};

	MyStreetsViewModel.prototype.dispose = function()
	{
		this.dataModel && this.dataModel.dispose();
		this.calculator && this.calculator.dispose();
		this.controlDisplay && this.controlDisplay.dispose();
		this.drawTool && this.drawTool.dispose();
	};
})();