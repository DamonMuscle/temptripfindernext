(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodeSettingsModalViewModel = ZipCodeSettingsModalViewModel;

	function ZipCodeSettingsModalViewModel(mapEditingViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Postal Code Boundaries Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/MapEditingPalette/ZipCodeSettingsModal');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Apply")
		this.obNegativeButtonLabel("Cancel")
		this.viewModel = new TF.RoutingMap.MapEditingPalette.ZipCodeSettingsViewModel(mapEditingViewModel, type);
		this.data(this.viewModel);
	};

	ZipCodeSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ZipCodeSettingsModalViewModel.prototype.constructor = ZipCodeSettingsModalViewModel;


	ZipCodeSettingsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	ZipCodeSettingsModalViewModel.prototype.negativeClick = function()
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