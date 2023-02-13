(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenariosModalViewModel = TravelScenariosModalViewModel;

	function TravelScenariosModalViewModel(travelScenariosDataModel, data, eventType)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.eventType = eventType;
		var title = eventType.indexOf("new") >= 0 ? "New Travel Scenario" : "Edit Travel Scenario";
		this.title(title);
		this.sizeCss = "message-modal-dialog";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/TravelScenariosModal');
		this.buttonTemplate('modal/positivenegative');
		this.viewModel = new TF.RoutingMap.TravelScenariosPalette.EditTravelScenariosViewModel(travelScenariosDataModel, data, eventType);
		this.data(this.viewModel);
	};

	TravelScenariosModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TravelScenariosModalViewModel.prototype.constructor = TravelScenariosModalViewModel;

	TravelScenariosModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	TravelScenariosModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			self.hide();
			self.viewModel.pageLevelViewModel.obValidationErrors([]);
			self.resolve(result);
		});
	}
})();