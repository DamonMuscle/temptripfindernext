(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterViewModel = WaterViewModel;

	function WaterViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = self._viewModal = viewModel._viewModal;
		self.isEyeVisible = ko.observable(true);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.WaterDataModel(self);
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.WaterEventsManager(self);
		self.display = new TF.RoutingMap.MapEditingPalette.WaterDisplay(self);
		self.editModal = new TF.RoutingMap.MapEditingPalette.WaterEditModal(self);
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(this._changeShow.bind(this));
		self.layers = ["WaterLabelLayer"];
	}

	WaterViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	WaterViewModel.prototype.init = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.MapEditingPalette.WaterMapTool(self._viewModal._map, self._viewModal._arcgis, "Water", self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
			self.dataModel.inited = true;
		}
	};

	WaterViewModel.prototype.show = function()
	{
		var self = this;
		if (self.dataModel.inited == false)
		{
			if (self.isShowMode())
			{
				self.dataModel.init();
			} else
			{
				self.display.setFooterDisplay();
			}
		} else
		{
			self.dataModel.revert(false);
		}
		return Promise.resolve(true);
	};

	WaterViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	WaterViewModel.prototype._changeShow = function()
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
			item.visible = self.isShowMode();
		});
		self.viewModel.showChange();
		if (self.isShowMode() && self.dataModel.inited == false)
		{
			self.dataModel.init();
		}
	};

	WaterViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.viewModel._viewModal._map.findLayerById(item);
		}).filter(function(c) { return !!c; });
	};

	WaterViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("Water", "Normal");
		this.editModal.closeEditModal();
		this.dataModel.close();
		if (this.viewModel.showCount == 0)
		{
			layers.forEach(function(item)
			{
				item.removeAll();
			});
		}
		this.drawTool && this.drawTool.close();
		return Promise.resolve(true);
	};

	WaterViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return this.editModal.beforeChangeData().then(function()
		{
			return self.dataModel.lockData.obSelfChangeCount() > 0;
		});
	};

	WaterViewModel.prototype.save = function()
	{
		return this.dataModel.save();
	};

	WaterViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	WaterViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
	};
})();