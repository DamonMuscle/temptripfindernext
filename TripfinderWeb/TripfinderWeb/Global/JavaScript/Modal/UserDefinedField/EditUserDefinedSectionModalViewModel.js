(function()
{
	createNamespace("TF.Modal.UserDefinedField").EditUserDefinedSectionModalViewModel = EditUserDefinedSectionModalViewModel;

	function EditUserDefinedSectionModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self._init();
	};

	EditUserDefinedSectionModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	EditUserDefinedSectionModalViewModel.prototype.constructor = EditUserDefinedSectionModalViewModel;

	EditUserDefinedSectionModalViewModel.prototype._init = function()
	{
		var self = this,
			isNew = !self.options.dataEntity || self.options.isNew,
			isCopy = self.options.dataEntity && self.options.dataEntity.isCopy,
			title = `${(isNew || isCopy ? "Add" : "Edit")} Section`;
		self.sizeCss = "modal-lg";
		self.title(title);
		self.contentTemplate('modal/UserDefinedField/Section');
		self.buttonTemplate('modal/positivenegative');
		self.obPositiveButtonLabel("Save");
		self.EditUserDefinedSectionViewModel = new TF.UserDefinedField.EditUserDefinedSectionViewModel(self.options);
		self.data(self.EditUserDefinedSectionViewModel);
	};

	EditUserDefinedSectionModalViewModel.prototype.init = function()
	{
		console.log('EditUserDefinedSectionModalViewModel.prototype.init');
	};

	EditUserDefinedSectionModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.EditUserDefinedSectionViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	EditUserDefinedSectionModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.EditUserDefinedSectionViewModel.cancel()
			.then(function()
			{
				this.negativeClose();
			}.bind(this));
	};
})();
