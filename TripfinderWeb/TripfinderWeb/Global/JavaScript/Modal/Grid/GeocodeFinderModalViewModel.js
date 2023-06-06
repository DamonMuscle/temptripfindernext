(function()
{
	createNamespace("TF.Modal.Grid").GeocodeFinderModalViewModel = GeocodeFinderModalViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function GeocodeFinderModalViewModel(sourceType, zipCodes)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-lg";
		self.title("Find");
		self.contentTemplate("Modal/GeocodeFinder");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");
		self.obResizable(true);
		self.obBackdrop(false);
		self.obEnableEnter(false);
		self.obEnableEsc(false);
		self.model = new TF.Control.GeocodeFinderViewModel(sourceType, zipCodes, self);
		self.data(self.model);
	}

	GeocodeFinderModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GeocodeFinderModalViewModel.prototype.constructor = GeocodeFinderModalViewModel;

	GeocodeFinderModalViewModel.prototype.positiveClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(self.model.result);
	};

	GeocodeFinderModalViewModel.prototype.negativeClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(false);
	};
})();