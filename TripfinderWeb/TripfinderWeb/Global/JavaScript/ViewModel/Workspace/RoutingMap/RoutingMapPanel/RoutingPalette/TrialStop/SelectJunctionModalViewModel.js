(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectJunctionModalViewModel = SelectJunctionModalViewModel;

	function SelectJunctionModalViewModel(stops, drawTool, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Select Stop");
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/SelectJunctionModal");
		this.buttonTemplate("modal/positivenegativeother");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonLabel("Suggest");
		this.obOtherButtonVisible(stops.filter(function(stop) { return stop.students.length > 0 }).length > 0);
		this.viewModel = new TF.RoutingMap.RoutingPalette.SelectJunctionViewModel(stops, drawTool, dataModel);
		this.data(this.viewModel);
	}

	SelectJunctionModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SelectJunctionModalViewModel.prototype.constructor = SelectJunctionModalViewModel;

	SelectJunctionModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	SelectJunctionModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve([]);
			}
		});
	};

	SelectJunctionModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.suggest();
	};

})();