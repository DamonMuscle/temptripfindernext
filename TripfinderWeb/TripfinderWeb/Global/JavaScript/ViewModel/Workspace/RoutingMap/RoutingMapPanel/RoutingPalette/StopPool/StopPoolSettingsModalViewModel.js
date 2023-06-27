(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolSettingsModalViewModel = StopPoolSettingsModalViewModel;

	function StopPoolSettingsModalViewModel(dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Stop Pool Settings");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/StopPoolSettingModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.StopPoolSettingsViewModel(dataModel);
		this.data(this.viewModel);
	}

	StopPoolSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	StopPoolSettingsModalViewModel.prototype.constructor = StopPoolSettingsModalViewModel;

	StopPoolSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	StopPoolSettingsModalViewModel.prototype.negativeClick = function()
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