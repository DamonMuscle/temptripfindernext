(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosSettingsModalViewModel = TravelScenariosSettingsModalViewModel;

	function TravelScenariosSettingsModalViewModel(TravelScenariosViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Travel Scenario Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/TravelScenariosSettingsModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.TravelScenariosPalette.TravelScenariosSettingsViewModel(TravelScenariosViewModel, type);
		this.data(this.viewModel);
	}

	TravelScenariosSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TravelScenariosSettingsModalViewModel.prototype.constructor = TravelScenariosSettingsModalViewModel;

	TravelScenariosSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	TravelScenariosSettingsModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve();
			}
		});
	};

})();