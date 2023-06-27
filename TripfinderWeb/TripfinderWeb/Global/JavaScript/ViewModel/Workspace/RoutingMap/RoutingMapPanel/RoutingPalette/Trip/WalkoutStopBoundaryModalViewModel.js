(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").WalkoutStopBoundaryModalViewModel = WalkoutStopBoundaryModalViewModel;

	function WalkoutStopBoundaryModalViewModel(tripStop, viewModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Walkout Stop Boundary");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/WalkoutStopBoundaryModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.WalkoutStopBoundaryViewModel(tripStop, viewModel);
		this.data(this.viewModel);
	}

	WalkoutStopBoundaryModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	WalkoutStopBoundaryModalViewModel.prototype.constructor = WalkoutStopBoundaryModalViewModel;

	WalkoutStopBoundaryModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	WalkoutStopBoundaryModalViewModel.prototype.negativeClick = function()
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