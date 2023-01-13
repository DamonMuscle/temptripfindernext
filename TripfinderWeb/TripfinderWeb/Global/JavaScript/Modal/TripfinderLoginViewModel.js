(function()
{
	createNamespace("TF").TripfinderLoginViewModel = TripfinderLoginViewModel;

	TripfinderLoginViewModel.prototype = Object.create(TF.LoginViewModel.prototype);
	TripfinderLoginViewModel.prototype.constructor = TripfinderLoginViewModel;

	function TripfinderLoginViewModel()
	{
		TF.LoginViewModel.call(this);

		this.obClientKeyWarning = ko.observable(false);
		this.obUsernameWarning = ko.observable(false);
		this.obPasswordWarning = ko.observable(false);
	}

	TripfinderLoginViewModel.prototype.cleanErrorMessage = function(viewModel, e)
	{
		switch (e.currentTarget.name)
		{
			case 'clientId':
				this.obClientKeyWarning(false);
				break;
			case 'userName':
				this.obUsernameWarning(false);
				break;
			case 'password':
				this.obPasswordWarning(false);
				break;
			default:
				break;
		}
	}

	TripfinderLoginViewModel.prototype.backFromMFAtoLogin = function()
	{
		TF.LoginViewModel.prototype.backFromMFAtoLogin.call(this);
		this.$form.data('bootstrapValidator').disableSubmitButtons(false);
	};
})();