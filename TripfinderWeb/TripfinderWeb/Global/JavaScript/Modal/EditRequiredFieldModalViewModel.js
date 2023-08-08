(function()
{
	createNamespace("TF.Modal.RequiredField").EditRequiredFieldModalViewModel = EditRequiredFieldModalViewModel;

	function EditRequiredFieldModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self._init();
	};

	EditRequiredFieldModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	EditRequiredFieldModalViewModel.prototype.constructor = EditRequiredFieldModalViewModel;

	EditRequiredFieldModalViewModel.prototype._init = function()
	{
		var self = this,
			type = self.options ? self.options.gridType : "[Type]",
			title = String.format("Add {0} Required Fields", tf.dataTypeHelper.getDisplayNameByDataType(type));
		self.sizeCss = "modal-lg";
		self.title(title);
		self.contentTemplate('modal/RequiredField');
		self.buttonTemplate('modal/positivenegative');
		self.obPositiveButtonLabel("Save");
		self.editRequiredFieldViewModel = new TF.RequiredField.EditRequiredFieldViewModel(self.options);
		self.data(self.editRequiredFieldViewModel);
	};

	EditRequiredFieldModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.editRequiredFieldViewModel.apply().then(function(result)
		{
			if (result != null)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	EditRequiredFieldModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.editRequiredFieldViewModel.cancel()
			.then(function()
			{
				this.negativeClose();
			}.bind(this));
	};
})();