(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TripViewModel = TripViewModel;

	function TripViewModel(viewModel, routeState, trips)
	{
		var self = this;
		self.viewModel = viewModel;
		self._viewModal = viewModel._viewModal;
		self.isEyeVisible = ko.observable(true);
		self.isShowMode = ko.observable(true);
		self.isShowMode.subscribe(self._changeShow.bind(self));
		self.isFileShow = ko.computed(function()
		{
			return self.isShowMode();
		});
		// the trips that need to be auto open when trip panel initial
		// self.initTrips = trips;

		self.dataModel = new TF.RoutingMap.RoutingPalette.RoutingDataModel(self);
		self.playBackControl = new TF.RoutingMap.RoutingPalette.TripPlayBackControl(self);
		self.eventsManager = new TF.RoutingMap.RoutingPalette.RoutingEventsManager(self, routeState);
		self.display = new TF.RoutingMap.RoutingPalette.RoutingDisplay(self);
		self.editFieldTripStopModal = new TF.RoutingMap.RoutingPalette.RoutingFieldTripStopEditModal(self);
		self.dataModel.onChangeTripVisibilityEvent.subscribe(this.onChangeTripVisibilityEvent.bind(this));
		self.drawTool = null;
		self.editTool = null;
		self.routingChangePath = null;
		self.routingDirection = null;
		self.dataModel.inited = false;
		self.layers = [];
	}

	TripViewModel.prototype.uiInit = function(model, element)
	{
		var self = this;
		this.$element = $(element);
		// this.documentChange = tf.documentManagerViewModel.obCurrentDocument.subscribe(function(document)
		// {
		// 	if (document == self._viewModal)
		// 	{
		// 		setTimeout(function()
		// 		{
		// 			self.display.fixSchoolNodeStyle();
		// 		}, 20);
		// 	}
		// });
	};

	TripViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = self.viewModel.drawTool = new TF.RoutingMap.RoutingPalette.RoutingTripMapTool(self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange_routing.bind(self));
		self.routingChangePath = new TF.RoutingMap.RoutingPalette.RoutingChangePath(self);
	};

	TripViewModel.prototype.addStopClick = function()
	{
		this.eventsManager.createClick();
		this.viewModel.$element.find(".print-setting-group .icon.destination.add-stop").addClass("active");
	};

	TripViewModel.prototype.cancelStopClick = function()
	{
		this.viewModel.$element.find(".print-setting-group .icon.destination.add-stop").removeClass("active");
	};

	TripViewModel.prototype.show = function()
	{
		var self = this;
		return self.dataModel.init();
	};

	TripViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		var isShowMode = !self.isShowMode();
		self.changeVisibility(isShowMode);
	};

	TripViewModel.prototype.changeVisibility = function(isShowMode)
	{
		this.isShowMode(isShowMode);
		if (!isShowMode)
		{
			this._viewModal.setMode("", "Normal");
		}
	};

	TripViewModel.prototype._changeShow = function()
	{
		var self = this;
		if (self.editTool && self.editTool.isEditing)
		{
			self.editTool.stop();
			PubSub.publish("clear_ContextMenu_Operation");
		}
		var isShowMode = self.isShowMode();
		var layers = this.getLayers();
		layers.forEach(function(item)
		{
			item.visible = isShowMode;
		});
		if (!this._directionChangeShowMode)
		{
			self.dataModel.changeTripVisibility(self.dataModel.trips.map(function(t) { return t.id; }), isShowMode);
		}
		self.viewModel.childViewShowChange();
	};

	TripViewModel.prototype.onChangeTripVisibilityEvent = function()
	{
		var self = this;
		if (self.dataModel.trips.length > 0)
		{
			self._directionChangeShowMode = true;
			var visibleCount = Enumerable.From(self.dataModel.trips).Count(function(c) { return c.visible; });
			self.changeVisibility(visibleCount > 0);
			self._directionChangeShowMode = false;
		}
	};

	TripViewModel.prototype.getLayers = function()
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

	TripViewModel.prototype.close = function()
	{
		var self = this;
		var layers = this.getLayers();
		this.viewModel._viewModal.setMode("Routing", "Normal");
		this.editFieldTripStopModal.closeEditModal();
		return this.dataModel.close().then(function()
		{
			if (self.viewModel.showCount == 0)
			{
				layers.forEach(function(item)
				{
					item.removeAll();
				});
			}
			return true;
		});
	};

	TripViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return self.dataModel.unSaveCheck();
	};

	TripViewModel.prototype.save = function()
	{
		return this.dataModel.saveTrips(this.dataModel.trips);
	};

	TripViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	TripViewModel.prototype.dispose = function()
	{
		this.playBackControl.dispose();
		// this.drawTool && this.drawTool.dispose();
		this.dataModel.dispose();
		this.display.dispose();
		this.eventsManager = null;
		if (this.routingChangePath)
		{
			this.routingChangePath.dispose();
		}
		this.documentChange && this.documentChange.dispose();
		tfdispose(this);
	};
})();