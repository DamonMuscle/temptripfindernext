(function()
{
	createNamespace("TF.Modal").SingleInputModalViewModel = SingleInputModalViewModel;

	function SingleInputModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);

		this.contentTemplate('modal/SimpleInput/SingleInput');
		this.buttonTemplate('modal/positivenegative');
		this.title(options.title);
		this.sizeCss = "modal-dialog-sm";

		this.viewModel = new TF.Control.SingleInputViewModel(options);
		this.data(this.viewModel);
	}

	SingleInputModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	SingleInputModalViewModel.prototype.constructor = SingleInputModalViewModel;

	SingleInputModalViewModel.prototype.positiveClick = function()
	{
		this.data().save().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SingleInputModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose(false);
	};
})();