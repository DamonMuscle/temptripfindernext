(function()
{
	createNamespace("TF.DetailView").DataEditorSaveConfirmationViewModel = DataEditorSaveConfirmationViewModel;

	function DataEditorSaveConfirmationViewModel(option)
	{
		var self = this;
		// mockupData = [{
		// 	field: "name 1",
		// 	message: "With this change, the student will be unassigned from all current trips."
		// },
		// {
		// 	field: "name 2",
		// 	message: "With this change, all related trip stops' load time will be modified."
		// }];

		self.includeAll = option.includeAll;
		self.option = option;

		self.obPlaceholderText = ko.observable(self.includeAll ? "No more modifications on the page." : "No more confirmation message here.");
		self.obConfirmationList = ko.observableArray(option.messages);

		self.disablePositiveButton = new TF.Events.Event();

		self.revertDataFieldChange = self.revertDataFieldChange.bind(self);
	}

	/**
	 * Modal Initialization.
	 */
	DataEditorSaveConfirmationViewModel.prototype.init = function(data, el)
	{
		var self = this;
		self.$element = $(el);

	};

	/**
	 * Revert the category of data field changes.
	 */
	DataEditorSaveConfirmationViewModel.prototype.revertDataFieldChange = function(obIndex, data, evt)
	{
		var self = this;

		self.option.revertFunc(data.field);
		self.obConfirmationList.remove(data);

		if (self.includeAll && self.obConfirmationList().length === 0)
		{
			self.disablePositiveButton.notify();
		}
	};

	/**
	 * Dispose function.
	 */
	DataEditorSaveConfirmationViewModel.prototype.dispose = function()
	{
		var self = this;

		self.$element = null;
		self.obConfirmationList = null;
	};
})();
