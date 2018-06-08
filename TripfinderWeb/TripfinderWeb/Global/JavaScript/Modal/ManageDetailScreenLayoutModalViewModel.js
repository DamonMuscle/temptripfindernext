(function()
{
	createNamespace("TF.Modal").ManageDetailScreenLayoutModalViewModel = ManageDetailScreenLayoutModalViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function ManageDetailScreenLayoutModalViewModel(gridType, selectId, alwaysApply)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-lg";
		self.title("Manage Layout");
		self.contentTemplate("Modal/ManageDetailScreenLayout");
		self.buttonTemplate("modal/positivenegativeother");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");
		self.obOtherButtonLabel("Import Layout");

		self.manageLayoutViewModel = new TF.Control.ManageDetailScreenLayoutViewModel(gridType, selectId, alwaysApply);
		self.applyToPanel = self.applyToPanel.bind(self);
		self.editToPanel = self.editToPanel.bind(self);
		self.manageLayoutViewModel.onApplyToPanel.subscribe(self.applyToPanel);
		self.manageLayoutViewModel.onEditToPanel.subscribe(self.editToPanel);
		self.data(self.manageLayoutViewModel);
	};

	ManageDetailScreenLayoutModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageDetailScreenLayoutModalViewModel.prototype.constructor = ManageDetailScreenLayoutModalViewModel;

	/**
	 * Handler when user clicks the positive button.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.manageLayoutViewModel.apply().then(function(response)
		{
			if (response !== false)
			{
				self.positiveClose(response ? { isOpenTemp: false, data: response } : false);
			}
		});
	};

	/**
	 * Handler when user click the apply button this modal.
	 * @param {Object} returnData the record info which will be apply on the detail screen.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.positiveClose = function(returnData)
	{
		var self = this;
		self.hide();
		if (returnData === false)
		{
			self.resolve(false);
		}
		else
		{
			self.resolve(returnData ? returnData : self.data());
		}
	};

	/**
	 * Handler when user close this modal.
	 * @param {Object} result the record info which will be apply on the detail screen.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.negativeClose = function(returnData)
	{
		var self = this;
		self.hide();
		if (self.manageLayoutViewModel.isDeleted)
		{
			self.resolve({ isOpenTemp: false, data: { isDeleted: true } });
		}
		else
		{
			self.resolve(returnData ? returnData : false);
		}
	};

	/**
	 * If user click the edit icon on the record.
	 * @param {Event} e The triggered event.
	 * @param {Object} result the record info which will be edit.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.applyToPanel = function(e, result)
	{
		var self = this;
		result.then(function(data)
		{
			if (data)
			{
				self.positiveClose({ isOpenTemp: false, data: data });
			}
			else
			{
				self.positiveClose(false);
			}
		})
	};

	/**
	 * If user double click a record.
	 * @param {Event} e The triggered event.
	 * @param {Object} data the record info which will be apply on the detail screen.
	 * @return {Promise}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.editToPanel = function(e, data)
	{
		this.positiveClose({ isOpenTemp: true, data: data });
	};

	/**
	 * The click event handler for other button.
	 * @param {Event} e 
	 * @param {Object} data 
	 * @return {void}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.otherClick = function(e, data)
	{
		this.manageLayoutViewModel.openImportLayoutFileInput();
	};

	/**
	 * The dispose function.
	 * @returns {void}
	 */
	ManageDetailScreenLayoutModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.manageLayoutViewModel.pageLevelViewModel.clearError();
		self.manageLayoutViewModel.dispose();
	};
})();
