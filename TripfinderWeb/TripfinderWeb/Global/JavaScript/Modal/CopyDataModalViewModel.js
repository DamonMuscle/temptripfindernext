(function()
{
	createNamespace("TF.Modal").CopyDataModalViewModel = CopyDataModalViewModel;

	function CopyDataModalViewModel(data, finishFunc)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.notDelayTrigger = true;
		this.title("Confirmation Message");
		this.sizeCss = TF.isPhoneDevice ? "modal-center unsave-mobile" : "modal-center";
		this.obPositiveButtonLabel("Yes");
		this.obNegativeButtonLabel("No");
		this.contentTemplate('modal/copydatacontrol');
		this.buttonTemplate('modal/positivenegative');
		this.obCustomizeCss("bootbox-button");
		this.model = new TF.Control.CopyDataViewModel(data, finishFunc);
		this.data(this.model);
	}

	CopyDataModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CopyDataModalViewModel.prototype.constructor = CopyDataModalViewModel;

	CopyDataModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		return this.model.apply()
			.then(function(result)
			{
				if (!result)
				{
					this.positiveClose(result);
				}
			}.bind(this));
	};

	CopyDataModalViewModel.prototype.negativeClick = function()
	{
		this.model.cancel().then(function(result)
		{
			if (result)
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};


	CopyDataModalViewModel.prototype.dispose = function()
	{
		this.model.dispose();
	};
})();
