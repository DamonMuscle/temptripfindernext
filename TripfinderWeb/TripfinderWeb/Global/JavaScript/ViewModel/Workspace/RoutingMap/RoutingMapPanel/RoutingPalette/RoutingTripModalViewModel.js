(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingTripModalViewModel = RoutingTripModalViewModel;

	function RoutingTripModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);

		this.sizeCss = "modal-dialog-lg modal-dialog-xl new-trip-dailog";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/RoutingTripModal");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obOtherButtonLabel("Regenerate Directions");
		this.obOtherButtonVisible(false);
		this.obOtherButtonDisable(true);
		if (options.trip)
		{
			this.obPositiveButtonLabel("Apply");
			this.title("Edit Trip");
			if (options.trip.OpenType == "View")
			{
				this.title("View Trip");
				this.buttonTemplate("modal/Negative");
			}
		} else 
		{
			this.obPositiveButtonLabel("Create");
			this.title("New Trip");
			this.buttonTemplate("modal/PositiveNegative");
		}
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.RoutingTripViewModel({ ...options, obOtherButtonVisible: this.obOtherButtonVisible, obOtherButtonDisable: this.obOtherButtonDisable });
		this.data(this.viewModel);
		this.obResizable(false);
		this.isImperialUnit = tf.measurementUnitConverter.isImperial();
	}

	RoutingTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingTripModalViewModel.prototype.constructor = RoutingTripModalViewModel;

	RoutingTripModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	RoutingTripModalViewModel.prototype.negativeClick = function()
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

	RoutingTripModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.other();
	};

})();