(function()
{
	createNamespace("TF.Modal.UserDefinedField").CaseItemModalViewModel = CaseItemModalViewModel;

	function CaseItemModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/UserDefinedField/CaseItem');
		this.sizeCss = "modal-dialog-lg";
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel("Save");
		this.viewModel = new TF.UserDefinedField.CaseItemViewModel(options);
		this.data(this.viewModel);
		this.title(options.isDefault ? "Default Value" : "Case and Value");
	}

	CaseItemModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	CaseItemModalViewModel.prototype.constructor = CaseItemModalViewModel;

	CaseItemModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.save().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	CaseItemModalViewModel.prototype.negativeClick = function()
	{
		this.viewModel.cancel().then((result) =>
		{
			if (result)
			{
				this.positiveClick();
			}
			else
			{
				this.negativeClose(false);
			}
		});
	};

	CaseItemModalViewModel.prototype.dispose = function()
	{
		this.viewModel.dispose();
	};
})();