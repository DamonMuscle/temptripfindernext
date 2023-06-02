(function()
{
	createNamespace("TF.Modal.Grid").GlobalReplaceSettingsModalViewModel = GlobalReplaceSettingsModalViewModel;

	function GlobalReplaceSettingsModalViewModel(selectedIds, gridType)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-md";
		self.title("Mass Update");
		self.description("You are about to make global changes to this database.These changes are permanent.");
		self.contentTemplate("Modal/GlobalReplaceSettings");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");

		self.model = new TF.Control.GlobalReplaceSettingsViewModel(selectedIds, gridType);
		self.data(self.model);
	}

	GlobalReplaceSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GlobalReplaceSettingsModalViewModel.prototype.constructor = GlobalReplaceSettingsModalViewModel;

	GlobalReplaceSettingsModalViewModel.prototype.positiveClose = function()
	{
		var self = this, result = self.model.apply();
		if (result)
		{
			if (result.replaceType == "Standard" && !result.targetField && !result.targetUdfId)
			{
				tf.promiseBootbox.alert("The Field Can't Be Null", "Error");
				return;
			}

			self.hide();
			self.resolve(result);
		}
	};

	GlobalReplaceSettingsModalViewModel.prototype.negativeClose = function()
	{
		var self = this;
		self.hide();
		self.resolve(false);
	};
})();