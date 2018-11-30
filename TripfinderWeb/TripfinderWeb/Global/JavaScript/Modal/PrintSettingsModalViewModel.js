(function()
{
	createNamespace("TF.Modal").PrintSettingsModalViewModel = PrintSettingsModalViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function PrintSettingsModalViewModel()
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.title("Print Settings");
		self.contentTemplate("Modal/PrintSettings");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");
		var IsChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		self.sizeCss = IsChrome ? "modal-dialog-md" : "modal-dialog-sm";

		self.model = new TF.Control.PrintSettingsViewModel();
		self.data(self.model);
	};

	PrintSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	PrintSettingsModalViewModel.prototype.constructor = PrintSettingsModalViewModel;

	/**
	 * Handler when user click the apply button this modal.
	 * @param {Object} returnData the record info which will be apply on the detail screen.
	 * @return {Promise}
	 */
	PrintSettingsModalViewModel.prototype.positiveClose = function(returnData)
	{
		var self = this;
		self.hide();
		self.resolve(true);
	};

	/**
	 * Handler when user close this modal.
	 * @param {Object} result the record info which will be apply on the detail screen.
	 * @return {Promise}
	 */
	PrintSettingsModalViewModel.prototype.negativeClose = function(returnData)
	{
		var self = this;
		self.hide();
		self.resolve(false);
	};
})();