(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").AssignStopsModalViewModel = AssignStopsModalViewModel;

	function AssignStopsModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Trip Stops");
		this.sizeCss = "modal-dialog";
		this.modalClass = "assign-stop-body";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/AssignStops");
		this.buttonTemplate("modal/PositiveNegativeOther");
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.obDisableControl(true);
		this.viewModel = new TF.RoutingMap.RoutingPalette.AssignStopsViewModel(options, this.obDisableControl, this.negativeClick.bind(this));
		this.obOtherButtonLabel = ko.pureComputed(function()
		{
			var isMultiple = this.viewModel.selectedTripStops().length > 1;
			return "Delete Selected Stop" + (isMultiple ? "s" : "");
		}, this);
		this.obOtherButtonDisable = ko.pureComputed(function()
		{
			return this.viewModel.selectedTripStops().length == 0;
		}, this);

		this.data(this.viewModel);
	}

	AssignStopsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	AssignStopsModalViewModel.prototype.constructor = AssignStopsModalViewModel;

	AssignStopsModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.viewModel.deleteSelectedTripStops();
	};

	AssignStopsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	AssignStopsModalViewModel.prototype.negativeClick = function()
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