(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeViewModel = ZipCodeViewModel;

	function ZipCodeViewModel(viewModel, isOpen, routeState)
	{
		var self = this;
		self.obShow = ko.observable(true);
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.routeState = routeState;
		self.mode = "Normal";
		self.eyeTitle = ko.observable("Postal Code");
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(this._changeZipCodeShow.bind(this));
		self.isEyeVisible = ko.observable(true);
		self.obIsZipCodeEditButtonDisable = ko.observable(false);
		self.obHighlightedZipCode = ko.observable(false);
		self.dataModel = new TF.RoutingMap.MapEditingPalette.ZipCodeDataModel(self);
		self.dataModel.inited = false;
		self.eventsManager = new TF.RoutingMap.MapEditingPalette.ZipCode.EventsManager(self);
		self.zipCodeEditModal = new TF.RoutingMap.MapEditingPalette.ZipCodeEditModal(self);
		self.zipCodesDisplay = new TF.RoutingMap.MapEditingPalette.ZipCodesDisplay(self, routeState, self.dataModel);
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChanged.bind(self));
	}

	ZipCodeViewModel.prototype.uiInit = function(viewModal, e)
	{
		this.$element = $(e);
	};

	ZipCodeViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return this.zipCodeEditModal.beforeChangeData().then(function()
		{
			return self.dataModel.zipCodeLockData.obSelfChangeCount() > 0;
		});
	};

	ZipCodeViewModel.prototype.init = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = new TF.RoutingMap.MapEditingPalette.ZipCodeMapTool(self._viewModal._map, self._viewModal._arcgis, "ZipCode", self);
		}
		self._onMapLoad();
	};

	ZipCodeViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (self.viewModel.obShow())
		{
			self.dataModel.init();
			self.dataModel.inited = true;
		}
		var layers = this.getLayers();
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		layers.forEach(function(item)
		{
			item.visible = self.obShow();
		});
	};

	ZipCodeViewModel.prototype.show = function()
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
		self.dataModel.revert();
		return Promise.resolve(true);
	};

	ZipCodeViewModel.prototype.toggleZipCodeShow = function(data, event)
	{
		var self = this;
		event.stopPropagation();
		self.isShowMode(!self.isShowMode());
		self.viewModel.showChange();
	};

	ZipCodeViewModel.prototype.getLayers = function()
	{
		var self = this;
		return ["zipCodeLayer"].map(function(item)
		{
			return self._viewModal._map.findLayerById(item);
		}).filter(function(item)
		{
			return !!item;
		});
	};

	ZipCodeViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this._viewModal.setMode("ZipCode", "Normal");
		this.zipCodeEditModal.closeEditModal();
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

	ZipCodeViewModel.prototype.onHighlightChanged = function()
	{
		var highlighted = this.dataModel.getZipCodeHighlighted();
		this.obHighlightedZipCode(highlighted.length > 0);
		this._viewModal.changeHighlight(highlighted, "ZipCode", this.dataModel.getZipCodeById.bind(this.dataModel));
	};

	ZipCodeViewModel.prototype._changeZipCodeShow = function()
	{
		var self = this;
		if (self.isShowMode())
		{
			self.obIsZipCodeEditButtonDisable(false);
		} else
		{
			self._viewModal.setMode("ZipCode", "Normal");
			PubSub.publish("clear_ContextMenu_Operation");
			self.obIsZipCodeEditButtonDisable(true);
		}
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});
		if (self.isShowMode() && self.drawTool._polygonLayer.graphics.length == 0 && self.dataModel.zipCodes.length > 0)
		{
			self.drawTool._addBoundary(self.dataModel.zipCodes);
		}
	};

	ZipCodeViewModel.prototype.dispose = function()
	{
		this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
		this.dataModel = null;
		this.eventsManager = null;
		this.editModal = null;
		this.contextMenuEvent = null;
		// this.selectAreaEvent = null;
		this.fileEvent = null;
		this.zipCodesDisplay = null;
		this.selectEvent = null;
		this.deleteEvent = null;
		this.boundaryDetailsEvent = null;
		this.centerMapEvent = null;
	};
})();