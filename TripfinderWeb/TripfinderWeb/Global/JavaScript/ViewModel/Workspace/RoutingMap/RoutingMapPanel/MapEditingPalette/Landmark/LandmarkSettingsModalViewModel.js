(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkSettingsModalViewModel = LandmarkSettingsModalViewModel;

	function LandmarkSettingsModalViewModel(dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Landmark Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/MapEditingPalette/LandmarkSettingsModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.MapEditingPalette.LandmarkSettingsViewModel(dataModel);
		this.data(this.viewModel);
	}

	LandmarkSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	LandmarkSettingsModalViewModel.prototype.constructor = LandmarkSettingsModalViewModel;

	LandmarkSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	LandmarkSettingsModalViewModel.prototype.negativeClick = function()
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