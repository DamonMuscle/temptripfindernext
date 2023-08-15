(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SetScheduledTimeModalViewModel = SetScheduledTimeModalViewModel;

	function SetScheduledTimeModalViewModel(tripStop, trip)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Update Stop Time");
		this.sizeCss = "set-schedule-time-dialog";
		this.modalClass = "update-stop-time-body";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/SetScheduledTime");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.SetScheduledTimeViewModel(tripStop, trip);
		this.data(this.viewModel);
	}

	SetScheduledTimeModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SetScheduledTimeModalViewModel.prototype.constructor = SetScheduledTimeModalViewModel;

	SetScheduledTimeModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SetScheduledTimeModalViewModel.prototype.negativeClick = function()
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