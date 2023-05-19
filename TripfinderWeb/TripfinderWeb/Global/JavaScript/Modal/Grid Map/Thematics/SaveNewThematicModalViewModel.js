(function()
{
	createNamespace("TF.Modal").SaveNewThematicModalViewModel = SaveNewThematicModalViewModel;

	function SaveNewThematicModalViewModel(gridType, parentShortCutKeyName, thematicType, udgridId)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-sm";
		self.modalClass = "saveNewThematic-modal";
		self.title("Save New Thematic");
		self.contentTemplate("Modal/Grid Map/Thematics/SaveNewThematic");
		self.buttonTemplate("modal/positivenegative");

		self.saveNewThematicViewModel = new TF.Control.SaveNewThematicViewModel(gridType, thematicType, udgridId);
		self.data(self.saveNewThematicViewModel);

		self.parentShortCutKeyName = parentShortCutKeyName;
		self.inheritChildrenShortCutKey = false;
	};

	SaveNewThematicModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SaveNewThematicModalViewModel.prototype.constructor = SaveNewThematicModalViewModel;

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	SaveNewThematicModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.data().validate().then(function(result)
		{
			if (result)
			{
				if (self.parentShortCutKeyName)
				{
					self.shortCutKeyHashMapKeyName = self.parentShortCutKeyName;
				}
				self.positiveClose(result);
			}
		});
	};

	/**
	 * React when the negative button is clicked.
	 * @return {void}
	 */
	SaveNewThematicModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.negativeClose(false);
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	SaveNewThematicModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.data().dispose();
	};
})();