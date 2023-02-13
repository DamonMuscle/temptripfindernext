(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionSettingsModalViewModel = TravelRegionSettingsModalViewModel;

	function TravelRegionSettingsModalViewModel(travelRegionViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Travel Region Settings");

		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/TravelRegionSettingsModal');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.TravelScenariosPalette.TravelRegionSettingsViewModel(travelRegionViewModel, type);
		this.data(this.viewModel);
	};

	TravelRegionSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TravelRegionSettingsModalViewModel.prototype.constructor = TravelRegionSettingsModalViewModel;


	TravelRegionSettingsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	TravelRegionSettingsModalViewModel.prototype.negativeClick = function()
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
	}

})();