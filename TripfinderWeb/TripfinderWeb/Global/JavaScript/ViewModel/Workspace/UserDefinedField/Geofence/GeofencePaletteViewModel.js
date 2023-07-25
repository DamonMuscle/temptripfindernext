(function()
{
	createNamespace("TF.UserDefinedField").GeofencePaletteViewModel = GeofencePaletteViewModel;

	function GeofencePaletteViewModel(viewModel, routeState)
	{
		TF.RoutingMap.BasePaletteViewModel.call(this, viewModel, true, routeState);

		var self = this;
		self.obShow(true);
		self.routeState = routeState;
		self.isEyeVisible(true);
		self.isShowMode(true);
		self.type = "geofence";
		self.title = "Geofence";
		self.templateName = "Workspace/UserDefinedField/GeofencePalette";
		self.$element = null;
		self._viewModal = viewModel; //AddGeofenceViewModel
		self.palettes = ko.observableArray([]);
		self.dataModel = new TF.UserDefinedField.GeofenceDataModel(self);
		self.eventsManager = new TF.UserDefinedField.GeofenceEventsManager(self);
		self.display = new TF.UserDefinedField.GeofenceDisplay(self);
		self.layers = [];
	}

	GeofencePaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	GeofencePaletteViewModel.prototype.constructor = GeofencePaletteViewModel;

	GeofencePaletteViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
		this.drawTool = new TF.UserDefinedField.GeofenceMapTool(this);
		//this.restoreGeofenceBoundaryGraps();
		this.dataModel.init();
	};

	GeofencePaletteViewModel.prototype.restoreGeofenceBoundaryGraps = function()
	{
		const self = this;
		// restore boundary shapes on map
		if (self._viewModal.geofenceBoudaries)
		{
			self._viewModal.geofenceBoudaries.boundaries.forEach(boundary =>
			{
				self.drawTool._add(boundary);
			})
		}
	}

	GeofencePaletteViewModel.prototype.dispose = function()
	{
		this.childViewModels.forEach(function(childViewModel)
		{
			childViewModel.dispose();
		});

		this.dataModel.dispose();
	};

})();