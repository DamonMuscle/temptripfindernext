(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MunicipalBoundarySettingsModalViewModel = MunicipalBoundarySettingsModalViewModel;

	function MunicipalBoundarySettingsModalViewModel(mapEditingViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Municipal Boundaries Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate('workspace/Routing Map/RoutingMapPanel/MapEditingPalette/MunicipalBoundarySettingsModal');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.MapEditingPalette.MunicipalBoundarySettingsViewModel(mapEditingViewModel, type);
		this.data(this.viewModel);
	}

	MunicipalBoundarySettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	MunicipalBoundarySettingsModalViewModel.prototype.constructor = MunicipalBoundarySettingsModalViewModel;

	MunicipalBoundarySettingsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	MunicipalBoundarySettingsModalViewModel.prototype.negativeClick = function()
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