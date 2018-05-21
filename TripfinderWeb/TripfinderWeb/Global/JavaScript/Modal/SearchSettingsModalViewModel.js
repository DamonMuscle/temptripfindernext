(function()
{
	createNamespace("TF.Modal").SearchSettingsModalViewModel = SearchSettingsModalViewModel;

	function SearchSettingsModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-med";
		self.modalClass = "searchSettings-modal";
		self.modalWidth("702px");
		self.title("Search Settings");
		self.contentTemplate("Modal/SearchSettingsControl");
		self.buttonTemplate("modal/positivenegativeother");
		self.obPositiveButtonLabel("Save");
		self.obNegativeButtonLabel("Cancel");
		self.obOtherButtonLabel("Revert to Defaults");

		self.searchSettingsViewModel = new TF.Control.SearchSettingsViewModel(options);
		self.data(self.searchSettingsViewModel);
	}

	SearchSettingsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SearchSettingsModalViewModel.prototype.constructor = SearchSettingsModalViewModel;

	SearchSettingsModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		if (self.data().save())
		{
			self.positiveClose();
		}
	};

	SearchSettingsModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose(false);
	};

	SearchSettingsModalViewModel.prototype.otherClick = function()
	{
		this.data().setConfigurations(true);
	};

	SearchSettingsModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
})();