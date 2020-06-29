(function()
{
	createNamespace("TF").SwitchGridMenuViewModel = SwitchGridMenuViewModel;

	function SwitchGridMenuViewModel(options)
	{
		var self = this;
		self.obAllTypes = ko.observableArray(options.availableTypes);
		self.obSelected = ko.observable(options.selectedItem);
		self.selectedItemChanged = options.selectedItemChanged;
		self.chooseItemClick = self.chooseItemClick.bind(self);
		self.obTypeClass = ko.observable((options.typeClass || "general") + "-switch-grid-menu");
	};

	SwitchGridMenuViewModel.prototype.constructor = SwitchGridMenuViewModel;

	SwitchGridMenuViewModel.prototype.chooseItemClick = function(viewModel, e)
	{
		if (viewModel.key == this.obSelected().key) return;
		this.selectedItemChanged.notify(viewModel);
	};

	SwitchGridMenuViewModel.prototype.dispose = function()
	{
		this.obAllTypes = null;
		this.obSelected = null;
		this.selectedItemChanged = null;
	}
})();