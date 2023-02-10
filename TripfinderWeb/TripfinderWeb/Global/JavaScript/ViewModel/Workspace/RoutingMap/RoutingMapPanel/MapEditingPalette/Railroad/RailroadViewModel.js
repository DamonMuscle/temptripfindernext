(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadViewModel = RailroadViewModel;

	function RailroadViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.isEyeVisible = ko.observable(true);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.RailroadDataModel(self);
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.RailroadEventsManager(self);
		self.display = new TF.RoutingMap.MapEditingPalette.RailroadDisplay(self);
		self.editModal = new TF.RoutingMap.MapEditingPalette.RailroadEditModal(self);
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.layers = ["MyRailroadLabelLayer"];
	}

	RailroadViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	RailroadViewModel.prototype.init = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.MapEditingPalette.RailroadMapTool(self._viewModal._map, self._viewModal._arcgis, "Railroad", self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
			self.dataModel.inited = true;
		}
	};

	RailroadViewModel.prototype.show = function()
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

	RailroadViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	RailroadViewModel.prototype._changeShow = function()
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

	RailroadViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.viewModel._viewModal._map.findLayerById(item);
		}).filter(function(c) { return !!c; });
	};

	RailroadViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("Railroad", "Normal");
		this.editModal.closeEditModal();
		this.dataModel.close();
		if (this.viewModel.showCount == 0)
		{
			layers.forEach(function(item)
			{
				item.removeAll && item.removeAll();
			});
		}
		return Promise.resolve(true);
	};

	RailroadViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return this.editModal.beforeChangeData().then(function()
		{
			return self.dataModel.lockData.obSelfChangeCount() > 0;
		});
	};

	RailroadViewModel.prototype.save = function()
	{
		return this.dataModel.save();
	};

	RailroadViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	RailroadViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose && this.drawTool.dispose();
	};
})();