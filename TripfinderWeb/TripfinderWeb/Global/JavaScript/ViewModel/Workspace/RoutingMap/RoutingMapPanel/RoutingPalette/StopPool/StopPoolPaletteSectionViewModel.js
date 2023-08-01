(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolPaletteSectionViewModel = StopPoolPaletteSectionViewModel;

	function StopPoolPaletteSectionViewModel(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.parentViewModel = viewModel;
		self.isEyeVisible = ko.observable(true);
		self._viewModal = viewModel._viewModal;
		self.dataModel = new TF.RoutingMap.RoutingPalette.StopPoolDataModel(self);
		self.eventsManager = new TF.RoutingMap.RoutingPalette.StopPoolEventsManager(self);
		self.display = new TF.RoutingMap.RoutingPalette.StopPoolDisplay(self);
		self.editModal = new TF.RoutingMap.RoutingPalette.StopPoolEditModal(self);
		self.dataModel.inited = false;
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.layers = [];
		self.dataModel.highlightChangedEvent.subscribe(function(e, data)
		{
			self._viewModal.changeHighlight(data, "stopPoolStop", self.dataModel.findById);
		});
	}

	StopPoolPaletteSectionViewModel.prototype.uiInit = function(model, element)
	{
		this.$element = $(element);
	};

	StopPoolPaletteSectionViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.RoutingPalette.StopPoolMapTool(self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		if (self.viewModel.obShow() && !self.dataModel.inited)
		{
			self.dataModel.init();
		}
	};

	StopPoolPaletteSectionViewModel.prototype.show = function()
	{
		this.dataModel.init();
		return Promise.resolve(true);
	};

	StopPoolPaletteSectionViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	StopPoolPaletteSectionViewModel.prototype._changeShow = function()
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
		self.viewModel.childViewShowChange();
	};

	StopPoolPaletteSectionViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self._viewModal._map.findLayerById(item);
		}).filter(function(c) { return c; });
	};

	StopPoolPaletteSectionViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this._viewModal.setMode("StopPool", "Normal");
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

	StopPoolPaletteSectionViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return self.dataModel.unSaveCheck();
	};

	StopPoolPaletteSectionViewModel.prototype.save = function()
	{
		return this.dataModel.save();
	};

	StopPoolPaletteSectionViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	StopPoolPaletteSectionViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose && this.drawTool.dispose();
		this.display && this.display.dispose();
		tfdispose(this);
	};
})();