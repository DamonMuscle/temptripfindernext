(function()
{
	createNamespace("TF.Modal.UserDefinedField").EditUserDefinedFieldModalViewModel = EditUserDefinedFieldModalViewModel;

	function EditUserDefinedFieldModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self._init();
	};

	EditUserDefinedFieldModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	EditUserDefinedFieldModalViewModel.prototype.constructor = EditUserDefinedFieldModalViewModel;

	EditUserDefinedFieldModalViewModel.prototype._init = function()
	{
		var self = this,
			type = self.options ? self.options.gridType : "[Type]",
			isNew = !self.options.dataEntity,
			isCopy = self.options.dataEntity && self.options.dataEntity.isCopy,
			title = (isNew || isCopy ? "Add " : "Edit ") + tf.dataTypeHelper.getDisplayNameByDataType(type) + (self.options.isUDFGroup ? " Question" : " User Defined Field");
		self.sizeCss = "modal-lg";
		self.title(title);
		self.contentTemplate('modal/UserDefinedField/Base');
		self.options.isSystemDefined = self.options.dataEntity != null && self.options.dataEntity.SystemDefined ? self.options.dataEntity.SystemDefined : false
		if (self.options.isSystemDefined)
		{
			self.buttonTemplate('modal/Negative');
		}
		else
		{
			self.buttonTemplate('modal/positivenegative');
		}
		self.obPositiveButtonLabel("Save");
		self.editUserDefinedFieldViewModel = new TF.UserDefinedField.EditUserDefinedFieldViewModel(self.options);
		self.data(self.editUserDefinedFieldViewModel);
	};

	EditUserDefinedFieldModalViewModel.prototype.init = function()
	{
		console.log('EditUserDefinedFieldModalViewModel.prototype.init');
	};

	EditUserDefinedFieldModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		tf.loadingIndicator.showImmediately();
		this.editUserDefinedFieldViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this)).finally(() => tf.loadingIndicator.tryHide());
	};

	EditUserDefinedFieldModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.editUserDefinedFieldViewModel.cancel()
			.then(function()
			{
				this.negativeClose();
				// hide the datepicker when click the x button
				$(".k-animation-container .k-calendar-container").hide();
			}.bind(this));
	};
})();