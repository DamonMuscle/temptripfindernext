(function()
{
	createNamespace("TF.Modal.Grid").GeocodeInteractiveModalViewModel = GeocodeInteractiveModalViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function GeocodeInteractiveModalViewModel(sourceType, datasource, previousCount, gridViewModel)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-md";
		self.title("Geocoding Students");
		self.contentTemplate("Modal/GeocodeInteractiveControl");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");

		self.model = new TF.Control.GeocodeInteractiveViewModel(sourceType, datasource, previousCount, gridViewModel, self);
		self.data(self.model);
	}

	GeocodeInteractiveModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GeocodeInteractiveModalViewModel.prototype.constructor = GeocodeInteractiveModalViewModel;

	GeocodeInteractiveModalViewModel.prototype.negativeClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(false);
	};
})();