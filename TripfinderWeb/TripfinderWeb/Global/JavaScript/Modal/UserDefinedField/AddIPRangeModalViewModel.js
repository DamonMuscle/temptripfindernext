(function()
{
	createNamespace("TF.Modal.UserDefinedField").AddIPRangeModalViewModel = AddIPRangeModalViewModel;

	function AddIPRangeModalViewModel(options)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.options = options;
		self.modalWidth("500px");
		self._init();
	}

	AddIPRangeModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	AddIPRangeModalViewModel.prototype.constructor = AddIPRangeModalViewModel;

	AddIPRangeModalViewModel.prototype._init = function()
	{
		var self = this,
			title = "IP Range";
		self.sizeCss = "modal-lg";
		self.title(title);
		self.contentTemplate('modal/UserDefinedField/AddIPRange');
		self.buttonTemplate('modal/positivenegative');
		self.obPositiveButtonLabel("Save");
		self.addIPRangeViewModel = new TF.UserDefinedField.AddIPRangeViewModel(self.options);
		self.data(self.addIPRangeViewModel);
	};

	AddIPRangeModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		const self = this;
		if (!self.data().checkIPRangeList())
		{
			self.data().generateIPRangeString();
			this.positiveClose();
		}
	};

	AddIPRangeModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.negativeClose();
	};
})();
