(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDirectionModalViewModel = RoutingDirectionModalViewModel;

	function RoutingDirectionModalViewModel(tripStops, trip, showStopsTitle)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title(trip.Name);
		this.sizeCss = "modal-dialog-lg";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingDirectionModal');
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonLabel("Regenerate Directions");
		if (trip.OpenType == "View")
		{
			this.buttonTemplate("modal/Positive");
			this.obPositiveButtonLabel("Close");
		}
		this.viewModel = new TF.RoutingMap.RoutingPalette.RoutingDirectionViewModel(this, tripStops, trip, showStopsTitle);
		this.data(this.viewModel);
	}

	RoutingDirectionModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingDirectionModalViewModel.prototype.constructor = RoutingDirectionModalViewModel;

	RoutingDirectionModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	RoutingDirectionModalViewModel.prototype.negativeClick = function()
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

	RoutingDirectionModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.generateDirections();
	}

})();