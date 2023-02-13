(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionsViewModel = TravelRegionsViewModel;
	function TravelRegionsViewModel(viewModal, isOpen, routeState)
	{
		var self = this;
		self.type = "travelRegion";
		self.drawTool = null;
		self.$element = null;
		self.routeState = routeState;
		self.isEyeVisible = ko.observable(true);
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(this._changeTravelRegionShow.bind(this));
		self.obHighlightedTravelRegion = ko.observable(false);
		self.obTravelScenarioIsSelected = ko.observable(false);
		self.obIsTravelRegionEditButtonDisable = ko.computed(function()
		{
			if (self.isShowMode() && self.obTravelScenarioIsSelected())
			{
				return false;
			} else
			{
				return true;
			}
		});
		self.viewModel = viewModal;
		self._viewModal = viewModal._viewModal;
		self.dataModel = new TF.RoutingMap.TravelScenariosPalette.TravelRegionsDataModel(self);
		self.eyeTitle = ko.observable("Travel Regions");
		self.eventsManager = new TF.RoutingMap.TravelScenariosPalette.TravelRegions.EventsManager(self);
		self.travelRegionEditModal = new TF.RoutingMap.TravelScenariosPalette.TravelRegionEditModal(self);
		self.travelRegionsDisplay = new TF.RoutingMap.TravelScenariosPalette.TravelRegionsDisplay(self, self.dataModel);
		self.dataModel.highlightChangedEvent.subscribe(self.onHighlightChanged.bind(self));
		self.layers = [];
	}

	TravelRegionsViewModel.prototype.uiInit = function(viewModal, e)
	{
		this.$element = $(e);
	};

	TravelRegionsViewModel.prototype.init = function()
	{
		var self = this;
		self.drawTool = new TF.RoutingMap.TravelScenariosPalette.TravelRegionMapTool(self._viewModal._map, self._viewModal._arcgis, "TravelRegion", self);
		self.drawTool.viewModel = self;
		[self.travelRegionsDisplay].forEach(function(item)
		{
			item.attachMapTools2EventInstance(self._viewModal._map, self._viewModal._arcgis, self.drawTool);
		});
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange.bind(this));
		self.dataModel.init();
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});
	};

	TravelRegionsViewModel.prototype.unSaveCheck = function()
	{
		let self = this;
		if (self.dataModel.isSaving)
		{
			self.dataModel.isSaving = false;
			return Promise.resolve(false);
		}

		return self.travelRegionEditModal.beforeChangeData().then(() =>
		{
			return self.dataModel.travelRegionLockData.obSelfChangeCount() > 0;
		});
	};

	TravelRegionsViewModel.prototype.show = function()
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
		self.dataModel.revertTravelRegion();
		return Promise.resolve(true);
	};

	TravelRegionsViewModel.prototype.close = function()
	{
		var layers = this.getLayers();
		this._viewModal.setMode("TravelRegion", "Normal");
		this.travelRegionEditModal.closeEditModal();
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

	TravelRegionsViewModel.prototype.toggleTravelRegionShow = function(data, event)
	{
		var self = this;
		event.stopPropagation();
		self.isShowMode(!self.isShowMode());
		self.viewModel.showChange();
	};

	TravelRegionsViewModel.prototype.onHighlightChanged = function(e, param)
	{
		var highlighted = this.dataModel.getTravelHighlighted();
		this.obHighlightedTravelRegion(highlighted.length > 0);
		this._viewModal.changeHighlight(highlighted, "TravelRegion", this.dataModel.getTravelRegionById.bind(this.dataModel), "dataType");
	};

	TravelRegionsViewModel.prototype._changeTravelRegionShow = function()
	{
		var self = this;
		if (self.isShowMode() && self.obTravelScenarioIsSelected())
		{
			// self.obIsTravelRegionEditButtonDisable(false);
		} else
		{
			self._viewModal.setMode("TravelRegion", "Normal");
			PubSub.publish("clear_ContextMenu_Operation");
			// self.obIsTravelRegionEditButtonDisable(true);
		}
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = self.isShowMode();
		});

		if (self.isShowMode() && !self.dataModel.inited)
		{
			self.dataModel.revertTravelRegion();
		}
	};

	TravelRegionsViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self._viewModal._map.findLayerById(item);
		}).filter(function(item)
		{
			return !!item;
		});
	};

	TravelRegionsViewModel.isTripStopInTravelRegion = function(travelRegionGeometry, travelScenarioId)
	{
		const url = pathCombine(tf.api.apiPrefix(), "tripstops") + "?travelScenarioId=" + travelScenarioId + "&@fields=Xcoord,Ycoord";
		return tf.promiseAjax.get(url).then(function(data)
		{
			var isStopInTravelRegion = false;
			data.Items.some(function(tripstop)
			{
				var tripStopGeometry = TF.xyToGeometry(tripstop.Xcoord, tripstop.Ycoord);
				var result = tf.map.ArcGIS.geometryEngine.intersects(tripStopGeometry, travelRegionGeometry);
				if (result)
				{
					isStopInTravelRegion = true;
					return true;
				}
			});

			if (isStopInTravelRegion)
			{
				return tf.promiseBootbox.alert("Unable to place travel region because a stop is within this region.", 'Warning').then(function()
				{
					return isStopInTravelRegion;
				});
			}

			return isStopInTravelRegion;
		});
	};

	TravelRegionsViewModel.prototype.dispose = function()
	{
		this.dataModel && this.dataModel.dispose();
		this.drawTool && this.drawTool.dispose();
		this.dataModel = null;
		this.eventsManager = null;
		this.editModal = null;
		this.travelRegionsDisplay = null;
	};
})();