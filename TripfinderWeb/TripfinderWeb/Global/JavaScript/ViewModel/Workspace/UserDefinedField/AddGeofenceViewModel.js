(function()
{
	createNamespace("TF.UserDefinedField").AddGeofenceViewModel = AddGeofenceViewModel;

	function AddGeofenceViewModel(modalVm)
	{
		var self = this;
		self.addGeofenceModalVm = modalVm;
		self.gridType = modalVm.options.gridType;
		self.isEdit = modalVm.options.dataEntity != null && !modalVm.options.dataEntity.isCopy;
		self.isCopy = modalVm.options.dataEntity != null && modalVm.options.dataEntity.isCopy;
		if (modalVm.options.geofenceBoundaries)
		{
			self.geofenceBoundaries = modalVm.options.geofenceBoundaries;
		}
		self.routeState = tf.documentManagerViewModel.obCurrentDocument().routeState;
		self.onMapLoad = new TF.Events.Event();
		self.palettes = ko.observableArray([]);
		self.routingMapPanelManager = new TF.RoutingMap.RoutingMapPanelManager(self);
		self.editModals = ko.observableArray([]);
		self.geofenceEditModal = new TF.UserDefinedField.GeofenceEditModal(self);
		self.contextMenu = new TF.UserDefinedField.GeofenceMapContextMenu(self);
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.isDispose = false;
		//self.initViewModel();
	}

	AddGeofenceViewModel.prototype.init = function(vm, el)
	{
		var self = this;
		self.$element = $(el);
		window.setTimeout(function()
		{
			self.initMap();
		}, 300);
	};

	AddGeofenceViewModel.prototype.initViewModel = function()
	{
		var self = this;
		self.geofencePaletteViewModel = new TF.UserDefinedField.GeofencePaletteViewModel(self, true, null);
		var panel = new TF.RoutingMap.RoutingMapPanelViewModel([self.geofencePaletteViewModel], true, "routingmappanel", true, null, this.routeState, this);
		self.palettes.push(panel);
		self.sketchTool = new TF.RoutingMap.SketchTool(self.map, self);
	};

	AddGeofenceViewModel.prototype.initMap = function()
	{
		const self = this;
		const baseMapId = self.geofenceBoundaries && self.geofenceBoundaries.baseMapId;
		const element = self.$element.find(".map-container");
		const options = {
			baseMapId: baseMapId || "",
			center: null,
			zoom: -1,
			isDetailView: false,
			isLandscape: true,
			isReadMode: false,
			zoomAvailable: true,
			homeLocationPinAvailable: false,
			thematicAvailable: false,
			baseMapAvailable: true,
			trafficMapAvailable: false,
			measurementAvailable: true,
			manuallyPinAvailable: false,
			drawBoundaryAvailable: false,
			thematicInfo: false,
			legendStatus: false,
			GoogleStreet: false,
			myMapAvailable: false,
			geoFinderAvailable: false
		};
		self.element = element;
		const map = TF.Helper.MapHelper.createMap(element, self, options);

		self.map = map;
		self.mapView = map.mapView;

		var updatingEvent = self.mapView.watch('updating', function(result)
		{
			if (!result)
			{
				try
				{
					if (self.isDispose)
					{
						return;
					}
					updatingEvent.remove();
					self.onMapLoad.notify();
					self.autoPan = TF.RoutingMap.AutoPanManager.getAutoPan(self.map);
					self.autoPan.initialize(self.element, 20);
					self.initViewModel();
					self.routingMapPanelManager.init();
					self.contextMenu && self.contextMenu.init();
				} catch (e)
				{
					console.error(e);
				}
			}
		});

		//self.routingMapToolsetting();
	};

	AddGeofenceViewModel.prototype.setMode = function(type, mode)
	{
		return null;
	}

	AddGeofenceViewModel.prototype.apply = function()
	{
		return Promise.resolve().then(() =>
		{
			return this.geofencePaletteViewModel.eventsManager.dataModel.getSetting().then(settings =>
			{
				return {
					settings: settings,
					baseMapId: this.map.basemap.id,
					boundaries: this.geofencePaletteViewModel.eventsManager.dataModel.all.map(boundary =>
					{
						boundary.geometry = boundary.geometry.toJSON();
						return boundary;
					})
				};
			});
		});
	};

	AddGeofenceViewModel.prototype.cancel = function()
	{
		return Promise.resolve(false);
	};

	AddGeofenceViewModel.prototype.dispose = function()
	{
		// dispose
		this.isDispose = true;
		this.sketchTool = null;
		this.autoPan = null;
		this.map = null;
		this.geofenceEditModal = null;
		this.editModals = null;
		this.routingMapPanelManager.dispose();
	};
})();
