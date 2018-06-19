(function()
{
	createNamespace('TF.Modal').SendEmailModalViewModel = SendEmailModalViewModel;

	function SendEmailModalViewModel(option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Send Email");
		this.contentTemplate('modal/SendEmailControl');
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel("Send Email");
		this.viewModel = new TF.Control.SendEmailViewModel(option);
		this.data(this.viewModel);
	}

	SendEmailModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SendEmailModalViewModel.prototype.constructor = SendEmailModalViewModel;

	SendEmailModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SendEmailModalViewModel.prototype.negativeClick = function()
	{
		this.viewModel.close().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};


	SendEmailModalViewModel.prototype.dispose = function()
	{
		this.viewModel.dispose();
	};

})();

