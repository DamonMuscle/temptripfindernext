(function()
{
	createNamespace("TF.Modal").GeocodeSettingsModalViewModel = GeocodeSettingsModalViewModel;

	function GeocodeSettingsModalViewModel(selectedCount, allUngeocodeCount, selectUngeocodeCount, gridType)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-sm";
		self.title("Geocode Records");
		self.contentTemplate("Modal/GeocodeSettings");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");

		self.model = new TF.Control.GeocodeSettingsViewModel(selectedCount, allUngeocodeCount, selectUngeocodeCount, gridType);
		self.data(self.model);
	}

	GeocodeSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GeocodeSettingsModalViewModel.prototype.constructor = GeocodeSettingsModalViewModel;

	GeocodeSettingsModalViewModel.prototype.positiveClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(self.data());
	};

	GeocodeSettingsModalViewModel.prototype.negativeClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(false);
	};
})();