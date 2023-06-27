(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSettingModalViewModel = RoutingSettingModalViewModel;

	function RoutingSettingModalViewModel(dataModel, routeState)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Routing Settings");
		this.sizeCss = "modal-dialog-lg";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingSettingModal");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obOtherButtonLabel("Default");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.RoutingSettingViewModel(dataModel, routeState);
		this.data(this.viewModel);
	}

	RoutingSettingModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingSettingModalViewModel.prototype.constructor = RoutingSettingModalViewModel;

	RoutingSettingModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	RoutingSettingModalViewModel.prototype.negativeClick = function()
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

	RoutingSettingModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.default();
	};
})();