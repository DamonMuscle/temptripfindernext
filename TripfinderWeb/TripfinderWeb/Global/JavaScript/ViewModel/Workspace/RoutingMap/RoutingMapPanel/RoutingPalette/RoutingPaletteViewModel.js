(function()
{
	createNamespace("TF.RoutingMap").RoutingPaletteViewModel = RoutingPaletteViewModel;

	function RoutingPaletteViewModel(viewModal, isOpen, routeState, trips)
	{
		TF.RoutingMap.BasePaletteViewModel.call(this, viewModal, isOpen, routeState);
		var self = this;
		self.obShow(false);
		self.routeState = routeState;
		self.isEyeVisible(true);
		self.isShowMode(true);
		self.type = "routing";
		self.title = "Routing";
		self.isOpen = !!isOpen;
		self.templateName = "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingPalette";
		self.$element = null;
		self._viewModal = viewModal;
		self.tripViewModel = new TF.RoutingMap.RoutingPalette.TripViewModel(self, routeState, trips);
		self.dataModel = self.tripViewModel.dataModel;
		self.stopPoolViewModel = new TF.RoutingMap.RoutingPalette.StopPoolViewModel(self);
		self.trialStopViewModel = new TF.RoutingMap.RoutingPalette.TrialStopViewModel(self);
		self.unassignedStudentViewModel = new TF.RoutingMap.RoutingPalette.UnassignedStudentViewModel(self);
		// self.nonEligibleZoneViewModel = new TF.RoutingMap.RoutingPalette.NonEligibleZoneViewModel(self);
		self.childViewModels =[self.tripViewModel]; // [self.stopPoolViewModel, self.unassignedStudentViewModel, self.tripViewModel, self.trialStopViewModel, self.nonEligibleZoneViewModel];
		self._viewModal.onMapLoad.subscribe(this._onMapLoad.bind(this));
		self.layers = [];

		PubSub.subscribe("on_FieldTripMap_Change", self.onFieldTripMapChange.bind(self));
		PubSub.subscribe("on_FieldTripMap_ZoomToLayers", self.onFieldTripMapZoomToLayers.bind(self));
		PubSub.subscribe("on_FieldTripMap_ShowHide", self.onFieldTripMapShowHide.bind(self));
		PubSub.subscribe("on_FieldTripMap_UpdateColor", self.onFieldTripMapUpdateColor.bind(self));
		PubSub.subscribe("on_FieldTripMap_TripPathTypeChange", self.onFieldTripMapTripPathTypeChange.bind(self));
	}

	RoutingPaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	RoutingPaletteViewModel.prototype.constructor = RoutingPaletteViewModel;

	RoutingPaletteViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
	};

	RoutingPaletteViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		var map = self._viewModal._map;
		self.mapInstance = self._viewModal.mapInstance;
		self.map = map;
		self.initLabelSetting();
		(self.obShow() && self.showCount == 0) && self.addShowCount();
		self.childViewModels.forEach(function(childViewModel)
		{
			childViewModel._onMapLoad();
		});
	};

	RoutingPaletteViewModel.prototype.initLabelSetting = function()
	{
		var self = this;
		self.dataModel.getSetting().then(function(setting)
		{
			self.tripStopLabelSetting = new TF.RoutingMap.RoutingPalette.TripLabelSetting(self, self.routeState, 'Stop', self.map, setting.showLabel, 'routing', 'routingTripStopLayer');
		});
	};

	RoutingPaletteViewModel.prototype.show = function()
	{
		var self = this;
		if (self.showCount == 0)
		{
			// tf.gaHelper.send('Area', 'Routing');
			if (self.unassignedStudentViewModel.drawTool && self._viewModal.RoutingMapTool.thematicTool && self.unassignedStudentViewModel.drawTool.getSettingDisplayCount(self.unassignedStudentViewModel.dataModel.getCandidateSetting()) > 1)
			{
				self._viewModal.RoutingMapTool.thematicTool.thematicMenu.clearThematicSelection(true);
				self._viewModal.RoutingMapTool.$offMapTool.find(".tool-icon.thematics").addClass("disable");
			}
			self.childViewModels.forEach(function(childViewModel)
			{
				childViewModel.show();
			});
			setTimeout(function()
			{
				// use timeout to make sure RoutingMapTool is ready
				if (self._viewModal.RoutingMapTool.thematicTool)
				{
					self._viewModal.RoutingMapTool.thematicTool.layerId = "candidateStudentFeatureLayer";
				}
			}, 2000);
		}
		this.addShowCount();
		return Promise.resolve(true);
	};

	RoutingPaletteViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		var isShowMode = !self.isShowMode();
		self.isShowMode(isShowMode);
		self.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.isShowMode(isShowMode);
		});
	};

	RoutingPaletteViewModel.prototype.childViewShowChange = function()
	{
		var self = this;
		var isShow = false;
		self.childViewModels.forEach(function(childViewModel)
		{
			isShow |= childViewModel.isShowMode();
		});
		self.isShowMode(!!isShow);
	};

	RoutingPaletteViewModel.prototype.getLayers = function()
	{
		var layers = [];
		this.childViewModels.forEach(function(childViewModel)
		{
			layers = layers.concat(childViewModel.getLayers());
		});
		return layers;
	};

	RoutingPaletteViewModel.prototype.onFieldTripMapChange = async function(_, data)
	{
		if (!this.fieldTripMap)
		{
			this.fieldTripMap = new TF.RoutingPalette.FieldTripMap(this.mapInstance);
		}
		this.fieldTripMap.setPathLineType(data.isSequencePath);
		await this.displayFieldTripPath(data);
	}

	RoutingPaletteViewModel.prototype.displayFieldTripPath = async function(data)
	{
		if (data && (data.add.length > 0))
		{
			const addFieldTrips = data.add;
			this.fieldTripMap.initArrowLayers(addFieldTrips);

			for (let i = 0; i < addFieldTrips.length; i++)
			{
				const fieldTrip = addFieldTrips[i];
				await this.fieldTripMap.addFieldTrip(fieldTrip);
			}
		}
		
		if (data && (data.delete.length > 0))
		{
			const deleteFieldTrips = data.delete;
			for (let i = 0; i < deleteFieldTrips.length; i++)
			{
				const fieldTrip = deleteFieldTrips[i];
				this.fieldTripMap.removeFieldTrip(fieldTrip);
			}
		}

		const fieldTrips = this.dataModel.trips;
		if (fieldTrips.length > 0)
		{
			this.fieldTripMap.zoomToFieldTripLayers(fieldTrips);
		}
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapZoomToLayers = function(_, data)
	{
		this.fieldTripMap?.zoomToFieldTripLayers(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapShowHide = function(_, data)
	{
		this.fieldTripMap?.setFieldTripVisible(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapUpdateColor = function(_, data)
	{
		this.fieldTripMap?.updateSymbolColor(data);
	}

	RoutingPaletteViewModel.prototype.onFieldTripMapTripPathTypeChange = function(_, isSequencePath)
	{
		this.fieldTripMap?.setPathLineType(isSequencePath);
		this.fieldTripMap?.updateFieldTripPathVisible(this.dataModel.trips);
	}

	RoutingPaletteViewModel.prototype.close = function()
	{
		var self = this;
		self.minusShowCount();
		var promises = [];
		self.childViewModels.forEach(function(childViewModel)
		{
			promises.push(childViewModel.close());
		});
		return Promise.all(promises).then(function()
		{
			if (self._viewModal.RoutingMapTool.thematicTool)
			{
				if (!self._viewModal.RoutingMapTool.thematicTool.thematicMenu.obSelectThematicId())
				{
					self._viewModal.RoutingMapTool.thematicTool.thematicMenu.clearThematicSelection(true);
				}
				self._viewModal.RoutingMapTool.thematicTool.grid.allData = [];
				self._viewModal.RoutingMapTool.thematicTool.grid.allIds = [];
				self._viewModal.RoutingMapTool.thematicTool.grid.highLightedData = [];
			}
			self._viewModal.RoutingMapTool.$offMapTool.find(".tool-icon.thematics").removeClass("disable");
			return true;
		});
	};

	RoutingPaletteViewModel.prototype.unSaveCheck = function(openingName)
	{
		var viewModels = [this.tripViewModel, this.stopPoolViewModel];
		return this._multiViewUnSaveCheck(openingName, viewModels);
	};

	RoutingPaletteViewModel.prototype.dispose = function()
	{
		this.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.dispose();
		});

		tfdispose(this);
	};
})();
