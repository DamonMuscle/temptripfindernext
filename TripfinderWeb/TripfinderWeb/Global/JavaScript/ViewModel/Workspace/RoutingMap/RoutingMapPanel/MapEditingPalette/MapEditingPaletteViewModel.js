(function()
{
	createNamespace("TF.RoutingMap").MapEditingPaletteViewModel = MapEditingPaletteViewModel;
	function MapEditingPaletteViewModel(viewModal, isOpen, routeState)
	{
		TF.RoutingMap.BasePaletteViewModel.call(this, viewModal, isOpen, routeState);
		var self = this;
		self.type = "mapEditing";
		self.title = "Map Editing";
		self.isOpen = !!isOpen;
		self.templateName = "workspace/Routing Map/RoutingMapPanel/MapEditingPalette/MapEditingPalette";
		self.confirmWindowCount = 0;

		this.$element = null;
		self.isEyeVisible(true);
		self.isShowMode(true);
		self.eyeTitle("Map Editing");
		self.mode = "Normal";// Create,EditBoundaries,SelectMapArea,Normal,CreateBoundary
		self.myStreetsViewModel = new TF.RoutingMap.MapEditingPalette.MyStreetsViewModel(self);
		self.railroadViewModel = new TF.RoutingMap.MapEditingPalette.RailroadViewModel(self);
		self.zipCodeViewModel = new TF.RoutingMap.MapEditingPalette.ZipCodeViewModel(self, true, routeState);
		self.municipalBoundaryViewModel = new TF.RoutingMap.MapEditingPalette.MunicipalBoundaryViewModel(self, true, routeState);
		self.waterViewModel = new TF.RoutingMap.MapEditingPalette.WaterViewModel(self, true, routeState);
		self.landmarkViewModel = new TF.RoutingMap.MapEditingPalette.LandmarkViewModel(self, true, routeState);
		self._viewModal.onMapLoad.subscribe(this._onMapLoad.bind(this));
		self.childViewModels = [self.myStreetsViewModel, self.waterViewModel, self.landmarkViewModel, self.railroadViewModel, self.zipCodeViewModel, self.municipalBoundaryViewModel];
		self.viewModelNames = ["myStreets", "railroad", "zipCode", "landmark", "municipalBoundary", "water"];
	}

	MapEditingPaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	MapEditingPaletteViewModel.prototype.constructor = MapEditingPaletteViewModel;

	MapEditingPaletteViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
	};

	MapEditingPaletteViewModel.prototype._onMapLoad = function()
	{
		var self = this;
		self.obShow() && this.addShowCount();
		self.myStreetsViewModel.init();
		self.railroadViewModel.init();
		self.landmarkViewModel.init();
		self.waterViewModel.init();
		self.zipCodeViewModel.init();
	};

	MapEditingPaletteViewModel.prototype.show = function()
	{
		var self = this;
		var visibleSetting = self._mapEditingPaletteVisible();
		self.viewModelNames.forEach(function(name)
		{
			var isShow = visibleSetting[name] != false;
			if (name == "zipCode" || name == "municipalBoundary")
			{
				isShow = false;
			}
			self[name + "ViewModel"].isShowMode(isShow);
			self[name + "ViewModel"].show();
		});
		tf.gaHelper.send('Area', 'Map Editing');
		this.addShowCount();
		return Promise.resolve(true);
	};

	MapEditingPaletteViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		var isShowMode = !self.isShowMode();
		self.childViewModels.forEach(function(viewModal)
		{
			viewModal.isShowMode(isShowMode);
		});
		self.isShowMode(isShowMode);
	};

	MapEditingPaletteViewModel.prototype.showChange = function()
	{
		var self = this;
		self.isShowMode(Enumerable.From(self.viewModelNames).Any(function(name) { return self[name + "ViewModel"].isShowMode(); }));
		// save show setting to user preference
		clearTimeout(self.saveShowModeTimeout);
		self.saveShowModeTimeout = setTimeout(function()
		{
			var showViewModels = {};
			self.viewModelNames.forEach(function(name)
			{
				showViewModels[name] = self[name + "ViewModel"].isShowMode();
			});
			self._mapEditingPaletteVisible(showViewModels);
		}, 500);
	};

	MapEditingPaletteViewModel.prototype._mapEditingPaletteVisible = function(value)
	{
		if (value)
		{
			tf.storageManager.save("mapEditingPaletteVisible", value);
		} else
		{
			var setting = tf.storageManager.get("mapEditingPaletteVisible");
			if (!setting)
			{
				setting = {};
				this.viewModelNames.forEach(function(c)
				{
					setting[c] = true;
				});
			}
			return setting;
		}
	};

	MapEditingPaletteViewModel.prototype.getLayers = function()
	{
		return [];
	};

	MapEditingPaletteViewModel.prototype.close = function()
	{
		this.minusShowCount();
		var promise = [];
		this.childViewModels.forEach(function(viewModal)
		{
			promise.push(viewModal.close());
		});
		return Promise.all(promise).then(function()
		{
			return Promise.resolve(true);
		});
	};

	MapEditingPaletteViewModel.prototype.unSaveCheck = function(openingName, viewModels, isRevert)
	{
		var self = this;
		if (viewModels == null)
		{
			viewModels = [{
				unSaveCheck: self.myStreetsViewModel.unSaveCheck.bind(self.myStreetsViewModel),
				save: self.myStreetsViewModel.save.bind(self.myStreetsViewModel),
				revert: self.myStreetsViewModel.revert.bind(self.myStreetsViewModel),
				close: self.myStreetsViewModel.close.bind(self.myStreetsViewModel),
				lockConfirm: true
			}, {
				unSaveCheck: self.railroadViewModel.unSaveCheck.bind(self.railroadViewModel),
				save: self.railroadViewModel.save.bind(self.railroadViewModel),
				revert: self.railroadViewModel.revert.bind(self.railroadViewModel),
				close: self.railroadViewModel.close.bind(self.railroadViewModel)
			}, {
				unSaveCheck: self.zipCodeViewModel.unSaveCheck.bind(self.zipCodeViewModel),
				save: self.zipCodeViewModel.dataModel.save.bind(self.zipCodeViewModel.dataModel),
				revert: self.zipCodeViewModel.dataModel.revert.bind(self.zipCodeViewModel.dataModel),
				close: self.zipCodeViewModel.close.bind(self.zipCodeViewModel)
			}, {
				unSaveCheck: self.municipalBoundaryViewModel.unSaveCheck.bind(self.municipalBoundaryViewModel),
				save: self.municipalBoundaryViewModel.dataModel.saveMunicipalBoundary.bind(self.municipalBoundaryViewModel.dataModel),
				revert: self.municipalBoundaryViewModel.dataModel.revertMunicipalBoundary.bind(self.municipalBoundaryViewModel.dataModel),
				close: self.municipalBoundaryViewModel.close.bind(self.municipalBoundaryViewModel)
			}, {
				unSaveCheck: self.landmarkViewModel.unSaveCheck.bind(self.landmarkViewModel),
				save: self.landmarkViewModel.save.bind(self.landmarkViewModel),
				revert: self.landmarkViewModel.revert.bind(self.landmarkViewModel),
				close: self.landmarkViewModel.close.bind(self.landmarkViewModel)
			}, {
				unSaveCheck: self.waterViewModel.unSaveCheck.bind(self.waterViewModel),
				save: self.waterViewModel.save.bind(self.waterViewModel),
				revert: self.waterViewModel.revert.bind(self.waterViewModel),
				close: self.waterViewModel.close.bind(self.waterViewModel)
			}];
		}
		return self._multiViewUnSaveCheck(openingName, viewModels, isRevert);
	};

	MapEditingPaletteViewModel.prototype.checkWithLockConfirm = function()
	{
		return this.checkRelateStreetScenarioChanged();
	};

	MapEditingPaletteViewModel.prototype.checkRelateStreetScenarioChanged = function()
	{
		if (this.myStreetsViewModel.dataModel.isRelateStreetScenarioChanged())
		{
			return tf.promiseBootbox.alert("Streets and Travel Scenarios are both changed, please save or revert them first.").then(() =>
			{
				return null;
			});
		}
		return Promise.resolve(true);
	};

	MapEditingPaletteViewModel.prototype.dispose = function()
	{
		this.childViewModels.forEach(function(viewModal)
		{
			viewModal.dispose();
		});
	};
})();