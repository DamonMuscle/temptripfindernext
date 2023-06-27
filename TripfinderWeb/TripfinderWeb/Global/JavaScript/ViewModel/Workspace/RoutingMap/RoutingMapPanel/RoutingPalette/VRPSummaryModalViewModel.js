(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").VRPSummaryModalViewModel = VRPSummaryModalViewModel;

	function VRPSummaryModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Trip Optimization Summary");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/VRPSummary");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obPositiveButtonLabel("Apply");
		this.obOtherButtonLabel("Compare and open in new map canvas");
		this.viewModel = new TF.RoutingMap.RoutingPalette.VRPSummaryViewModel(options);
		this.data(this.viewModel);
	}

	VRPSummaryModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	VRPSummaryModalViewModel.prototype.constructor = VRPSummaryModalViewModel;

	VRPSummaryModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	VRPSummaryModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.openInNewClick().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

})();