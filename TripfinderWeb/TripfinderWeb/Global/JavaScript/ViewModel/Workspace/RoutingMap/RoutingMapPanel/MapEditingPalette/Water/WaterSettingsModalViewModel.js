(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterSettingsModalViewModel = WaterSettingsModalViewModel;

	function WaterSettingsModalViewModel(dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Water Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/MapEditingPalette/WaterSettingsModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.MapEditingPalette.WaterSettingsViewModel(dataModel);
		this.data(this.viewModel);
	}

	WaterSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	WaterSettingsModalViewModel.prototype.constructor = WaterSettingsModalViewModel;

	WaterSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	WaterSettingsModalViewModel.prototype.negativeClick = function()
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