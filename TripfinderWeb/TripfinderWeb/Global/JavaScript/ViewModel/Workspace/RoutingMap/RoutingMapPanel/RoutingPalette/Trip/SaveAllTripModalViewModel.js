(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SaveAllTripModalViewModel = SaveAllTripModalViewModel;

	function SaveAllTripModalViewModel(trips, changeType)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Students Affected Schedules");
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/SelectTripModal");
		this.buttonTemplate("modal/positivenegativeother");
		this.obPositiveButtonLabel("Save");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonVisible(false);
		this.viewModel = new TF.RoutingMap.RoutingPalette.SaveAllTripViewModel(trips, changeType);
		this.data(this.viewModel);
	}

	SaveAllTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SaveAllTripModalViewModel.prototype.constructor = SaveAllTripModalViewModel;

	SaveAllTripModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SaveAllTripModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.applyToAllClick().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	SaveAllTripModalViewModel.prototype.negativeClick = function()
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