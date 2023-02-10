(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadSettingsModalViewModel = RailroadSettingsModalViewModel;

	function RailroadSettingsModalViewModel(mapEditingViewModel, type)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Railroad Settings");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate('workspace/Routing Map/RoutingMapPanel/MapEditingPalette/RailroadSettingsModal');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Apply")
		this.obNegativeButtonLabel("Cancel")
		this.viewModel = new TF.RoutingMap.MapEditingPalette.RailroadSettingsViewModel(mapEditingViewModel, type);
		this.data(this.viewModel);
	};

	RailroadSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RailroadSettingsModalViewModel.prototype.constructor = RailroadSettingsModalViewModel;


	RailroadSettingsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	RailroadSettingsModalViewModel.prototype.negativeClick = function()
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