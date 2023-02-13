(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosEventsManager = TravelScenariosEventsManager;
	function TravelScenariosEventsManager(travelScenariosViewModel)
	{
		this.viewModel = travelScenariosViewModel;
		this.openTravelScenarioClick = this.openTravelScenarioClick.bind(this);
		this.newTravelScenariosClick = this.newTravelScenariosClick.bind(this);
		this.manageTravelScenarioClick = this.manageTravelScenarioClick.bind(this);
		this.settingsClick = this.settingsClick.bind(this);
		this.saveClick = this.saveClick.bind(this);
		this.revertClick = this.revertClick.bind(this);
	}

	TravelScenariosEventsManager.prototype.newTravelScenariosClick = function()
	{
		if (this.viewModel.dataModel.getTravelScenarios().length >= 10)
		{
			return tf.promiseBootbox.alert("Total travel scenario count cannot be larger than 10.");
		}
		tf.modalManager.showModal(new TF.RoutingMap.TravelScenariosPalette.TravelScenariosModalViewModel(this.viewModel.dataModel, null, "new"));
	};

	TravelScenariosEventsManager.prototype.manageTravelScenarioClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.TravelScenariosPalette.TravelScenarioManageModalViewModel(this.viewModel));
	};

	TravelScenariosEventsManager.prototype.openTravelScenarioClick = function(model)
	{
		this.viewModel.obPreviousSelectedTravelScenarios = this.viewModel.obSelectedTravelScenarios();
		this.viewModel.obSelectedTravelScenarios(model);
	};

	TravelScenariosEventsManager.prototype.settingsClick = function()
	{
		tf.modalManager.showModal(new TF.RoutingMap.TravelScenariosPalette.TravelScenariosSettingsModalViewModel(this.viewModel.dataModel)).then((setting) =>
		{
			if (setting)
			{
				this._changeStreetShow(setting.originalShowStreet, setting.showStreet);
			}
		});
	};

	TravelScenariosEventsManager.prototype._changeStreetShow = function(originalShowStreet, showStreet)
	{
		if (originalShowStreet == showStreet)
		{
			return;
		}
		var myStreetsViewModel = this.viewModel._viewModal.mapEditingPaletteViewModel.myStreetsViewModel;
		var showMode = myStreetsViewModel.showMode();
		if (showMode.travelScenario && !showMode.mapEditing)
		{
			myStreetsViewModel.changeShow(showStreet);
		}
	};

	TravelScenariosEventsManager.prototype.saveClick = function()
	{
		tf.AGSServiceUtil.isGPServiceExecuting(["MasterFileGDBGPService"]).then((isExecuting) =>
		{
			if (isExecuting)
			{
				tf.promiseBootbox.alert(`Map edit is currently executing and cannot be saved again until it is finished. This will take several minutes to complete. Please try again.`);
			}
			else
			{
				this.viewModel.save();
			}
		});
	};

	TravelScenariosEventsManager.prototype.revertClick = function()
	{
		this.viewModel.revert();
	};
})();