(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentSettingsModalViewModel = UnassignedStudentSettingsModalViewModel;

	function UnassignedStudentSettingsModalViewModel(dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Unassigned Students Settings");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/UnassignedStudentSettingModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.UnassignedStudentSettingsViewModel(dataModel);
		this.data(this.viewModel);
	}

	UnassignedStudentSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	UnassignedStudentSettingsModalViewModel.prototype.constructor = UnassignedStudentSettingsModalViewModel;

	UnassignedStudentSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	UnassignedStudentSettingsModalViewModel.prototype.negativeClick = function()
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