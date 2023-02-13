(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").DrivingPathModalViewModel = DrivingPathModalViewModel;

	function DrivingPathModalViewModel(tripStop, trip, generatedPath)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Driving Path from '" + tripStop.Street + "'");
		this.sizeCss = "driving-path-dialog";
		this.modalClass = "driving-path-body";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/DrivingPath");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonLabel("Regenerate Directions");
		this.viewModel = new TF.RoutingMap.RoutingPalette.DrivingPathViewModel(tripStop, trip, generatedPath);
		this.data(this.viewModel);
	}

	DrivingPathModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	DrivingPathModalViewModel.prototype.constructor = DrivingPathModalViewModel;

	DrivingPathModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	DrivingPathModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.generateDirections();
	}
})();