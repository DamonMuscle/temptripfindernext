(function()
{
	createNamespace("TF.Modal").PasswordChangeModalViewModel = PasswordChangeModalViewModel;

	function PasswordChangeModalViewModel(currentDatabaseName)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Change Password");
		this.sizeCss = "modal-sm";
		this.obPositiveButtonLabel("Change Password");
		this.contentTemplate('modal/passwordchangecontrol');
		if (currentDatabaseName)
		{
			this.buttonTemplate('modal/positivenegative');
		}
		else
		{
			this.buttonTemplate('modal/positive');
			this.obCloseButtonVisible(false);
		}
		this.passwordChangeViewModel = new TF.Control.PasswordChangeViewModel();
		this.data(this.passwordChangeViewModel);
	}

	PasswordChangeModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	PasswordChangeModalViewModel.prototype.constructor = PasswordChangeModalViewModel;

	PasswordChangeModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		// return this.passwordChangeViewModel.apply()
		// 	.then(function(result)
		// 	{
		// 		if (result)
		// 		{
		// 			this.positiveClose(result);
		// 		} else
		// 		{
		// 			this.negativeClose();
		// 		}
		// 	}.bind(this));
	};

})();
