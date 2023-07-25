(function()
{
	createNamespace("TF.UserDefinedField").GeofenceSettingsModalViewModel = GeofenceSettingsModalViewModel;

	function GeofenceSettingsModalViewModel(dataModel, options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Settings");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("Workspace/DataEntry/School/SettingModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.UserDefinedField.GeofenceSettingsViewModel(dataModel, options);
		this.data(this.viewModel);
	}

	GeofenceSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GeofenceSettingsModalViewModel.prototype.constructor = GeofenceSettingsModalViewModel;

	GeofenceSettingsModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	GeofenceSettingsModalViewModel.prototype.negativeClick = function()
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