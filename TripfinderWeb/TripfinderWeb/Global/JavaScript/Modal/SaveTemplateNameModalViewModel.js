(function()
{
	createNamespace("TF.Modal").SaveTemplateNameModalViewModel = SaveTemplateNameModalViewModel;

	function SaveTemplateNameModalViewModel(entity)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-sm";
		self.modalClass = "saveNewThematic-modal";
		self.title("Save Layout");
		self.contentTemplate("modal/SaveDetailName");
		self.buttonTemplate("modal/positivenegative");

		self.SaveTemplateNameViewModel = new TF.Control.SaveTemplateNameViewModel(entity);
		self.data(self.SaveTemplateNameViewModel);

		self.inheritChildrenShortCutKey = false;
	};

	SaveTemplateNameModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SaveTemplateNameModalViewModel.prototype.constructor = SaveTemplateNameModalViewModel;

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	SaveTemplateNameModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.data().validate().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
			}
		});
	};

	/**
	 * React when the negative button is clicked.
	 * @return {void}
	 */
	SaveTemplateNameModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.negativeClose(false);
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	SaveTemplateNameModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.data().dispose();
	};
})();