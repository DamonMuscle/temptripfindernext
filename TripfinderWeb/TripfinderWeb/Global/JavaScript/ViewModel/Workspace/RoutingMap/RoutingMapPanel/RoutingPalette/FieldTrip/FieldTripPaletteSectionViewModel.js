(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").FieldTripPaletteSectionViewModel = FieldTripPaletteSectionViewModel;

	function FieldTripPaletteSectionViewModel(routingPaletteVM, routeState, trips)
	{
		var self = this;
		self.viewModel = routingPaletteVM; //delete in future
		self._viewModal = routingPaletteVM.mapCanvasPage;//delete in future
		self.routingPaletteVM = routingPaletteVM;//recommended
		self.mapCanvasPage = routingPaletteVM.mapCanvasPage;//recommended
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

	FieldTripPaletteSectionViewModel.prototype.uiInit = function(model, element)
	{
		var self = this;
		this.$element = $(element);
		// this.documentChange = tf.documentManagerViewModel.obCurrentDocument.subscribe(function(document)
		// {
		// 	if (document == self.mapCanvasPage)
		// 	{
		// 		setTimeout(function()
		// 		{
		// 			self.display.fixSchoolNodeStyle();
		// 		}, 20);
		// 	}
		// });
	};

	FieldTripPaletteSectionViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		if (!self.drawTool)
		{
			self.drawTool = self.routingPaletteVM.drawTool = new TF.RoutingMap.RoutingPalette.RoutingTripMapTool(self);
		}
		self.drawTool.selectionChange.subscribe(self.eventsManager.selectionChange_routing.bind(self));
		self.routingChangePath = new TF.RoutingMap.RoutingPalette.RoutingChangePath(self);
	};

	FieldTripPaletteSectionViewModel.prototype.cancelStopClick = function()
	{
		this.routingPaletteVM.$element.find(".print-setting-group .icon.destination.add-tripstop").removeClass("active");
	};

	FieldTripPaletteSectionViewModel.prototype.show = function()
	{
		var self = this;
		return self.dataModel.init();
	};

	FieldTripPaletteSectionViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		var isShowMode = !self.isShowMode();
		self.changeVisibility(isShowMode);
	};

	FieldTripPaletteSectionViewModel.prototype.changeVisibility = function(isShowMode)
	{
		this.isShowMode(isShowMode);
		if (!isShowMode)
		{
			this._viewModal.setMode("", "Normal");
		}
	};

	FieldTripPaletteSectionViewModel.prototype._changeShow = function()
	{
		var self = this;
		if (self.editTool && self.editTool.isEditing)
		{
			self.editTool.stop();
			PubSub.publish("clear_ContextMenu_Operation");
		}
		var isShowMode = self.isShowMode();
		if (!isShowMode)
		{
			// hide all field trips and exit AddFieldTripStop.
			if (self._viewModal.routingPaletteViewModel?.fieldTripMap?.editing.isAddingStop)
			{
				self._viewModal.routingPaletteViewModel.fieldTripMap.stopAddFieldTripStop();
			}
		}
		var layers = self.getLayers();
		layers.forEach(function(item)
		{
			item.visible = isShowMode;
		});
		if (!self._directionChangeShowMode)
		{
			self.dataModel.changeTripVisibility(self.dataModel.trips.map(function(t) { return t.id; }), isShowMode);
		}
		self.routingPaletteVM.childViewShowChange();
	};

	FieldTripPaletteSectionViewModel.prototype.onChangeTripVisibilityEvent = function()
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

	FieldTripPaletteSectionViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			return self.mapCanvasPage._map.findLayerById(item);
		}).filter(function(item)
		{
			return !!item;
		});
	};

	FieldTripPaletteSectionViewModel.prototype.close = function()
	{
		var self = this;
		var layers = this.getLayers();
		this.routingPaletteVM._viewModal.setMode("Routing", "Normal");
		this.editFieldTripStopModal.closeEditModal();
		return this.dataModel.close().then(function()
		{
			if (self.routingPaletteVM.showCount == 0)
			{
				layers.forEach(function(item)
				{
					item.removeAll();
				});
			}
			return true;
		});
	};

	FieldTripPaletteSectionViewModel.prototype.unSaveCheck = function()
	{
		var self = this;
		return self.dataModel.unSaveCheck();
	};

	FieldTripPaletteSectionViewModel.prototype.save = function()
	{
		return this.dataModel.saveRoutingFieldTrips(this.dataModel.trips);
	};

	FieldTripPaletteSectionViewModel.prototype.revert = function()
	{
		return this.dataModel.revert(false);
	};

	FieldTripPaletteSectionViewModel.prototype.dispose = function()
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