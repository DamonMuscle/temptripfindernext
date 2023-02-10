(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MapEditingSettingsModalViewModel = MapEditingSettingsModalViewModel;

	function MapEditingSettingsModalViewModel(mapEditingViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("My Streets Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate('workspace/Routing Map/RoutingMapPanel/MapEditingPalette/MapEditingSettingsModal');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Apply")
		this.obNegativeButtonLabel("Cancel")
		this.viewModel = new TF.RoutingMap.MapEditingPalette.MapEditingSettingsViewModel(mapEditingViewModel, type);
		this.data(this.viewModel);
	};

	MapEditingSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	MapEditingSettingsModalViewModel.prototype.constructor = MapEditingSettingsModalViewModel;


	MapEditingSettingsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	MapEditingSettingsModalViewModel.prototype.negativeClick = function()
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