(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopSettingsModalViewModel = TrialStopSettingsModalViewModel;

	function TrialStopSettingsModalViewModel(dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Trial Stop Settings");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/TrialStopSettingModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.TrialStopSettingsViewModel(dataModel);
		this.data(this.viewModel);
	}

	TrialStopSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TrialStopSettingsModalViewModel.prototype.constructor = TrialStopSettingsModalViewModel;

	TrialStopSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	TrialStopSettingsModalViewModel.prototype.negativeClick = function()
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