(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkViewModel = LandmarkViewModel;

	function LandmarkViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.isEyeVisible = ko.observable(true);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.LandmarkDataModel(self);
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.LandmarkEventsManager(self);
		self.display = new TF.RoutingMap.MapEditingPalette.LandmarkDisplay(self);
		self.editModal = new TF.RoutingMap.MapEditingPalette.LandmarkEditModal(self);
		self.calculator = null;
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(this._showChange.bind(this));
		self.layers = ["MyLandmarkLabelLayer"];
	}

	LandmarkViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	LandmarkViewModel.prototype.init = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.MapEditingPalette.LandmarkMapTool(self._viewModal._map, self._viewModal._arcgis, "Landmark", self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
			self.dataModel.inited = true;
		}
	};

	LandmarkViewModel.prototype.show = function()
	{
		var self = this;
		var firstTimeShow = false;
		if (self.dataModel.inited == false)
		{
			self.dataModel.init();
			firstTimeShow = true;
		}
		if (!firstTimeShow)
		{
			self.dataModel.revert(false);
		}
		return Promise.resolve(true);
	};

	LandmarkViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	LandmarkViewModel.prototype._showChange = function()
	{
		var self = this;
		if (self.editTool && self.editTool.isEditing)
		{
			self.editTool.stop();
			PubSub.publish("clear_ContextMenu_Operation");
		}
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			if (item)
			{
				item.visible = self.isShowMode();
			}
		});
		self.viewModel.showChange();
		if (self.isShowMode() && self.dataModel.inited == false)
		{
			self.dataModel.init();
		}
	};

	LandmarkViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.viewModel._viewModal._map.findLayerById(item);
		}).filter(function(item)
		{
			return !!item;
		});
	};

	LandmarkViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("Landmark", "Normal");
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

	LandmarkViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return this.editModal.beforeChangeData().then(function()
		{
			return self.dataModel.lockData.obSelfChangeCount() > 0;
		});
	};

	LandmarkViewModel.prototype.save = function()
	{
		return this.dataModel.save();
	};

	LandmarkViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	LandmarkViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
	};
})();