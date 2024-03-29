﻿(function()
{
	createNamespace("TF.DetailView").SaveDataPointGroupNameModalViewModel = SaveDataPointGroupNameModalViewModel;

	function SaveDataPointGroupNameModalViewModel(entity, groups)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-sm";
		self.modalClass = "saveNewThematic-modal";
		self.title("Save Data Point Group");
		self.contentTemplate("Workspace/detailview/SaveDataPointGroupName");
		self.buttonTemplate("modal/positivenegative");

		self.saveDataPointGroupNameViewModel = new TF.DetailView.SaveDataPointGroupNameViewModel(entity, groups);
		self.data(self.saveDataPointGroupNameViewModel);

		self.inheritChildrenShortCutKey = false;
	};

	SaveDataPointGroupNameModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SaveDataPointGroupNameModalViewModel.prototype.constructor = SaveDataPointGroupNameModalViewModel;

	/**
	 * React when the positive button is clicked.
	 * @return {void}
	 */
	SaveDataPointGroupNameModalViewModel.prototype.positiveClick = function()
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
	SaveDataPointGroupNameModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		self.negativeClose(false);
	};

	/**
	 * Dispose
	 * @return {void}
	 */
	SaveDataPointGroupNameModalViewModel.prototype.dispose = function()
	{
		var self = this;
		self.data().dispose();
	};
})();